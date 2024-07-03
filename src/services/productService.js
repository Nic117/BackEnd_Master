import ProductManager from "../dao/ProductDAO.js";

class ProductService {
    constructor(dao) {
        this.dao = dao;
    }

    async getProducts() {
        return await this.dao.getProducts();
    }

    async getProductsPaginate(filter, options) {
        return await this.dao.getProductsPaginate(filter, options);
    }

    async getSortProducts(sort) {
        return await this.dao.getSortProducts(sort);
    }

    async createProduct(product) {
        return await this.dao.createProduct(product);
    }

    async getProductsBy(filtro) {
        return await this.dao.getProductsBy(filtro);
    }

    async updateProduct(id, updateData) {
        return await this.dao.updateProduct(id, updateData);
    }

    async deleteProduct(id) {
        return await this.dao.deleteProduct(id);
    }
}

// Instancia única del servicio ProductService utilizando ProductManager
export const productService = new ProductService(new ProductManager());
