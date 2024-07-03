import { productsModelo } from '../dao/models/productsModelo.js';
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";

const handleError = (res, error, statusCode = 500, message = "Error en el servidor") => {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json({ error: message });
};

const renderHtml = (res, statusCode, view, data = {}) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(statusCode).render(view, data);
};

export class ViewController {
    static getProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            renderHtml(res, 200, 'home', { products });
        } catch (error) {
            handleError(res, error);
        }
    }

    static getRealTimeProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            renderHtml(res, 200, 'realTime', { products });
        } catch (error) {
            handleError(res, error);
        }
    }

    static getChat = (req, res) => {
        try {
            renderHtml(res, 200, 'chat');
        } catch (error) {
            handleError(res, error);
        }
    }

    static getProductsPaginate = async (req, res) => {
        const { page = 1, limit = 10, sort, category, title, stock } = req.query;
        const user = req.user;
        const cart = { _id: user.cart };

        try {
            const options = {
                page: Number(page),
                limit: Number(limit),
                lean: true,
                sort: sort === 'asc' || sort === 'desc' ? { price: sort === 'asc' ? 1 : -1 } : undefined,
            };

            const searchQuery = {
                ...(category && { category }),
                ...(title && { title: { $regex: title, $options: 'i' } }),
                ...(stock && !isNaN(parseInt(stock)) && { stock: parseInt(stock) }),
            };

            const buildLinks = (products) => {
                const { prevPage, nextPage } = products;
                const baseUrl = req.originalUrl.split('?')[0];
                const sortParam = sort ? `&sort=${sort}` : '';

                return {
                    prevPage: prevPage ? parseInt(prevPage) : null,
                    nextPage: nextPage ? parseInt(nextPage) : null,
                    prevLink: prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null,
                    nextLink: nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null,
                };
            };

            const products = await productService.getProductsPaginate(searchQuery, options);
            const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);
            const categories = await productsModelo.distinct('category');

            const requestedPage = isNaN(parseInt(page)) ? 1 : parseInt(page);
            if (requestedPage < 1 || requestedPage > products.totalPages) {
                return res.status(400).json({ error: `Página no válida` });
            }

            renderHtml(res, 200, 'products', {
                status: 'success',
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
                login: req.user,
            });
        } catch (error) {
            handleError(res, error);
        }
    }

    static getCartById = async (req, res) => {
        try {
            const cart = await cartService.getCartsBy({ _id: req.params.cid });
            if (cart) {
                renderHtml(res, 200, 'cart', { cart });
            } else {
                res.status(404).json({ error: `No existe un carrito con el ID: ${req.params.cid}` });
            }
        } catch (error) {
            handleError(res, error);
        }
    }

    static register = (req, res) => {
        const { error } = req.query;
        renderHtml(res, 200, 'register', { error });
    }

    static login = (req, res) => {
        const { error, message } = req.query;
        renderHtml(res, 200, 'login', { error, message, login: req.user });
    }

    static getProfile = (req, res) => {
        renderHtml(res, 200, 'profile', { user: req.user, login: req.user });
    }
}
