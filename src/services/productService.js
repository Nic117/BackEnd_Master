import ProductManager from "../dao/ProductDAO.js";

class ProductService {
    constructor(dao) {
        this.dao = dao;
    }

    async getProducts() {
        return this.dao.getProducts();
    }

    async getProductsPaginate(filter, options) {
        return this.dao.getProductsPaginate(filter, options);
    }

    async getSortProducts(sort) {
        return this.dao.getSortProducts(sort);
    }

    async createProduct(product) {
        return this.dao.createProduct(product);
    }

    async getProductsBy(filtro) {
        return this.dao.getProductsBy(filtro);
    }

    async updateProduct(id, updateData) {
        return this.dao.updateProduct(id, updateData);
    }

    async deleteProduct(id) {
        return this.dao.deleteProduct(id);
    }
}

export const productService = new ProductService(new ProductManager());
