import { productsModelo } from '../dao/models/productsModelo.js';
import { productService } from "../services/productService.js";
import { cartService } from "../services/cartService.js";
import { CustomError } from '../utils/CustomError.js';
import { TIPOS_ERROR } from '../utils/EErrors.js';
import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/utils.js';
import { ticketService } from '../services/ticketService.js';
import { isValidObjectId } from "mongoose";
import { processPurchase } from '../utils/purchaseHelper.js';
import { userService } from '../services/userService.js';




export class ViewController {
    static getProducts = async (req, res) => {

        req.logger.info("Prueba log info")
        let products
        try {
            products = await productService.getProducts()
        } catch (error) {
            CustomError.createError("getProducts --> ViewController", null, "Un error inesperado ocurrió al obtener los productos", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
        res.setHeader('Content-Type', 'text/html')
        res.status(200).render('home', { products })
    };

    static getRealTimeProducts = async (req, res) => {
        let products
        let user = req.user;
        let cart = { _id: req.user.cart }
        const isAdmin = user && user.rol === 'admin';
        try {
            products = await productService.getProducts();
        } catch (error) {
            CustomError.createError("getRealTimeProducts --> ViewController", null, "Un error inesperado ocurrió al obtener los productos en tiempo real", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
        res.setHeader('Content-Type', 'text/html')
        res.status(200).render('realTime', { products, user, cart, login: req.user, isAdmin })
    };

    static getChat = (req, res) => {
        try {
            let cart = { _id: req.user.cart }
            res.setHeader("Content-Type", "text/html")
            res.status(200).render("chat", { user: req.user, cart, login: req.user })
        } catch (error) {
            CustomError.createError("getChat --> ViewController", null, "Un error inesperado ocurrió al cargar el chat", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    };

    static getProductsPaginate = async (req, res, next) => {

        let user = req.user;
        let cart = { _id: req.user.cart }
        try {
            const { page = 1, limit = 10, sort } = req.query;

            const options = {
                page: Number(page),
                limit: Number(limit),
                lean: true,
            };

            const searchQuery = {};

            if (req.query.category) {
                searchQuery.category = req.query.category;
            }

            if (req.query.title) {
                searchQuery.title = { $regex: req.query.title, $options: "i" };
            }

            if (req.query.stock) {
                const stockNumber = parseInt(req.query.stock);
                if (!isNaN(stockNumber)) {
                    searchQuery.stock = stockNumber;
                }
            }

            if (sort === "asc" || sort === "desc") {
                options.sort = { price: sort === "asc" ? 1 : -1 };
            }

            const buildLinks = (products) => {
                const { prevPage, nextPage } = products;
                const baseUrl = req.originalUrl.split("?")[0];
                const sortParam = sort ? `&sort=${sort}` : "";

                const prevLink = prevPage
                    ? `${baseUrl}?page=${prevPage}${sortParam}`
                    : null;
                const nextLink = nextPage
                    ? `${baseUrl}?page=${nextPage}${sortParam}`
                    : null;

                return {
                    prevPage: prevPage ? parseInt(prevPage) : null,
                    nextPage: nextPage ? parseInt(nextPage) : null,
                    prevLink,
                    nextLink,
                };
            };

            const products = await productService.getProductsPaginate(
                searchQuery,
                options
            );
            const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);
            const categories = await productsModelo.distinct("category");

            let requestedPage = parseInt(page);
            if (isNaN(requestedPage)) {
                CustomError.createError("getProductsPaginate --> ViewController", "Page is NaN", "Page debe ser un número", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }
            if (requestedPage < 1) {
                requestedPage = 1;
            }

            if (requestedPage > products.totalPages) {
                CustomError.createError("getProductsPaginate --> ViewController", "Cantidad de páginas inválidas", "Lo sentimos, el sitio aún no cuenta con tantas páginas", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            return res.render("products", {
                status: "success",
                payload: products.docs,
                totalPages: products.totalPages,
                page: parseInt(page),
                hasPrevPage: products.hasPrevPage,
                hasNextPage: products.hasNextPage,
                prevPage,
                nextPage,
                prevLink,
                nextLink,
                categories: categories,
                cart,
                user,
                login: req.user
            });
        } catch (error) {
            return next(error)
        }
    };

    static getCartById = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            let cid = req.params.cid
            let cart = await cartService.getCartsBy({ _id: cid })

            if (cart) {
                const updatedProducts = cart.products.map(product => ({
                    ...product,
                    subtotal: product.product.price * product.quantity
                }));

                const totalAmount = updatedProducts.reduce((total, item) => total + item.subtotal, 0);

                res.status(200).render("cart", { cart: { ...cart, products: updatedProducts }, user: req.user, totalAmount, login: req.user });
            } else {
                CustomError.createError("getCartById --> ViewController", "El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.NOT_FOUND)
            }

        } catch (error) {
            return next(error)
        }
    };

    static register = (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            let { error } = req.query;
            res.status(200).render('register', { error });
        } catch (error) {
            CustomError.createError("register --> ViewController", null, "Un error inesperado ocurrió al registrarse", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    };


    static login = (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            let { error, message } = req.query
            res.status(200).render('login', { error, message, login: req.user })
        } catch (error) {
            CustomError.createError("login --> ViewController", null, "Un error inesperado ocurrió al iniciar sesión", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    };

    static getProfile = (req, res) => {
        try {
            const documentsJson = JSON.stringify(req.user);
            const user = req.user
            let cart = { _id: req.user.cart }

            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('profile', { user, documentsJson, documents: user.documents, login: req.user, cart })
        } catch (error) {
            CustomError.createError("getProfile --> ViewController", null, "Un error inesperado ocurrió al cargar su perfil", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    };

    static forgotPassword = (req, res) => {
        try {
            let cart = { _id: req.user.cart }
            res.setHeader("Content-Type", "text/html")
            res.status(200).render("forgotPassword", { user: req.user, login: req.user, cart })
        } catch (error) {
            CustomError.createError("forgotPassword --> ViewController", null, "Un error inesperado ocurrió al cargar su perfil", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    };

    static generateNewPassword = (req, res) => {
        let token = req.params.token
        let decoded
        try {
            decoded = jwt.verify(token, SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.error('El token ha expirado.');
            } else if (err.name === 'JsonWebTokenError') {
                console.error('El token no es válido.');
            } else {
                console.error('Error al verificar el token:', err);
            }
            return res.status(400).render("login", { message: "El token ha expirado o es inválido, por favor intente de nuevo." });
        }

        if (decoded) {
            res.setHeader("Content-Type", "text/html");
            return res.status(200).render("generateNewPassword", { token: token });
        } else {
            res.setHeader("Content-Type", "text/html");
            res.status(200).render("login", { message: "El token ha expirado o es incorrecto, por favor intente de nuevo." });
        }
    };

    static purchase = async (req, res, next) => {
        try {
            if (!req.user || !req.user.cart) {
                return next(CustomError.createError("purchase --> viewController", "El carrito no existe", `No existe un carrito con el ID: ${cartId}`, TIPOS_ERROR.NOT_FOUND));
            }

            let cart = { _id: req.user.cart }
            const cartId = req.user.cart;
            const result = await processPurchase(cartId, req.user.email);

            const purchaseData = {
                ticketId: result.ticket._id,
                amount: result.ticket.amount,
                purchaser: result.ticket.purchaser,
                productosProcesados: result.productosParaFacturar,
                productosNoProcesados: result.productosRestantes,
                cartId: cartId
            };

            return res.render("purchase", {
                payload: purchaseData,
                processedAmount: result.totalAmount,
                notProcessedAmount: result.productosRestantes.reduce((total, item) => total + (item.product.price * item.quantity), 0),
                user: req.user,
                login: req.user,
                cart
            });
        } catch (error) {
            return next(error);
        }
    };

    static adminPanel = async (req, res) => {
        const userId = req.user._id;
        const user = req.user;
        let cart = { _id: req.user.cart };
        const users = await userService.getAllUser();

        res.render('adminPanel', { body: 'adminPanel', isAdminPanel: true, user, users, userId, login: req.user, cart, isAdmin: user.rol === 'admin' });
    };
};
