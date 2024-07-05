import { productsModelo } from './models/productsModelo.js';

export default class ProductManager {

    async getProducts() {
        try {
            return await productsModelo.find().lean();
        } catch (error) {
            console.error(`Error al obtener productos: ${error}`);
            throw new Error("Error al obtener productos");
        }
    }

    async getProductsPaginate(filter, options) {
        try {
            return await productsModelo.paginate(filter, options);
        } catch (error) {
            console.error(`Error al paginar productos: ${error}`);
            throw new Error("Error al paginar productos");
        }
    }

    async getSortProducts(sort) {
        try {
            return await productsModelo.find().sort({ [sort]: 1 }).lean();
        } catch (error) {
            console.error(`Error al obtener productos ordenados: ${error}`);
            throw new Error("Error al obtener productos ordenados");
        }
    }

    async createProduct(product) {
        try {
            return await productsModelo.create(product);
        } catch (error) {
            console.error(`Error al crear producto: ${error}`);
            throw new Error("Error al crear producto");
        }
    }

    async getProductsBy(filtro) {
        try {
            return await productsModelo.findOne(filtro).lean();
        } catch (error) {
            console.error(`Error al obtener producto por filtro: ${error}`);
            throw new Error("Error al obtener producto por filtro");
        }
    }

    async updateProduct(id, updateData) {
        try {
            return await productsModelo.findByIdAndUpdate(id, updateData, { runValidators: true, new: true });
        } catch (error) {
            console.error(`Error al actualizar producto: ${error}`);
            throw new Error("Error al actualizar producto");
        }
    }

    async deleteProduct(id) {
        try {
            return await productsModelo.deleteOne({ _id: id });
        } catch (error) {
            console.error(`Error al eliminar producto: ${error}`);
            throw new Error("Error al eliminar producto");
        }
    }
}
