import { isValidObjectId } from "mongoose";
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import UserManager from "../dao/UsersDAO.js";
import { ticketService } from "../services/ticketService.js";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

const userService = new UserManager();

class CartController {
    static async getCarts(req, res, next) {
        try {
            const carts = await cartService.getCart();
            res.status(200).json(carts);
        } catch (error) {
            next(new CustomError("Error en el servidor", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR));
        }
    }

    static async getCartsById(req, res, next) {
        try {
            const { cid } = req.params;
            if (!isValidObjectId(cid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("ID de carrito inválido", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            res.status(200).json(cart);
        } catch (error) {
            next(error);
        }
    }

    static async createCart(req, res, next) {
        try {
            const newCart = await cartService.createCart();
            res.status(201).json({ message: "Carrito creado", newCart });
        } catch (error) {
            next(new CustomError("Error en el servidor", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR));
        }
    }

    static async addToCart(req, res, next) {
        try {
            const { cid, pid } = req.params;
            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const product = await productService.getProductsBy({ _id: pid });
            if (!product) {
                throw new CustomError("El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const result = await cartService.addProductToCart(cid, pid);
            res.status(200).json({ success: true, message: 'Producto agregado exitosamente', result });
        } catch (error) {
            next(error);
        }
    }

    static async updateCart(req, res, next) {
        try {
            const { cid } = req.params;
            const products = req.body;

            if (!isValidObjectId(cid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("Carrito inexistente", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const newCart = await cartService.updateCart(cid, products);
            res.status(200).json(newCart);
        } catch (error) {
            next(error);
        }
    }

    static async updateQuantity(req, res, next) {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;

            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const product = await productService.getProductsBy({ _id: pid });
            if (!product) {
                throw new CustomError("El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const result = await cartService.updateProductQ(cid, pid, quantity);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async clearCart(req, res, next) {
        try {
            const { cid } = req.params;
            if (!isValidObjectId(cid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const result = await cartService.deleteAllProductsFromCart(cid);
            res.status(200).json({ message: 'El carrito está vacio', result });
        } catch (error) {
            next(error);
        }
    }

    static async deleteProductFromCart(req, res, next) {
        try {
            const { cid, pid } = req.params;
            if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const product = await productService.getProductsBy({ _id: pid });
            if (!product) {
                throw new CustomError("El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const result = await cartService.deleteProductFromCart(cid, pid);
            res.status(200).json({ message: 'Producto eliminado del carrito', result });
        } catch (error) {
            next(error);
        }
    }

    static async purchase(req, res, next) {
        try {
            const { cid } = req.params;
            if (!isValidObjectId(cid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const cart = await cartService.getCartsBy({ _id: cid });
            if (!cart) {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND);
            }

            const { productosParaFacturar, productosRestantes } = await CartController.processCartProducts(cart.products);
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

            res.status(200).json({
                message: "Compra realizada exitosamente",
                ticket
            });
        } catch (error) {
            next(error);
        }
    }

    static async processCartProducts(productsInCart) {
        let productosParaFacturar = [];
        let productosRestantes = [];

        for (let product of productsInCart) {
            const { product: { _id: pid }, quantity } = product;

            if (!isValidObjectId(pid)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const productData = await productService.getProductsBy({ _id: pid });
            if (!productData) {
                throw new CustomError("El producto no existe", `No existe un producto con el ID: ${pid}`, TIPOS_ERROR.NOT_FOUND);
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

        return { productosParaFacturar, productosRestantes };
    }
}

export { CartController };
