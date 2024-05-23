import ProductManager from "./ProductManagerMONGO.js";
import { cartModelo } from './models/cartModelo.js';
import mongoose from "mongoose";

export default class CartManager {

    async getCarts() {
        return await cartModelo.find().populate("products.product").lean()
    };

    async createCart() {
        let cart = await cartModelo.create({ products: [] })
        return cart.toJSON();
    };

    async getCartsBy(filtro = {}) {
        return await cartModelo.findOne(filtro).populate("products.product").lean()
    };

    async getCartsProducts(id) {
        const carts = await this.getCarts();
        const cart = carts.find(c => c.id === id);
        return cart.products;
    };

    async addProductToCart(cid, pid) {
        try {
            const cart = await cartModelo.findById(cid);

            if (!cart) {
                return `Carrito con id ${cid} no encontrado`;
            }

            const existingProductIndex = cart.products.findIndex(product => product.product == pid);

            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity++;
            } else {
                const productManager = new ProductManager();
                const product = await productManager.getProductsBy({ _id: pid });

                if (!product || product === "Not found") {
                    console.log(`Producto con id ${pid} no encontrado`);
                    return `Producto con id ${pid} no encontrado`;
                }

                const newProduct = {
                    product: pid,
                    quantity: 1
                };

                cart.products.push(newProduct);
                console.log(`Nuevo producto agregado al carrito: ${newProduct}`);
            }

            await cart.save();
            console.log(`Carrito guardado correctamente: ${cart}`);

            return cart;
        } catch (error) {
            console.log(`Error al añadir producto: ${error}`);
            return `Error al añadir producto: ${error}`;
        }
    };

    async updateCart(cid, products) {
        try {
            let cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: products } },
                { returnDocument: "after" }
            )
            return `Carrito ${JSON.stringify(cart, null, 5)}`
        } catch (error) {
            console.error(error.message);
            return ("Error al actualizar el carrito");
        }
    }

    async updateProductQ(cid, pid, quantity) {
        try {
            let cart = await cartModelo.findOneAndUpdate(
                {_id:cid, "products.product": pid},
                {$set: {"products.$.quantity": quantity}},
                { new: true }
            ).populate("products.product");
            return cart;
        } catch (error) {
            console.error(error.message);
            return ("Error al actualizar la cantidad del producto");
        }
    }

    async deleteAllProductsFromCart(cid) {
        try {
            const cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: [] } },
                { returnDocument: "after" }
            );

            if (!cart) {
                return `Carrito con id ${cid} no encontrado`;
            }

            cart.products = [];

            await cart.save();
            console.log(`Productos eliminados correctamente: ${cart}`);

            return cart;
        } catch (error) {
            return `Error al eliminar los productos del carrito: ${error}`;
        }
    }

    async deleteProductFromCart(cid, pid) {
        try {
            const cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $inc: { 'products.$[product].quantity': -1 } },
                { new: true, arrayFilters: [{ 'product._id': pid }] }
            );

            if (!cart) {
                return `Cart with id ${cid} not found`;
            }

            console.log(`Product removed from cart: ${cart}`);

            return cart;
        } catch (error) {
            console.log(`Error deleting product from cart: ${error}`);
            return `Error deleting product from cart: ${error}`;
        }
    }
};
