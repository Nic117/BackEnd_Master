import { productsModelo } from '../dao/models/productsModelo.js';
import { productService } from "../services/productService.js";
import { cartService } from "../services/cartService.js";
import { CustomError } from '../utils/CustomError.js';
import { TIPOS_ERROR } from '../utils/EErrors.js';

const setHeadersAndRender = (res, status, view, data = {}) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(status).render(view, data);
};

const handleServiceError = (location, error, message, errorType, next) => {
    CustomError.createError(location, null, message, errorType);
    return next(error);
};

export class ViewController {
    static getProducts = async (req, res, next) => {
        try {
            const products = await productService.getProducts();
            setHeadersAndRender(res, 200, 'home', { products });
        } catch (error) {
            return handleServiceError("getProducts --> ViewController", error, "Un error inesperado ocurrió al obtener los productos", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }

    static getRealTimeProducts = async (req, res, next) => {
        try {
            const products = await productService.getProducts();
            setHeadersAndRender(res, 200, 'realTime', { products });
        } catch (error) {
            return handleServiceError("getRealTimeProducts --> ViewController", error, "Un error inesperado ocurrió al obtener los productos en tiempo real", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }

    static getChat = (req, res, next) => {
        try {
            setHeadersAndRender(res, 200, "chat");
        } catch (error) {
            return handleServiceError("getChat --> ViewController", error, "Un error inesperado ocurrió al cargar el chat", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }

    static getProductsPaginate = async (req, res, next) => {
        const { page = 1, limit = 10, sort, category, title, stock } = req.query;
        let user = req.user;
        let cart = { _id: req.user.cart };

        try {
            const options = { page: Number(page), limit: Number(limit), lean: true };
            const searchQuery = {};

            if (category) searchQuery.category = category;
            if (title) searchQuery.title = { $regex: title, $options: "i" };
            if (stock && !isNaN(parseInt(stock))) searchQuery.stock = parseInt(stock);
            if (sort === "asc" || sort === "desc") options.sort = { price: sort === "asc" ? 1 : -1 };

            const products = await productService.getProductsPaginate(searchQuery, options);
            const categories = await productsModelo.distinct("category");

            const buildLinks = ({ prevPage, nextPage }) => {
                const baseUrl = req.originalUrl.split("?")[0];
                const sortParam = sort ? `&sort=${sort}` : "";

                return {
                    prevPage: prevPage ? parseInt(prevPage) : null,
                    nextPage: nextPage ? parseInt(nextPage) : null,
                    prevLink: prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null,
                    nextLink: nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null,
                };
            };

            const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);
            const requestedPage = isNaN(parseInt(page)) ? 1 : parseInt(page);

            if (requestedPage < 1 || requestedPage > products.totalPages) {
                return handleServiceError(
                    "getProductsPaginate --> ViewController",
                    "Cantidad de páginas inválidas",
                    "Lo sentimos, el sitio aún no cuenta con tantas páginas",
                    TIPOS_ERROR.ARGUMENTOS_INVALIDOS,
                    next
                );
            }

            setHeadersAndRender(res, 200, "products", {
                status: "success",
                payload: products.docs,
                totalPages: products.totalPages,
                page: requestedPage,
                hasPrevPage: products.hasPrevPage,
                hasNextPage: products.hasNextPage,
                prevPage,
                nextPage,
                prevLink,
                nextLink,
                categories,
                cart,
                user,
                login: req.user
            });
        } catch (error) {
            return next(error);
        }
    }

    static getCartById = async (req, res, next) => {
        try {
            const cart = await cartService.getCartsBy({ _id: req.params.cid });

            if (cart) {
                setHeadersAndRender(res, 200, "cart", { cart });
            } else {
                return handleServiceError("getCartById --> ViewController", "El carrito no existe", `No existe un carrito con el ID: ${req.params.cid}`, TIPOS_ERROR.NOT_FOUND, next);
            }
        } catch (error) {
            return next(error);
        }
    }

    static register = (req, res, next) => {
        try {
            setHeadersAndRender(res, 200, 'register', { error: req.query.error });
        } catch (error) {
            return handleServiceError("register --> ViewController", error, "Un error inesperado ocurrió al registrarse", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }

    static login = (req, res, next) => {
        try {
            setHeadersAndRender(res, 200, 'login', { error: req.query.error, message: req.query.message, login: req.user });
        } catch (error) {
            return handleServiceError("login --> ViewController", error, "Un error inesperado ocurrió al iniciar sesión", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }

    static getProfile = (req, res, next) => {
        try {
            setHeadersAndRender(res, 200, 'profile', { user: req.user, login: req.user });
        } catch (error) {
            return handleServiceError("getProfile --> ViewController", error, "Un error inesperado ocurrió al cargar su perfil", TIPOS_ERROR.INTERNAL_SERVER_ERROR, next);
        }
    }
}
