import { isValidObjectId } from "mongoose";
import { io } from "../app.js";
import { productService } from "../services/productService.js";

export class ProductController {
    static getProducts = async (req, res) => {
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

                const prevLink = prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null;
                const nextLink = nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null;

                return {
                    prevPage: prevPage ? parseInt(prevPage) : null,
                    nextPage: nextPage ? parseInt(nextPage) : null,
                    prevLink,
                    nextLink,
                };
            };

            const products = await productService.getProductsPaginate(searchQuery, options);
            const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);

            let requestedPage = parseInt(page);
            if (isNaN(requestedPage) || requestedPage < 1) {
                requestedPage = 1;
            }

            if (requestedPage > products.totalPages) {
                return res.status(404).json({ error: "La página solicitada está fuera de rango" });
            }

            const response = {
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
            };

            return res.status(200).json(response);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    static getProductById = async (req, res) => {
        const { pid } = req.params;
        if (!isValidObjectId(pid)) {
            return res.status(400).json({ error: "Ingrese un ID válido de MONGODB" });
        }

        try {
            const product = await productService.getProductsBy({ _id: pid });
            if (product) {
                res.status(200).json(product);
            } else {
                res.status(404).json({ error: `No existe un producto con el ID: ${pid}` });
            }
        } catch (error) {
            res.status(500).json({ error: "Error inesperado en el servidor", detalle: error.message });
        }
    }

    static createProduct = async (req, res) => {
        const { title, description, price, thumbnail, code, stock, category } = req.body;

        if (!title || !description || !price || !thumbnail || !code || !stock || !category) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        if (typeof price !== 'number' || typeof stock !== 'number') {
            return res.status(400).json({ error: "El precio y el stock deben ser números" });
        }

        try {
            const codeRepeat = await productService.getProductsBy({ code });
            if (codeRepeat) {
                return res.status(400).json({ error: `Error, el código ${code} se está repitiendo` });
            }

            const nuevoProducto = await productService.createProduct({
                title, description, price, thumbnail, code, stock, category
            });

            io.emit("newProduct", title);
            return res.status(201).json(nuevoProducto);
        } catch (error) {
            res.status(500).json({ error: "Error inesperado en el servidor", detalle: error.message });
        }
    }

    static updateProduct = async (req, res) => {
        const { pid } = req.params;
        const updateData = req.body;

        if (!isValidObjectId(pid)) {
            return res.status(400).json({ error: "Ingrese un ID válido de MONGODB" });
        }

        if (updateData._id) {
            delete updateData._id;
        }

        if (updateData.code) {
            try {
                const exist = await productService.getProductsBy({ code: updateData.code });
                if (exist) {
                    return res.status(400).json({ error: `Ya existe otro producto con el código ${updateData.code}` });
                }
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        }

        if ((updateData.stock !== undefined && isNaN(updateData.stock)) ||
            (updateData.price !== undefined && isNaN(updateData.price))) {
            return res.status(400).json({ error: "Stock y precio deben ser números" });
        }

        try {
            const productoModificado = await productService.updateProduct(pid, updateData);
            return res.status(200).json(`El producto ${pid} se ha modificado: ${productoModificado}`);
        } catch (error) {
            res.status(500).json({ error: "Error inesperado en el servidor", detalle: error.message });
        }
    }

    static deleteProduct = async (req, res) => {
        const { pid } = req.params;

        if (!isValidObjectId(pid)) {
            return res.status(400).json({ error: "Ingrese un ID válido de MONGODB" });
        }

        try {
            const product = await productService.getProductsBy({ _id: pid });
            if (!product) {
                return res.status(404).json({ error: `No existe un producto con el ID: ${pid}` });
            }

            const deletedProduct = await productService.deleteProduct(pid);
            if (deletedProduct.deletedCount > 0) {
                const products = await productService.getProducts();
                io.emit("deletedProduct", products);
                return res.status(200).json({ payload: `El producto con id ${pid} fue eliminado` });
            } else {
                return res.status(400).json({ error: `No existe ningún producto con el id ${pid}` });
            }
        } catch (error) {
            res.status(500).json({ error: "Error en el servidor", detalle: error.message });
        }
    }
}
