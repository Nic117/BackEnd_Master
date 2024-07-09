import { isValidObjectId } from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import UserManager from "../dao/UsersDAO.js";
import { ticketService } from "../services/ticketService.js";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

const userService = new UserManager()

export class CartController {
    static getCarts = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const cart = await cartService.getCart()
            res.status(200).json(cart);
        } catch (error) {
            res.status(500).json({ error: `Error inesperado en el servidor`, detalle: `${error.message}` });
        }
    }

    static getCartsById = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const cid = req.params.cid

            if (!isValidObjectId(cid)) {
                CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const cart = await cartService.getCartsBy({ _id: cid })
            if (cart) {
                res.status(200).json(cart);
            } else {
                CustomError.createError("Error", "ID de carrito inválido", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND)
            }
        } catch (error) {
            return next(error)
        }
    }

    static createCart = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const newCart = await cartService.createCart();
            res.status(200).json(`Carrito creado: ${newCart}`)
        } catch (error) {
            res.status(500).json({ error: `Error inesperado en el servidor`, detalle: `${error.message}` });
        }
    }

    static addToCart = async (req, res, next) => {

        res.setHeader('Content-Type', 'application/json')
        const { cid, pid } = req.params;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        let productExists = await productService.getProductsBy({ _id: pid });
        if (!productExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        let cartExists = await cartService.getCartsBy({ _id: cid })
        if (!cartExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }
        try {
            let resultado = await cartService.addProductToCart(cid, pid);
            res.status(200).json({ success: true, message: 'Producto agregado exitosamente', resultado })
        } catch (error) {
            return next(error)
        }
    }

    static updateCart = async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        let cid = req.params.cid;
        let products = req.body;
        if (!isValidObjectId(cid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        let cartExists = await cartService.getCartsBy({ _id: cid });
        if (!cartExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "Carrito inexistente", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
        }

        try {
            const newCart = await cartService.updateCart(cid, products);
            return res.status(200).json(newCart);
        } catch (error) {
            return next(error);
        }
    }

    static updateQuantity = async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        const { cid, pid } = req.params;
        let { quantity } = req.body;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        let productExists = await productService.getProductsBy({ _id: pid });
        if (!productExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }


        let cartExists = await cartService.getCartsBy({ _id: cid })
        if (!cartExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        try {
            const result = await cartService.updateProductQ(cid, pid, quantity);
            return res.status(200).json(result);
        } catch (error) {
            return next(error)
        }
    }

    static clearCart = async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        const cid = req.params.cid

        if (!isValidObjectId(cid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        let cartExists = await cartService.getCartsBy({ _id: cid })
        if (!cartExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        try {
            let carritoEliminado = await cartService.deleteAllProductsFromCart(cid)
            if (carritoEliminado) {
                res.status(200).json({ message: 'El carrito está vacio', carritoEliminado });
            } else {
                CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            return next(error)
        }
    }

    static deleteProductFromCart = async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        const { cid, pid } = req.params;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        let productExists = await productService.getProductsBy({ _id: pid });
        if (!productExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        let cartExists = await cartService.getCartsBy({ _id: cid })
        if (!cartExists) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }


        try {
            const cart = await cartService.deleteProductFromCart(cid, pid);

            if (cart) {
                res.status(200).json({ message: 'Producto eliminado del carrito', cart });
            } else {
                CustomError.createError("Error", "El carrito o producto no existen", `No existe un carrito con el ID: ${cid}, o un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }
        } catch (error) {
            return next(error)
        }
    }

    static purchase = async (req, res) => {
        const { cid } = req.params;

        if (!isValidObjectId(cid)) {
            CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        try {
            const cart = await cartService.getCartsBy({ _id: cid });

            if (!cart) {
                CustomError.createError("Error", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const productsInCart = cart.products;
            let productosParaFacturar = [];
            let productosRestantes = [];

            for (let product of productsInCart) {
                const { product: { _id: pid }, quantity } = product;

                if (!isValidObjectId(pid)) {
                    CustomError.createError("Error", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
                }

                const productData = await productService.getProductsBy({ _id: pid });

                if (!productData) {
                    CustomError.createError("Error", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
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
                purchaser: req.user.email,
                products: productosParaFacturar.map(item => ({
                    pid: item.product._id,
                    title: item.product.title,
                    price: item.product.price,
                    quantity: item.quantity,
                    subtotal: item.product.price * item.quantity
                })),
                amount: totalAmount
            });

            await cartService.updateCart(cid, productosRestantes);

            return res.status(200).json({
                message: "Compra realizada exitosamente",
                ticket
            });
        } catch (error) {
            return next(error)
        }
    };
}
