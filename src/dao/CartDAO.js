import { cartModelo } from './models/cartModelo.js';
import ProductManager from "./ProductDAO.js";

export default class CartManager {

    async getCarts() {
        try {
            return await cartModelo.find().populate("products.product").lean();
        } catch (error) {
            console.error(`Error al obtener carritos: ${error}`);
            throw new Error("Error al obtener los carritos");
        }
    }

    async createCart() {
        try {
            const cart = await cartModelo.create({ products: [] });
            return cart.toJSON();
        } catch (error) {
            console.error(`Error al crear un carrito: ${error}`);
            throw new Error("Error al crear un nuevo carrito");
        }
    }

    async getCartsBy(filtro = {}) {
        try {
            return await cartModelo.findOne(filtro).populate("products.product").lean();
        } catch (error) {
            console.error(`Error al obtener carrito por filtro: ${error}`);
            throw new Error("Error al obtener carrito por filtro");
        }
    }

    async getCartsProducts(id) {
        try {
            const carts = await this.getCarts();
            const cart = carts.find(c => c.id === id);
            return cart ? cart.products : [];
        } catch (error) {
            console.error(`Error al obtener productos del carrito: ${error}`);
            throw new Error("Error al obtener productos del carrito");
        }
    }

    async addProductToCart(cid, pid) {
        try {
            let cart = await cartModelo.findById(cid);

            if (!cart) {
                throw new Error(`Carrito con id ${cid} no encontrado`);
            }

            const existingProductIndex = cart.products.findIndex(product => product.product == pid);

            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity++;
            } else {
                const productManager = new ProductManager();
                const product = await productManager.getProductsBy({ _id: pid });

                if (!product || product === "Not found") {
                    throw new Error(`Producto con id ${pid} no encontrado`);
                }

                cart.products.push({
                    product: pid,
                    quantity: 1
                });
            }

            await cart.save();
            return cart;
        } catch (error) {
            console.error(`Error al añadir producto al carrito: ${error}`);
            throw new Error("Error al añadir producto al carrito");
        }
    }

    async updateCart(cid, products) {
        try {
            return await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: products } },
                { new: true }
            );
        } catch (error) {
            console.error(`Error al actualizar el carrito: ${error}`);
            throw new Error("Error al actualizar el carrito");
        }
    }

    async updateProductQ(cid, pid, quantity) {
        try {
            return await cartModelo.findOneAndUpdate(
                { _id: cid, "products.product": pid },
                { $set: { "products.$.quantity": quantity } },
                { new: true }
            ).populate("products.product");
        } catch (error) {
            console.error(`Error al actualizar la cantidad del producto: ${error}`);
            throw new Error("Error al actualizar la cantidad del producto");
        }
    }

    async deleteAllProductsFromCart(cid) {
        try {
            return await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: [] } },
                { new: true }
            );
        } catch (error) {
            console.error(`Error al eliminar todos los productos del carrito: ${error}`);
            throw new Error("Error al eliminar todos los productos del carrito");
        }
    }

    async deleteProductFromCart(cid, pid) {
        try {
            return await cartModelo.findOneAndUpdate(
                { _id: cid, "products.product": pid },
                { $inc: { 'products.$.quantity': -1 } },
                { new: true }
            );
        } catch (error) {
            console.error(`Error al eliminar el producto del carrito: ${error}`);
            throw new Error("Error al eliminar el producto del carrito");
        }
    }
}
