import CartManager from "../dao/CartDAO.js";

class CartService {
    constructor(dao) {
        this.dao = dao;
    }
    async getCart(id) {
        return await this.dao.getCart(id);
    }
    async createCart() {
        return await this.dao.createCart();
    }
    async getCartsBy(filtro = {}) {
        return await this.dao.getCartsBy(filtro);
    }
    async getCartsProducts(id) {
        return await this.dao.getCartsProducts(id);
    }
    async addProductToCart(id, product) {
        return await this.dao.addProductToCart(id, product);
    }
    async updateCart(cid, products) {
        return await this.dao.updateCart(cid, products);
    }
    async updateProductQ(id, product, quantity) {
        return await this.dao.updateProductQ(id, product, quantity);
    }
    async deleteAllProductsFromCart(cid) {
        return await this.dao.deleteAllProductsFromCart(cid);
    }
    async deleteProductFromCart(cid, pid) {
        return await this.dao.deleteProductFromCart(cid, pid);
    }
}

export const cartService = new CartService(new CartManager())