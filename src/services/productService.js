import ProductManager from "../dao/ProductDAO.js";

class ProductService {
    constructor(dao) {
        this.dao = dao;
    }

    getProducts = async () => await this.dao.getProducts();

    getProductsPaginate = async (filter, options) => await this.dao.getProductsPaginate(filter, options);

    getSortProducts = async (sort) => await this.dao.getSortProducts(sort);

    createProduct = async (product) => await this.dao.createProduct(product);

    getProductsBy = async (filtro) => await this.dao.getProductsBy(filtro);

    updateProduct = async (id, updateData) => await this.dao.updateProduct(id, updateData);

    deleteProduct = async (id) => await this.dao.deleteProduct(id);
}

export const productService = new ProductService(new ProductManager());