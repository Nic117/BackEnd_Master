import { isValidObjectId } from "mongoose"; import { io } from "../app.js";
import { productService } from "../services/productService.js";
import { fakerES_MX as faker } from "@faker-js/faker";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";


export class ProductController {
    static async getProducts(req, res, next) {
        try {
            const { page = 1, limit = 10, sort, category, title, stock } = req.query;
            const options = { page: Number(page), limit: Number(limit), lean: true,
                sort: sort === "asc" || sort === "desc" ? { price: sort === "asc" ? 1 : -1 } : undefined,
            };
            const searchQuery = { ...(category && { category }),
                                  ...(title && { title: { $regex: title, $options: "i" } }),
                                  ...(stock && !isNaN(parseInt(stock)) && { stock: parseInt(stock) }),
                                };
            const products = await productService.getProductsPaginate(searchQuery, options);
            const buildLinks = ({ prevPage, nextPage }) => {
                const baseUrl = req.originalUrl.split("?")[0];
                const sortParam = sort ? `&sort=${sort}` : "";
                return { prevPage, nextPage, prevLink: prevPage ? `${baseUrl}?page=${prevPage}${sortParam}` : null,
                                        nextLink: nextPage ? `${baseUrl}?page=${nextPage}${sortParam}` : null,
                };
            };
            const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);
            if (page < 1 || page > products.totalPages) {
                throw CustomError.createError("getProducts --> productController", "No Existe la Pagina",
                                              "Final de la Pagina", TIPOS_ERROR.NOT_FOUND);
            }
            res.status(200).json({ status: "success", payload: products.docs,
                                   totalPages: products.totalPages, page: Number(page),
                                   hasPrevPage: products.hasPrevPage, hasNextPage: products.hasNextPage,
                                   prevPage, nextPage, prevLink, nextLink,
                                 });
        } catch (error) { next(error); }
    }

    static async getProductById(req, res, next) {
        try {
            const { pid: id } = req.params;
            if (!isValidObjectId(id)) {
                throw CustomError.createError("getProductById --> productController", "ID inválido",
                                              "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const product = await productService.getProductsBy({ _id: id });
            if (!product) {
                throw CustomError.createError("getProductById --> productController", "Producto no encontrado",
                                              `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND);
            }
            res.status(200).json(product);
        } catch (error) { next(error); }
    }

    static async createProduct(req, res, next) {
        try {
            const { _id: userId, rol: userRol } = req.user;
            const { title, description, price, thumbnail, code, stock, category } = req.body;
            if (!title || !description || !price || !thumbnail || !code || !stock || !category) {
                throw CustomError.createError("createProduct --> productController", "Campos incompletos",
                                              "Todos los campos son obligatorios", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            if (isNaN(price) || isNaN(stock)) {
                throw CustomError.createError("createProduct --> productController", "Datos numéricos inválidos",
                                              "El precio y stock deben ser valores numéricos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const codeExists = await productService.getProductsBy({ code });
            if (codeExists) {
                throw CustomError.createError("createProduct --> productController", "Código duplicado",
                                              `El código ${code} ya está en uso`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const productData = { title, description, price, thumbnail, code, stock, category, owner: userId };
            const newProduct = await productService.createProduct(userRol === "admin" ? productData : { ...productData, owner: userId });
            io.emit("newProduct", title);
            res.status(201).json(newProduct);
        } catch (error) { next(error); }
    }

    static async updateProduct(req, res, next) {
        try {
            const { pid: id } = req.params;
            if (!isValidObjectId(id)) {
                throw CustomError.createError("updateProduct --> productController", "ID inválido",
                                              "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const updateData = { ...req.body };
            delete updateData._id;
            if (updateData.code) {
                const existingProduct = await productService.getProductsBy({ code: updateData.code });
                if (existingProduct) {
                    throw CustomError.createError("updateProduct --> productController", "Código duplicado",
                                                  `Ya existe otro producto con el código ${updateData.code}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
                }
            }
            if (isNaN(updateData.price) || isNaN(updateData.stock)) {
                throw CustomError.createError("updateProduct --> productController", "Datos numéricos inválidos",
                                              "El precio y stock deben ser valores numéricos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const updatedProduct = await productService.updateProduct(id, updateData);
            res.status(200).json(`El producto ${id} se ha modificado: ${updatedProduct}`);
        } catch (error) { next(error); }
    }

    static async deleteProduct(req, res, next) {
        try {
            const { pid: id } = req.params;
            if (!isValidObjectId(id)) {
                throw CustomError.createError("deleteProduct --> productController", "ID inválido",
                                              "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
            const product = await productService.getProductsBy({ _id: id });
            if (!product) {
                throw CustomError.createError("deleteProduct --> productController", "Producto no encontrado",
                                              `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND);
            }
            const deletedProduct = await productService.deleteProduct(id);
            if (deletedProduct.deletedCount > 0) {
                const products = await productService.getProducts();
                io.emit("deletedProduct", products);
                res.status(200).json({ message: `El producto con ID ${id} fue eliminado` });
            } else {
                throw CustomError.createError("deleteProduct --> productController", "Producto no encontrado",
                                              `No existe un producto con el ID ${id}`, TIPOS_ERROR.NOT_FOUND);
            }
        } catch (error) { next(error); }
    }

    static async mock(req, res) {
        try {
            const products = Array.from({ length: 100 }, (_, i) => ({
                productNumber: i + 1, status: faker.datatype.boolean(0.9),
                title: faker.commerce.productName(), description: faker.commerce.productDescription(),
                price: faker.commerce.price({ symbol: '$' }), thumbnail: faker.image.url(),
                code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                stock: faker.number.int({ min: 0, max: 100 }), category: faker.commerce.department(),
            }));
            res.status(200).json(products);
        } catch (error) {
            CustomError.createError("mock --> productController", null,
                                    "Error al cargar la pagina", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }
}
