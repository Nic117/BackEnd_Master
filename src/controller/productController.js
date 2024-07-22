import { isValidObjectId } from "mongoose";
import { io } from "../app.js";
import { productService } from "../services/productService.js";
import { fakerES_MX as faker } from "@faker-js/faker";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

export class ProductController {
    static getProducts = async (req, res, next) => {
        try {
            const { page = 1, limit = 10, sort } = req.query;

            const options = {
                page: Number(page),
                limit: Number(limit),
                lean: true,
                sort: sort ? { price: sort === "asc" ? 1 : -1 } : {},
            };

            const searchQuery = {};
            if (req.query.category) searchQuery.category = req.query.category;
            if (req.query.title) searchQuery.title = { $regex: req.query.title, $options: "i" };
            if (req.query.stock) {
                const stockNumber = parseInt(req.query.stock);
                if (!isNaN(stockNumber)) searchQuery.stock = stockNumber;
            }

            const products = await productService.getProductsPaginate(searchQuery, options);

            const buildLinks = (products) => {
                const { prevPage, nextPage } = products;
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

            let requestedPage = parseInt(page);
            if (isNaN(requestedPage) || requestedPage < 1) requestedPage = 1;

            if (requestedPage > products.totalPages) {
                throw new CustomError("No existe la página", "La página solicitada está fuera de rango", TIPOS_ERROR.NOT_FOUND);
            }

            return res.status(200).json({
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
            });
        } catch (error) {
            return next(error);
        }
    }

    static getProductById = async (req, res, next) => {
        const id = req.params.pid;
        try {
            if (!isValidObjectId(id)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const product = await productService.getProductsBy({ _id: id });
            if (!product) {
                throw new CustomError("ID incorrecto", `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND);
            }

            return res.status(200).json(product);
        } catch (error) {
            return next(error);
        }
    }

    static createProduct = async (req, res, next) => {
        try {
            const { title, description, price, thumbnail, code, stock, category } = req.body;

            if (!title || !description || !price || !thumbnail || !code || !stock || !category) {
                throw new CustomError("No se completaron los campos obligatorios", "Todos los campos son obligatorios", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            if (typeof price !== 'number' || typeof stock !== 'number') {
                throw new CustomError("Precio y stock NaN", "El precio y stock deben ser valores numéricos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const codeRepeat = await productService.getProductsBy({ code });
            if (codeRepeat) {
                throw new CustomError("Código repetido", `Error, el código ${code} se está repitiendo`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const nuevoProducto = await productService.createProduct({ title, description, price, thumbnail, code, stock, category });
            io.emit("newProduct", title);
            return res.status(201).json(nuevoProducto);
        } catch (error) {
            return next(error);
        }
    }

    static updateProduct = async (req, res, next) => {
        const id = req.params.pid;
        try {
            if (!isValidObjectId(id)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const updateData = req.body;
            if (updateData._id) delete updateData._id;

            if (updateData.code) {
                const exist = await productService.getProductsBy({ code: updateData.code });
                if (exist) {
                    throw new CustomError("Código repetido", `Ya existe otro producto con codigo ${updateData.code}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
                }
            }

            if ((updateData.stock !== undefined && isNaN(updateData.stock)) || (updateData.price !== undefined && isNaN(updateData.price))) {
                throw new CustomError("Stock y/o precio NaN", "Stock y precio deben ser números", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const productoModificado = await productService.updateProduct(id, updateData);
            return res.status(200).json(`El producto ${id} se ha modificado: ${productoModificado}`);
        } catch (error) {
            return next(error);
        }
    }

    static deleteProduct = async (req, res, next) => {
        const id = req.params.pid;
        try {
            if (!isValidObjectId(id)) {
                throw new CustomError("ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const product = await productService.getProductsBy({ _id: id });
            if (!product) {
                throw new CustomError("No se encuentra el producto", `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND);
            }

            const deletedProduct = await productService.deleteProduct(id);
            if (deletedProduct.deletedCount > 0) {
                const products = await productService.getProducts();
                io.emit("deletedProduct", products);
                return res.status(200).json({ payload: `El producto con id ${id} fue eliminado` });
            } else {
                throw new CustomError("No se encuentra el producto", `No existe ningun producto con el id ${id}`, TIPOS_ERROR.NOT_FOUND);
            }
        } catch (error) {
            return next(error);
        }
    }

    static mock = async (req, res) => {
        try {
            const products = Array.from({ length: 100 }, (_, index) => ({
                productNumber: index + 1,
                status: faker.datatype.boolean(0.9),
                title: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: faker.commerce.price({ symbol: '$' }),
                thumbnail: faker.image.url(),
                code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                stock: faker.number.int({ min: 0, max: 100 }),
                category: faker.commerce.department(),
            }));

            return res.status(200).json(products);
        } catch (error) {
            next(new CustomError("Un error inesperado ocurrió al cargar la página", error.message, TIPOS_ERROR.INTERNAL_SERVER_ERROR));
        }
    }
}
