import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { logger } from "../utils/Logger.js";
import ProductManager from "./ProductDAO.js";
import { cartModelo } from './models/cartModelo.js';
import { productsModelo } from "./models/productsModelo.js";

export default class CartManager {

    async getCarts() {
        return await cartModelo.find().populate("products.product").lean();
    };

    async createCart() {
        let cart = await cartModelo.create({ products: [] });
        return cart.toJSON();
    };

    async getCartsBy(filtro = {}) {
        return await cartModelo.findOne(filtro).populate("products.product").lean();
    };

    async getCartsProducts(id) {
        const carts = await this.getCarts();
        const cart = carts.find(c => c.id === id);
        return cart.products;
    };

    async addProductToCart(cid, pid, next) {
        try {
            const cart = await cartModelo.findById(cid);

            if (!cart) {
                logger.error(`Carrito con id ${cid} no encontrado`);
            }

            const existingProductIndex = cart.products.findIndex(product => product.product == pid);

            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity++;
            } else {
                const productManager = new ProductManager();
                const product = await productManager.getProductsBy({ _id: pid });

                if (!product || product === "Not found") {
                    logger.error(`Producto con id ${pid} no encontrado`);
                }

                const newProduct = {
                    product: pid,
                    quantity: 1
                };

                cart.products.push(newProduct);
                logger.info(`Nuevo producto agregado al carrito: ${newProduct}`);
            }

            await cart.save();
            logger.info(`Carrito guardado correctamente: ${cart}`);

            return cart;
        } catch (error) {
            return next(error)
        }
    };

    async updateCart(cid, products) {
        try {
            let cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: products } },
                { returnDocument: "after" }
            );
            return `Carrito ${JSON.stringify(cart, null, 5)}`
        } catch (error) {
            throw new Error(`Error al actualizar el carrito: ${error.message}`);
        }
    };

    async updateProductQ(cid, pid, quantity) {
        try {
            let cart = await cartModelo.findOneAndUpdate(
                { _id: cid, "products.product": pid },
                { $set: { "products.$.quantity": quantity } },
                { new: true }
            ).populate("products.product");
            return cart;
        } catch (error) {
            throw new Error(`Error al actualizar la cantidad total de productos en el carrito: ${error.message}`);
        }
    };

    async deleteAllProductsFromCart(cid, next) {
        try {
            const cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: [] } },
                { returnDocument: "after" }
            );

            if (!cart) {
                throw new Error(`Carrito no encontrado con el ID: ${cid}`);
            }

            cart.products = [];

            await cart.save();
            logger.info(`Productos eliminados correctamente: ${cart}`);

            return cart;
        } catch (error) {
            throw new Error(`Error al obtener la cantidad total de productos en el carrito: ${error.message}`);
        }
    };

    async deleteProductFromCart(cid, pid, next) {
        try {
            const cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $inc: { 'products.$[product].quantity': -1 } },
                { new: true, arrayFilters: [{ 'product.product': pid }] }
            );

            if (!cart) {
                throw new Error(`Carrito no encontrado con el ID: ${cid}`);
            }

            const updatedProduct = cart.products.find(p => p.product == pid);
            if (updatedProduct.quantity <= 0) {
                cart.products.pull({ product: pid });
                await cart.save();
            }

            return cart;
        } catch (error) {
            return next(error)
        }
    };


    async insertArray(cid, products) {
        try {
            const arr = [];
            for (const item of products) {
                if (!item.product._id) {
                    throw new Error("Producto sin ID detectado");
                }
                const object = await productsModelo.findById(item.product._id);

                if (!object) {
                    throw new Error(`Producto con ID ${item.product._id} no encontrado`);
                }

                arr.push({
                    _id: object._id,
                    quantity: item.quantity,
                });
            }
            const filter = { _id: cid };
            const update = { $set: { products: arr } };
            const updateCart = await cartModelo.findOneAndUpdate(filter, update, {
                new: true,
            });
            return updateCart;
        } catch (error) {
            throw new Error("Error al insertar productos en el carrito");
        }
    }
};
