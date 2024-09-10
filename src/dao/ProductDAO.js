import { productsModelo } from './models/productsModelo.js';

export default class ProductManager {


    async getProducts() {
        return await productsModelo.find().lean();
    }

    async getProductsPaginate(filter, options) {
        return await productsModelo.paginate(filter, options)
    }

    async getSortProducts(sort) {
        return await productsModelo.find().sort({ [sort]: 1 }).lean()
    }

    async createProduct(product) {
        return await productsModelo.create(product)
    }

    async getProductsBy(filtro={}) {
        return await productsModelo.findOne(filtro).lean()
    };

    async updateProduct(id, updateData) {
        return await productsModelo.findByIdAndUpdate(id, updateData, { runValidators: true, returnDocument: "after" })
    }

    async deleteProduct(id) {
        return await productsModelo.deleteOne({ _id: id })
    };
}