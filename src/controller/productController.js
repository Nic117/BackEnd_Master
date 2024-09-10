import { isValidObjectId } from "mongoose";
import { io } from "../app.js";
import { productService } from "../services/productService.js";
import { fakerES_MX as faker, ne } from "@faker-js/faker";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { userService } from "../services/userService.js";
import nodemailer from "nodemailer"
import { config } from "../config/config.js";

export class ProductController {
    static getProducts = async (req, res, next) => {
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

            let requestedPage = parseInt(page);
            if (isNaN(requestedPage) || requestedPage < 1) {
                requestedPage = 1;
            }

            if (requestedPage > products.totalPages) {
                CustomError.createError("getProducts --> productController", "No existe la página", "La página solicitada está fuera de rango", TIPOS_ERROR.NOT_FOUND)
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

            return res.status(200).send(response);
        } catch (error) {
            return next(error);
        }
    }

    static getProductById = async (req, res, next) => {
        let id = req.params.pid;
        try {
            if (!isValidObjectId(id)) {
                CustomError.createError("getProductById --> productController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }
            res.setHeader('Content-Type', 'application/json');
            const product = await productService.getProductsBy({ _id: id });

            if (product) {
                res.status(200).json(product);
            } else {
                CustomError.createError("getProductById --> productController", "ID incorrecto", `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND)
            }

        } catch (error) {
            return next(error)
        }
    }

    static createProduct = async (req, res, next) => {
        let nuevoProducto
        try {
            const userId = req.user._id;
            const userRol = req.user.rol;
            const { title, description, price, thumbnail, code, stock, category } = req.body;

            if (!title || !description || !price || !thumbnail || !code || !stock || !category) {
                CustomError.createError("createProduct --> productController", "No se completaron los campos obligatorios", "Todos los campos son obligatorios", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            if (typeof price !== 'number' || typeof stock !== 'number') {
                CustomError.createError("createProduct --> productController", "Precio y stock NaN", "El precio y stock deben ser valores numéricos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const codeRepeat = await productService.getProductsBy({ code })

            if (codeRepeat) {
                CustomError.createError("createProduct --> productController", "Código repetido", `Error, el código ${code} se está repitiendo`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const productData = { title, description, price, thumbnail, code, stock, category };

            if (userRol === "admin") {
                productData.owner = "admin";
            } else {
                productData.owner = userId;
            }

            const user = await userService.getUserId({ _id: userId });
            if (user) productData.owner = user.rol;

            nuevoProducto = await productService.createProduct(productData)
            io.emit("newProduct", title)
            res.setHeader('Content-Type', 'application/json');
            return res.status(201).json(nuevoProducto);


        } catch (error) {
            return next(error)
        }
    }

    static updateProduct = async (req, res, next) => {
        let id = req.params.pid;

        try {

            if (!isValidObjectId(id)) {
                CustomError.createError("updateProduct --> productController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            res.setHeader('Content-Type', 'application/json');
            let stock, price
            let updateData = req.body

            if (updateData._id) {
                delete updateData._id;
            }

            if (updateData.code) {
                let exist;

                try {
                    exist = await productService.getProductsBy({ code: updateData.code })
                    if (exist) {
                        res.setHeader('Content-Type', 'application/json');
                        CustomError.createError("updateProduct --> productController", "Código repetido", `Ya existe otro producto con codigo ${updateData.code}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
                    }
                } catch (error) {
                    return next(error)
                }
            }

            if ((stock !== undefined && isNaN(stock)) || (price !== undefined && isNaN(price))) {
                CustomError.createError("updateProduct --> productController", "Stock y/o precio NaN", "Stock y precio deben ser números", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            try {
                let productoModificado = await productService.updateProduct(id, updateData);
                return res.status(200).json({ payload: `El producto ${id} se ha modificado: ${productoModificado}` });
            } catch (error) {
                CustomError.createError("updateProduct --> productController", "Error al modificar el producto", "Error al modificar el producto", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }
        } catch (error) {
            return next(error)
        }
    }

    static deleteProduct = async (req, res, next) => {
        try {
            let id = req.params.pid;
            const userId = req.user._id;

            if (!isValidObjectId(id)) {
                CustomError.createError("deleteProduct --> productController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
            }

            const product = await productService.getProductsBy({ _id: id });
            const user = await userService.getUserId({ _id: userId });
            if (!product) {
                CustomError.createError("deleteProduct --> productController", "No se encuentra el producto", `No existe un producto con el ID: ${id}`, TIPOS_ERROR.NOT_FOUND)
            }
            const deletedProduct = await productService.deleteProduct(id);
            if (deletedProduct.deletedCount > 0) {
                let products = await productService.getProducts();
                io.emit("deletedProduct", products);

                if (user && user.rol === 'admin' && user.email) {
                    const transport = nodemailer.createTransport({
                        service: "gmail",
                        port: 587,
                        auth: {
                            user: config.APP_MAIL_DIR,
                            pass: config.APP_MAIL_PASS,
                        },
                    });

                    await transport.sendMail({
                        from: `Eliminación de producto <${config.APP_MAIL_DIR}>`,
                        to: user.email,
                        subject: "Notificación de eliminación de producto",
                        html: `
                            <div>
                                <h1>Estimado/a ${user.first_name},</h1>
                                <p>Le informamos que el producto con ID ${id} ha sido eliminado.</p>
                            </div>
                            <div>
                                <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
                            </div>
                        `,
                    });

                    console.log(`Correo enviado a: ${user.email}`);
                }

                return res.status(200).json({ payload: `El producto con id ${id} fue eliminado` });
            } else {
                CustomError.createError("deleteProduct --> productController", "No se encuentra el producto", `No existe ningun producto con el id ${id}`, TIPOS_ERROR.NOT_FOUND)
            }

        } catch (error) {
            return next(error)
        }
    }

    static mock = async (req, res) => {
        try {
            let products = [];
            let number = 1
            for (let i = 0; i < 100; i++) {
                products.push({
                    productNumber: number++,
                    status: faker.datatype.boolean(0.9),
                    title: faker.commerce.productName(),
                    description: faker.commerce.productDescription(),
                    price: faker.commerce.price({ symbol: '$' }),
                    thumbnail: faker.image.url(),
                    code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    stock: faker.number.int({ min: 0, max: 100 }),
                    category: faker.commerce.department()
                })
            }
            return res.status(200).json(products);
        } catch (error) {
            CustomError.createError("mock --> productController", null, "Un error inesperado ocurrió al cargar la página", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
        }
    }
}