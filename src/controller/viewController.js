import { productsModelo } from '../dao/models/productsModelo.js';
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";
import { CustomError } from '../utils/CustomError.js';
import { TIPOS_ERROR } from '../utils/EErrors.js';

export class ViewController {
    static async getProducts(req, res) {
        try {
            const products = await productService.getProducts();
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('home', { products });
        } catch (error) {
            ViewController.handleServerError(res, error);
        }
    }

    static async getRealTimeProducts(req, res) {
        try {
            const products = await productService.getProducts();
            res.setHeader('Content-Type', 'text/html');
            res.status(200).render('realTime', { products });
        } catch (error) {
            ViewController.handleServerError(res, error);
        }
    }

    static getChat(req, res) {
        try {
            res.setHeader("Content-Type", "text/html");
            res.status(200).render("chat");
        } catch (error) {
            ViewController.handleServerError(res, error);
        }
    }

    static async getProductsPaginate(req, res, next) {
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

            const products = await productService.getProductsPaginate(searchQuery, options);
            const { prevPage, nextPage, prevLink, nextLink } = ViewController.buildLinks(req, products);
            const categories = await productsModelo.distinct("category");

            ViewController.validatePageNumber(req, products);

            res.render("products", {
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
                categories,
                cart: { _id: req.user.cart },
                user: req.user,
                login: req.user
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCartById(req, res) {
        try {
            res.setHeader('Content-Type', 'text/html');
            const cid = req.params.cid;
            const cart = await cartService.getCartsBy({ _id: cid });

            if (cart) {
                res.status(200).render("cart", { cart });
            } else {
                throw new CustomError("El carrito no existe", `No existe un carrito con el ID: ${cid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
        } catch (error) {
            ViewController.handleServerError(res, error);
        }
    }

    static register(req, res) {
        res.setHeader('Content-Type', 'text/html');
        console.log('Parámetros de consulta para registro:', req.query);
        const { error } = req.query;
        res.status(200).render('register', { error });
    }

    static login(req, res) {
        res.setHeader('Content-Type', 'text/html');
        const { error, message } = req.query;
        res.status(200).render('login', { error, message, login: req.user });
    }

    static getProfile(req, res) {
        res.setHeader('Content-Type', 'text/html');
        res.status(200).render('profile', {
            user: req.user,
            login: req.user
        });
    }

    static handleServerError(res, error) {
        console.error('Error en la vista:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Error en el servidor' });
    }

    static buildLinks(req, products) {
        const { prevPage, nextPage } = products;
        const baseUrl = req.originalUrl.split("?")[0];
        const sortParam = req.query.sort ? `&sort=${req.query.sort}` : "";

        const prevLink = prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null;
        const nextLink = nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null;

        return {
            prevPage: prevPage ? parseInt(prevPage) : null,
            nextPage: nextPage ? parseInt(nextPage) : null,
            prevLink,
            nextLink,
        };
    }

    static validatePageNumber(req, products) {
        const requestedPage = parseInt(req.query.page);
        if (isNaN(requestedPage)) {
            throw new CustomError("Page is NaN", "Page debe ser un número", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }
        if (requestedPage < 1 || requestedPage > products.totalPages) {
            throw new CustomError("Cantidad de páginas inválidas", "Lo sentimos, el sitio aún no cuenta con tantas páginas", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }
    }
}
