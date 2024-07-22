import { isValidObjectId } from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import { ticketService } from "../services/ticketService.js";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

const validateObjectId = (id, context) => {
    if (!isValidObjectId(id)) {
        throw CustomError.createError(`${context} --> cartController`, "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
    }
};

const validateEntityExistence = async (service, query, context, errorMessage) => {
    const entity = await service(query);
    if (!entity) {
        throw CustomError.createError(`${context} --> cartController`, errorMessage, `No existe un registro con el ID: ${query._id}`, TIPOS_ERROR.NOT_FOUND);
    }
    return entity;
};

export class CartController {
    static getCarts = async (req, res) => {
        try {
            const carts = await cartService.getCarts();
            res.status(200).json(carts);
        } catch (error) {
            res.status(500).json({ error: "Error inesperado en el servidor", detalle: error.message });
        }
    };

    static getCartsById = async (req, res, next) => {
        try {
            const { cid } = req.params;
            validateObjectId(cid, "getCartsById");
            const cart = await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "getCartsById", "ID de carrito inválido");
            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    };

    static createCart = async (req, res) => {
        try {
            const newCart = await cartService.createCart();
            res.status(200).json(`Carrito creado: ${newCart}`);
        } catch (error) {
            res.status(500).json({ error: "Error inesperado en el servidor", detalle: error.message });
        }
    };

    static addToCart = async (req, res, next) => {
        try {
            const { cid, pid } = req.params;
            validateObjectId(cid, "addToCart");
            validateObjectId(pid, "addToCart");

            await validateEntityExistence(productService.getProductsBy, { _id: pid }, "addToCart", "El producto no existe");
            await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "addToCart", "El carrito no existe");

            const resultado = await cartService.addProductToCart(cid, pid);
            res.status(200).json({ success: true, message: 'Producto agregado exitosamente', resultado });
        } catch (error) {
            next(error);
        }
    };

    static updateCart = async (req, res, next) => {
        try {
            const { cid } = req.params;
            const products = req.body;
            validateObjectId(cid, "updateCart");

            await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "updateCart", "Carrito inexistente");

            const updatedCart = await cartService.updateCart(cid, products);
            res.status(200).json(updatedCart);
        } catch (error) {
            next(error);
        }
    };

    static updateQuantity = async (req, res, next) => {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;
            validateObjectId(cid, "updateQuantity");
            validateObjectId(pid, "updateQuantity");

            await validateEntityExistence(productService.getProductsBy, { _id: pid }, "updateQuantity", "El producto no existe");
            await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "updateQuantity", "El carrito no existe");

            const result = await cartService.updateProductQ(cid, pid, quantity);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    static clearCart = async (req, res, next) => {
        try {
            const { cid } = req.params;
            validateObjectId(cid, "clearCart");

            await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "clearCart", "El carrito no existe");

            const carritoEliminado = await cartService.deleteAllProductsFromCart(cid);
            res.status(200).json({ message: 'El carrito está vacio', carritoEliminado });
        } catch (error) {
            next(error);
        }
    };

    static deleteProductFromCart = async (req, res, next) => {
        try {
            const { cid, pid } = req.params;
            validateObjectId(cid, "deleteProductFromCart");
            validateObjectId(pid, "deleteProductFromCart");

            await validateEntityExistence(productService.getProductsBy, { _id: pid }, "deleteProductFromCart", "El producto no existe");
            await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "deleteProductFromCart", "El carrito no existe");

            const cart = await cartService.deleteProductFromCart(cid, pid);
            res.status(200).json({ message: 'Producto eliminado del carrito', cart });
        } catch (error) {
            next(error);
        }
    };

    static purchase = async (req, res, next) => {
        try {
            const { cid } = req.params;
            validateObjectId(cid, "purchase");

            const cart = await validateEntityExistence(cartService.getCartsBy, { _id: cid }, "purchase", "El carrito no existe");
            const productsInCart = cart.products;
            let productosParaFacturar = [];
            let productosRestantes = [];

            for (let { product: { _id: pid }, quantity } of productsInCart) {
                validateObjectId(pid, "purchase");

                const productData = await validateEntityExistence(productService.getProductsBy, { _id: pid }, "purchase", "El producto no existe");

                if (productData.stock < quantity) {
                    productosRestantes.push({ product: { _id: pid }, quantity });
                } else {
                    await productService.updateProduct(pid, { stock: productData.stock - quantity });
                    productosParaFacturar.push({ product: productData, quantity });
                }
            }

            const totalAmount = productosParaFacturar.reduce((total, { product, quantity }) => total + (product.price * quantity), 0);
            const ticket = await ticketService.createTicket({
                code: `T-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                purchase_datetime: new Date(),
                purchaser: req.user.email,
                products: productosParaFacturar.map(({ product, quantity }) => ({
                    pid: product._id,
                    title: product.title,
                    price: product.price,
                    quantity,
                    subtotal: product.price * quantity
                })),
                amount: totalAmount
            });

            await cartService.updateCart(cid, productosRestantes);
            res.status(200).json({ message: "Compra realizada exitosamente", ticket });
        } catch (error) {
            next(error);
        }
    };
}
