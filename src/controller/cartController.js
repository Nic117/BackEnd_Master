import { isValidObjectId } from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import { ticketService } from "../services/ticketService.js";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import nodemailer from 'nodemailer'
import { config } from "../config/config.js";
import { processPurchase } from "../utils/purchaseHelper.js";


export class CartController {
    static getCarts = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const cart = await cartService.getCarts()
            res.status(200).json(cart);
        } catch (error) {
            res.status(500).json({ error: `Error en el servidor`, detalle: `${error.message}` });
        }
    }

    static getCartsById = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const cid = req.params.cid

            if (!isValidObjectId(cid)) {
                CustomError.createError("getCartsById --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const cart = await cartService.getCartsBy({ _id: cid })
            if (cart) {
                res.status(200).json(cart);
            } else {
                CustomError.createError("getCartsById --> cartController", "ID de carrito inválido", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND)
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
        const userId = req.user._id;

        try {
            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                CustomError.createError("addToCart --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            let product = await productService.getProductsBy({ _id: pid });
            if (!product) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("addToCart --> cartController", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND)
            }

            if (product.owner == userId && req.user.rol == "premium") {
                req.logger.info(`El usuario premium ${userId} intentó agregar su propio producto ${pid} al carrito ${cid}`);
                CustomError.createError("addToCart --> cartController", "Sin autorización", `No puede agregar su propio producto al carrito`, TIPOS_ERROR.AUTORIZACION)
            }

            let cart = await cartService.getCartsBy({ _id: cid })
            if (!cart) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("addToCart --> cartController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND)
            }
            let resultado = await cartService.addProductToCart(cid, pid);
            res.status(200).json({ success: true, message: 'Producto agregado exitosamente', resultado })
        } catch (error) {
            return next(error)
        }
    }

    static updateCart = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            let cid = req.params.cid;
            let products = req.body;
            if (!isValidObjectId(cid)) {
                CustomError.createError("updateCart --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("updateCart --> cartController", "Carrito inexistente", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const newCart = await cartService.updateCart(cid, products);
            return res.status(200).json(newCart);
        } catch (error) {
            return next(error);
        }
    }

    static updateQuantity = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const { cid, pid } = req.params;
            let { quantity } = req.body;

            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                CustomError.createError("updateQuantity --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            let productExists = await productService.getProductsBy({ _id: pid });
            if (!productExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("updateQuantity --> cartController", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
            }


            let cartExists = await cartService.getCartsBy({ _id: cid })
            if (!cartExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("updateQuantity --> cartController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const result = await cartService.updateProductQ(cid, pid, quantity);
            return res.status(200).json(result);
        } catch (error) {
            return next(error)
        }
    }

    static clearCart = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'application/json')
            const cid = req.params.cid

            if (!isValidObjectId(cid)) {
                CustomError.createError("clearCart --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            let cartExists = await cartService.getCartsBy({ _id: cid })
            if (!cartExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("clearCart --> cartController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            let carritoEliminado = await cartService.deleteAllProductsFromCart(cid)
            if (carritoEliminado) {
                res.status(200).json({ message: 'El carrito está vacio', carritoEliminado });
            } else {
                CustomError.createError("clearCart --> cartController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND)
            }
        } catch (error) {
            return next(error)
        }
    }

    static deleteProductFromCart = async (req, res, next) => {
        try {

            res.setHeader('Content-Type', 'application/json')
            const { cid, pid } = req.params;

            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                CustomError.createError("deleteProductFromCart --> cartController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            let productExists = await productService.getProductsBy({ _id: pid });
            if (!productExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("deleteProductFromCart --> cartController", "El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            let cartExists = await cartService.getCartsBy({ _id: cid })
            if (!cartExists) {
                res.setHeader('Content-Type', 'application/json');
                CustomError.createError("deleteProductFromCart --> cartController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const cart = await cartService.deleteProductFromCart(cid, pid);

            res.status(200).json({ message: 'Producto eliminado del carrito', cart });

        } catch (error) {
            return next(error)
        }
    }

    static purchase = async (req, res, next) => {

        try {
            const { cid } = req.params;
            const result = await processPurchase(cid, req.user.email);

            return res.status(200).json({
                message: "Compra realizada exitosamente",
                ticket: result.ticket
            });
        } catch (error) {
            return next(error);
        }
    };

}
