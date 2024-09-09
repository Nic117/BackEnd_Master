import CartManager from "../dao/CartDAO.js";

class CartService {
    constructor(dao) {
        this.dao = dao;
    }

    getCarts = async (id) => await this.dao.getCarts(id);

    createCart = async () => await this.dao.createCart();

    getCartsBy = async (filtro = {}) => await this.dao.getCartsBy(filtro);

    getCartsProducts = async (id) => await this.dao.getCartsProducts(id);

    addProductToCart = async (id, product) => await this.dao.addProductToCart(id, product);

    updateCart = async (cid, products) => await this.dao.updateCart(cid, products);

    updateProductQ = async (id, product, quantity) => await this.dao.updateProductQ(id, product, quantity);

    deleteAllProductsFromCart = async (cid) => await this.dao.deleteAllProductsFromCart(cid);

    deleteProductFromCart = async (cid, pid) => await this.dao.deleteProductFromCart(cid, pid);
}

export const cartService = new CartService(new CartManager());