import { cartService } from "../services/cartService.js";
import { ticketService } from "../services/ticketService.js";
import { productService } from "../services/productService.js";
import { CustomError } from "./CustomError.js";
import { config } from '../config/config.js';
import { isValidObjectId } from "mongoose";
import { TIPOS_ERROR } from './EErrors.js';
import nodemailer from 'nodemailer';

export async function processPurchase(cartId, userEmail) {
    if (!isValidObjectId(cartId)) {
        throw CustomError.createError("purchaseHelper --> processPurchase", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
    }

    const cart = await cartService.getCartsBy({ _id: cartId });
    if (!cart) {
        throw CustomError.createError("purchaseHelper --> processPurchase", "El carrito no existe", `No existe un carrito con el ID: ${cartId}`, TIPOS_ERROR.NOT_FOUND);
    }

    const productsInCart = cart.products;
    let productosParaFacturar = [];
    let productosRestantes = [];

    for (let product of productsInCart) {
        const { product: { _id: pid }, quantity } = product;
        if (!isValidObjectId(pid)) {
            throw CustomError.createError("purchaseHelper --> processPurchase", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        const productData = await productService.getProductsBy({ _id: pid });
        if (!productData) {
            throw CustomError.createError("purchaseHelper --> processPurchase", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
        }

        if (productData.stock < quantity) {
            productosRestantes.push(product);
        } else {
            const newStock = productData.stock - quantity;
            await productService.updateProduct(pid, { stock: newStock });

            productosParaFacturar.push({
                product: productData,
                quantity
            });
        }
    }

    const totalAmount = productosParaFacturar.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const ticket = await ticketService.createTicket({
        code: `T-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        purchase_datetime: new Date(),
        purchaser: userEmail,
        products: productosParaFacturar.map(item => ({
            pid: item.product._id,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity
        })),
        amount: totalAmount
    });

    await cartService.updateCart(cartId, productosRestantes);

    const transport = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        auth: {
            user: `${config.APP_MAIL_DIR}`,
            pass: `${config.APP_MAIL_PASS}`,
        },
    });

    await transport.sendMail({
        from: `Confirmación de compra <${config.APP_MAIL_DIR}>`,
        to: userEmail,
        subject: 'Ticket de compra',
        html: `
        <h1>Gracias por tu compra!</h1>
        <p>Tu ticket de compra es: ${ticket.code}</p>
        <p>Detalles de la compra:</p>
        <ul>${productosParaFacturar.map(item => `<li>${item.product.title}: ${item.quantity} x $${item.product.price} = $${item.quantity * item.product.price}</li>`).join('')}</ul>
        <p>Total: $${totalAmount}</p>
        `
    });

    return {
        ticket,
        productosParaFacturar,
        productosRestantes,
        totalAmount
    };
}
