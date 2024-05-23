import { isValidObjectId } from 'mongoose';
import { Router } from 'express';
import { io } from "../app.js";
import ProductManager from '../dao/ProductManagerMONGO.js';
const productManager = new ProductManager();
export const router = Router();


router.get("/", async (req, res) => {
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

        const products = await productManager.getProductsPaginate(
            searchQuery,
            options
        );
        const { prevPage, nextPage, prevLink, nextLink } = buildLinks(products);

        let requestedPage = parseInt(page);
        if (isNaN(requestedPage) || requestedPage < 1) {
            requestedPage = 1;
        }

        if (requestedPage > products.totalPages) {
            return res
                .status(404)
                .json({ error: "La página solicitada está fuera de rango" });
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
        console.log(error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.get("/:pid", async (req, res) => {
    let id = req.params.pid;
    if (!isValidObjectId(id)) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: `Ingrese un ID válido de MONGODB` })
    }
    try {
        res.setHeader('Content-Type', 'application/json');
        const product = await productManager.getProductsBy({ _id: id });

        if (product) {
            res.status(200).json(product);
        } else {
            return res.status(404).json({ error: `No existe un producto con el ID: ${id}` });
        }

    } catch (error) {
        res.status(500).json({ error: `Error inesperado en el servidor`, detalle: `${error.message}` });
    }
});

router.post("/", async (req, res) => {
    let nuevoProducto
    try {
        const { title, description, price, thumbnail, code, stock, category } = req.body;

        if (!title || !description || !price || !thumbnail || !code || !stock || !category) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        if (typeof price !== 'number' || typeof stock !== 'number') {
            return res.status(400).json({ error: 'El precio y el stock deben ser números' })
        }

        let codeRepeat
        try {
            codeRepeat = await productManager.getProductsBy({ code })
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json(
                {
                    error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
                    detalle: `${error.message}`
                }
            )
        }

        if (codeRepeat) {
            return res.status(400).json({ error: `Error, el código ${code} se está repitiendo` });
        }

        try {
            nuevoProducto = await productManager.addProduct({ title, description, price, thumbnail, code, stock, category })
        } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json(
                {
                    error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
                    detalle: `${error.message}`
                }
            )
        }
    } catch (error) {
        res.status(500).json({ error: `Error inesperado en el servidor`, detalle: `${error.message}` });
    }
    const productList = await productManager.getProducts();
    io.emit("nuevoProducto", productList)
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(nuevoProducto);
})

router.put("/:pid", async (req, res) => {
    let id = req.params.pid;

    try {

        if (!isValidObjectId(id)) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: `Ingrese un ID válido de MONGODB` })
        }

        res.setHeader('Content-Type', 'application/json');
        let stock, price, category, thumbnail, title, description
        let updateData = req.body

        if (updateData._id) {
            delete updateData._id;
        }

        if (updateData.code) {
            let exist;

            try {
                exist = await productManager.getProductsBy({ code: updateData.code })
                if (exist) {
                    res.setHeader('Content-Type', 'application/json');
                    return res.status(400).json({ error: `Ya existe otro producto con codigo ${updateData.code}` })
                }
            } catch (error) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json(
                    {
                        error: `${error.message}`
                    }
                )
            }
        }

        if ((stock !== undefined && isNaN(stock)) || (price !== undefined && isNaN(price))) {
            return res.status(400).json({ error: "Stock y precio deben ser números" });
        }

        try {
            let productoModificado = await productManager.updateProduct(id, updateData);
            return res.status(200).json(`El producto ${id} se ha modificado: ${productoModificado}`);
        } catch (error) {
            res.status(300).json({ error: `Error al modificar el producto`, detalle: `${error.message}` });
        }
    } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json(
            {
                error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
                detalle: `${error.message}`
            }
        )
    }
});

router.delete("/:pid", async (req, res) => {
    let productoEliminado
    let id = req.params.pid;

    if (!isValidObjectId(id)) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: `Ingrese un ID válido de MONGODB` })
    }

    const product = await productManager.getProductsBy({ _id: id });
    if (product) {
        res.status(200).json(product);
    } else {
        return res.status(404).json({ error: `No existe un producto con el ID: ${id}` });
    }
    try {
        productoEliminado = await productManager.deleteProduct(id);
        if (productoEliminado.deletedCount > 0) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ payload: `El producto con id ${id} fue eliminado` });
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: `No existe ningun producto con el id ${id}` })
        }

    } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json(
            {
                error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
                detalle: `${error.message}`
            }
        )

    }

})