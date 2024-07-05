import { isValidObjectId } from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";

export class CartController {
    static getCarts = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const carts = await cartService.getCarts();
            res.status(200).json(carts);
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static getCartsById = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const cid = req.params.cid;

            if (!isValidObjectId(cid)) {
                return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (cart) {
                res.status(200).json(cart);
            } else {
                res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static createCart = async (req, res) => {
        try {
            res.setHeader('Content-Type', 'application/json');
            const newCart = await cartService.createCart();
            res.status(201).json({ message: 'Carrito creado', newCart });
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static addToCart = async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const { cid, pid } = req.params;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
        }

        try {
            let productExists = await productService.getProductsBy({ _id: pid });
            if (!productExists) {
                return res.status(400).json({ error: `No existe un producto con el ID: ${pid}` });
            }

            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                return res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }

            let resultado = await cartService.addProductToCart(cid, pid);
            res.status(200).json({ success: true, message: 'Producto agregado exitosamente', resultado });
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static updateCart = async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const cid = req.params.cid;
        const products = req.body;

        if (!isValidObjectId(cid)) {
            return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
        }

        try {
            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                return res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }

            const newCart = await cartService.updateCart(cid, products);
            res.status(200).json(newCart);
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static updateQuantity = async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
        }

        try {
            let productExists = await productService.getProductsBy({ _id: pid });
            if (!productExists) {
                return res.status(400).json({ error: `No existe un producto con el ID: ${pid}` });
            }

            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                return res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }

            const result = await cartService.updateProductQ(cid, pid, quantity);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static clearCart = async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const cid = req.params.cid;

        if (!isValidObjectId(cid)) {
            return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
        }

        try {
            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                return res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }

            let carritoEliminado = await cartService.deleteAllProductsFromCart(cid);
            if (carritoEliminado) {
                res.status(200).json({ message: 'Todos los productos eliminados del carrito', carritoEliminado });
            } else {
                res.status(404).json({ message: 'Carrito no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error inesperado en el servidor', detalle: error.message });
        }
    }

    static deleteProductFromCart = async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const { cid, pid } = req.params;

        if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
            return res.status(400).json({ error: 'Ingrese un ID de MongoDB válido' });
        }

        try {
            let productExists = await productService.getProductsBy({ _id: pid });
            if (!productExists) {
                return res.status(400).json({ error: `No existe un producto con el ID: ${pid}` });
            }

            let cartExists = await cartService.getCartsBy({ _id: cid });
            if (!cartExists) {
                return res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }

            const cart = await cartService.deleteProductFromCart(cid, pid);
            if (cart) {
                res.status(200).json({ message: 'Producto eliminado del carrito', cart });
            } else {
                res.status(404).json({ message: 'Carrito o producto no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error eliminando producto del carrito', error });
        }
    }
}
