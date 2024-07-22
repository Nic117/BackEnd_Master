import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { logger } from "../utils/Logger.js";
import ProductManager from "./ProductDAO.js";
import { cartModelo } from './models/cartModelo.js';

export default class CartManager {

    async getCarts() {
        try {
            return await cartModelo.find().populate("products.product").lean();
        } catch (error) {
            throw CustomError.createError("getCarts --> cartDAO", "Error al recuperar los carritos", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async createCart() {
        try {
            const cart = await cartModelo.create({ products: [] });
            return cart.toJSON();
        } catch (error) {
            throw CustomError.createError("createCart --> cartDAO", "Error al crear el carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async getCartsBy(filtro = {}) {
        try {
            return await cartModelo.findOne(filtro).populate("products.product").lean();
        } catch (error) {
            throw CustomError.createError("getCartsBy --> cartDAO", "Error al recuperar el carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async getCartsProducts(id) {
        try {
            const carts = await this.getCarts();
            const cart = carts.find(c => c.id === id);
            if (!cart) {
                throw CustomError.createError("getCartsProducts --> cartDAO", "Carrito no encontrado", `No se encontró un carrito con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND);
            }
            return cart.products;
        } catch (error) {
            throw CustomError.createError("getCartsProducts --> cartDAO", "Error al recuperar los productos del carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async addProductToCart(cid, pid) {
        try {
            const cart = await cartModelo.findById(cid);
            if (!cart) {
                throw CustomError.createError("addProductToCart --> cartDAO", "Carrito no encontrado", `No se encontró un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const existingProductIndex = cart.products.findIndex(product => product.product == pid);
            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity++;
            } else {
                const productManager = new ProductManager();
                const product = await productManager.getProductsBy({ _id: pid });
                if (!product) {
                    throw CustomError.createError("addProductToCart --> cartDAO", "Producto no encontrado", `No se encontró un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
                }

                cart.products.push({ product: pid, quantity: 1 });
                logger.info(`Nuevo producto agregado al carrito: ${pid}`);
            }

            await cart.save();
            logger.info(`Carrito guardado correctamente: ${cart}`);
            return cart;
        } catch (error) {
            throw CustomError.createError("addProductToCart --> cartDAO", "Error al agregar el producto al carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCart(cid, products) {
        try {
            const cart = await cartModelo.findByIdAndUpdate(
                cid,
                { $set: { products: products } },
                { returnDocument: "after" }
            );
            if (!cart) {
                throw CustomError.createError("updateCart --> cartDAO", "Carrito no encontrado", `No se encontró un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }
            return cart;
        } catch (error) {
            throw CustomError.createError("updateCart --> cartDAO", "Error al actualizar el carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProductQ(cid, pid, quantity) {
        try {
            const cart = await cartModelo.findOneAndUpdate(
                { _id: cid, "products.product": pid },
                { $set: { "products.$.quantity": quantity } },
                { new: true }
            ).populate("products.product");
            if (!cart) {
                throw CustomError.createError("updateProductQ --> cartDAO", "Carrito o producto no encontrado", `No se encontró un carrito con el ID: ${cid} o producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
            }
            return cart;
        } catch (error) {
            throw CustomError.createError("updateProductQ --> cartDAO", "Error al actualizar la cantidad del producto", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
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
                throw CustomError.createError("deleteAllProductsFromCart --> cartDAO", "Carrito no encontrado", `No se encontró un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            logger.info(`Productos eliminados correctamente del carrito: ${cart}`);
            return cart;
        } catch (error) {
            throw CustomError.createError("deleteAllProductsFromCart --> cartDAO", "Error al eliminar todos los productos del carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteProductFromCart(cid, pid) {
        try {
            const cart = await cartModelo.findById(cid);
            if (!cart) {
                throw CustomError.createError("deleteProductFromCart --> cartDAO", "Carrito no encontrado", `No se encontró un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const productIndex = cart.products.findIndex(product => product.product == pid);
            if (productIndex === -1) {
                throw CustomError.createError("deleteProductFromCart --> cartDAO", "Producto no encontrado", `No se encontró un producto con el ID: ${pid} en el carrito`, TIPOS_ERROR.NOT_FOUND);
            }

            cart.products[productIndex].quantity--;
            if (cart.products[productIndex].quantity <= 0) {
                cart.products.splice(productIndex, 1);
            }

            await cart.save();
            logger.info(`Producto ${pid} eliminado del carrito ${cid}`);
            return cart;
        } catch (error) {
            throw CustomError.createError("deleteProductFromCart --> cartDAO", "Error al eliminar el producto del carrito", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }
}
