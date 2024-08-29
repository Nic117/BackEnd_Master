import { productsModelo } from '../dao/models/productsModelo.js';
import { productService } from "../services/productService.js";
import { cartService } from "../services/cartService.js";
import { CustomError } from '../utils/CustomError.js';
import { TIPOS_ERROR } from '../utils/EErrors.js';
import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/utils.js';

export class ViewController {
    
    static getProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('home', { products });
        } catch (error) {
            CustomError.createError(
                "getProducts --> ViewController", 
                null, 
                "Ocurrió un error inesperado al obtener los productos", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static getRealTimeProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('realTime', { products });
        } catch (error) {
            CustomError.createError(
                "getRealTimeProducts --> ViewController", 
                null, 
                "Ocurrió un error inesperado al obtener los productos en tiempo real", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static getChat = (req, res) => {
        try {
            res.setHeader("Content-Type", "text/html");
            res.status(200).render("chat");
        } catch (error) {
            CustomError.createError(
                "getChat --> ViewController", 
                null, 
                "Ocurrió un error inesperado al cargar el chat", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static getProductsPaginate = async (req, res, next) => {
        try {
            const { page = 1, limit = 10, sort } = req.query;
            const options = { page: Number(page), limit: Number(limit), lean: true };
            const searchQuery = this.buildSearchQuery(req.query);
            
            if (isNaN(page) || page < 1) {
                return this.handleInvalidPage(req, res, page);
            }

            const products = await productService.getProductsPaginate(searchQuery, options);
            if (page > products.totalPages) {
                return this.handleInvalidPage(req, res, page, products.totalPages);
            }

            const { prevPage, nextPage, prevLink, nextLink } = this.buildLinks(req, products, sort);
            const categories = await productsModelo.distinct("category");
            const cart = { _id: req.user.cart };
            const user = req.user;

            res.render("products", {
                status: "success",
                payload: products.docs,
                totalPages: products.totalPages,
                page: parseInt(page),
                hasPrevPage: products.hasPrevPage,
                hasNextPage: products.hasNextPage,
                prevPage, nextPage, prevLink, nextLink,
                categories, cart, user, login: req.user
            });
        } catch (error) {
            next(error);
        }
    }

    static getCartById = async (req, res, next) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            const cart = await cartService.getCartsBy({ _id: req.params.cid });

            if (cart) {
                res.status(200).render("cart", { cart });
            } else {
                CustomError.createError(
                    "getCartById --> ViewController", 
                    "El carrito no existe", 
                    `No existe un carrito con el ID: ${req.params.cid}`, 
                    TIPOS_ERROR.NOT_FOUND
                );
            }
        } catch (error) {
            next(error);
        }
    }

    static register = (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('register', { error: req.query.error });
        } catch (error) {
            CustomError.createError(
                "register --> ViewController", 
                null, 
                "Ocurrió un error inesperado al registrarse", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static login = (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('login', { 
                error: req.query.error, 
                message: req.query.message, 
                login: req.user 
            });
        } catch (error) {
            CustomError.createError(
                "login --> ViewController", 
                null, 
                "Ocurrió un error inesperado al iniciar sesión", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static getProfile = (req, res) => {
        try {
            const user = req.user;
            const documentsJson = JSON.stringify(user);

            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('profile', { 
                user, 
                documentsJson, 
                documents: user.documents, 
                login: req.user 
            });
        } catch (error) {
            CustomError.createError(
                "getProfile --> ViewController", 
                null, 
                "Ocurrió un error inesperado al cargar su perfil", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static forgotPassword = (req, res) => {
        try {
            res.setHeader("Content-Type", "text/html");
            res.status(200).render("forgotPassword");
        } catch (error) {
            CustomError.createError(
                "forgotPassword --> ViewController", 
                null, 
                "Ocurrió un error inesperado al cargar el perfil", 
                TIPOS_ERROR.INTERNAL_SERVER_ERROR
            );
        }
    }

    static generateNewPassword = (req, res) => {
        const { token } = req.params;
        try {
            const decoded = jwt.verify(token, SECRET);
            res.setHeader("Content-Type", "text/html");
            res.status(200).render("generateNewPassword", { token });
        } catch (err) {
            const message = err.name === 'TokenExpiredError' 
                ? "El token ha expirado. Por favor, solicite uno nuevo."
                : "El token no es válido. Por favor, intente de nuevo.";
            res.status(400).render("login", { message });
        }
    }

    static buildSearchQuery = (query) => {
        const searchQuery = {};
        if (query.category) searchQuery.category = query.category;
        if (query.title) searchQuery.title = { $regex: query.title, $options: "i" };
        if (query.stock && !isNaN(parseInt(query.stock))) searchQuery.stock = parseInt(query.stock);
        return searchQuery;
    }

    static buildLinks = (req, products, sort) => {
        const { prevPage, nextPage } = products;
        const baseUrl = req.originalUrl.split("?")[0];
        const sortParam = sort ? `&sort=${sort}` : "";
        const prevLink = prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null;
        const nextLink = nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null;
        return { prevPage, nextPage, prevLink, nextLink };
    }

    static handleInvalidPage = (req, res, page, totalPages = 1) => {
        CustomError.createError(
            "getProductsPaginate --> ViewController",
            `Page value '${page}' is invalid`,
            "El número de página es inválido",
            TIPOS_ERROR.ARGUMENTOS_INVALIDOS
        );
        return res.redirect(`${req.originalUrl.split("?")[0]}?page=1`);
    }
}
