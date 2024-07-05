import { productsModelo } from '../dao/models/productsModelo.js';
import { cartService } from "../services/cartService.js";
import { productService } from "../services/productService.js";

const handleServerError = (res, error) => {
    console.error(error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: "Error interno del servidor - Intente más tarde, o contacte a su administrador" });
};

const setResponseHeaders = (res, type = 'text/html') => {
    res.setHeader('Content-Type', type);
};

export class ViewController {
    static getProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            setResponseHeaders(res);
            res.status(200).render('home', { products });
        } catch (error) {
            handleServerError(res, error);
        }
    }

    static getRealTimeProducts = async (req, res) => {
        try {
            const products = await productService.getProducts();
            setResponseHeaders(res);
            res.status(200).render('realTime', { products });
        } catch (error) {
            handleServerError(res, error);
        }
    }

    static getChat = (req, res) => {
        try {
            setResponseHeaders(res);
            res.status(200).render("chat");
        } catch (error) {
            handleServerError(res, error);
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
                sort: sort === "asc" || sort === "desc" ? { price: sort === "asc" ? 1 : -1 } : undefined,
            };

            const searchQuery = {};
            if (category) searchQuery.category = category;
            if (title) searchQuery.title = { $regex: title, $options: "i" };
            if (stock) {
                const stockNumber = parseInt(stock);
                if (!isNaN(stockNumber)) searchQuery.stock = stockNumber;
            }

            const products = await productService.getProductsPaginate(searchQuery, options);
            const baseUrl = req.originalUrl.split("?")[0];
            const { prevPage, nextPage } = products;
            const sortParam = sort ? `&sort=${sort}` : "";
            const prevLink = prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null;
            const nextLink = nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null;
            const categories = await productsModelo.distinct("category");

            if (isNaN(parseInt(page)) || parseInt(page) < 1 || parseInt(page) > products.totalPages) {
                return res.status(400).json({ error: "Page fuera de rango o inválida" });
            }

            setResponseHeaders(res);
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
                categories,
                cart,
                user,
                login: user
            });
        } catch (error) {
            handleServerError(res, error);
        }
    }

    static getCartById = async (req, res) => {
        const cid = req.params.cid;

        try {
            const cart = await cartService.getCartsBy({ _id: cid });
            if (cart) {
                setResponseHeaders(res);
                res.status(200).render("cart", { cart });
            } else {
                res.status(404).json({ error: `No existe un carrito con el ID: ${cid}` });
            }
        } catch (error) {
            handleServerError(res, error);
        }
    }

    static register = (req, res) => {
        const { error } = req.query;
        setResponseHeaders(res);
        res.status(200).render('register', { error });
    }

    static login = (req, res) => {
        const { error, message } = req.query;
        setResponseHeaders(res);
        res.status(200).render('login', { error, message, login: req.user });
    }

    static getProfile = (req, res) => {
        setResponseHeaders(res);
        res.status(200).render('profile', {
            user: req.user,
            login: req.user
        });
    }
}
