import fs from 'fs';
import path from "path";
import ProductManager from "./ProductManagerFS.js";
import __dirname from "../utils.js";

const rutaProducto = path.join(__dirname, './data/productos.json');

export default class CartManager {

    constructor(rutaCart) {
        this.path = rutaCart;
        this.init();
    }

    async init() {
        const carts = await this.getCarts();
        if (carts.length > 0) {
            const maxId = Math.max(...carts.map(cart => cart.id));
            CartManager.idcart = maxId + 1;
        } else {
            CartManager.idcart = 1;
        }
    }

    async addCart() {
        await this.init();
        const newCarrito = {
            id: CartManager.idcart++,
            products: []
        };
        const carts = await this.getCarts();
        carts.push(newCarrito);
        await this.saveCart(carts);
        return `El carrito se ha añadido correctamente ${newCarrito}`;
    }

    async getCarts() {
        try {
            if (fs.existsSync(this.path)) {
                const data = await fs.promises.readFile(this.path, { encoding: "utf-8" });
                const carts = JSON.parse(data);
                if (Array.isArray(carts)) {
                    return carts;
                } else {
                    throw new Error("El contenido del archivo JSON no es un array válido.");
                }
            } else {
                console.log(`El archivo JSON no existe en la ruta: ${this.path}. Creando un nuevo archivo...`);
                await this.saveCart([]);
                return [];
            }
        } catch (error) {
            throw new Error(`Error al obtener carritos: ${error.message}`);
        }
    }

    async saveCart(data) {
        try {
            const jsonData = JSON.stringify(data, null, 4);
            await fs.promises.writeFile(this.path, jsonData, 'utf8');
            console.log('Archivo guardado correctamente');
        } catch (error) {
            throw new Error(`Error al guardar carritos: ${error.message}`);
        }
    }

    async getCartsById(id) {
        try {
            const carts = await this.getCarts();
            const cart = carts.find(c => c.id === id);
            return cart;
        } catch (error) {
            throw new Error(`Error al obtener carrito por ID: ${error.message}`);
        }
    }

    async getCartsProducts(id) {
        try {
            const carts = await this.getCarts();
            const cart = carts.find(c => c.id === id);
            return cart ? cart.products : [];
        } catch (error) {
            throw new Error(`Error al obtener productos del carrito: ${error.message}`);
        }
    }

    async addProductToCart(cid, pid) {
        try {
            const carts = await this.getCarts();
            const index = carts.findIndex(cart => cart.id === cid);

            if (index !== -1) {
                const cart = carts[index];
                const existingProductIndex = cart.products.findIndex(product => product.id === pid);

                if (existingProductIndex !== -1) {
                    cart.products[existingProductIndex].quantity++;
                } else {
                    const productManager = new ProductManager(rutaProducto);
                    const product = await productManager.getProductsById(pid);

                    if (!product) {
                        return `Producto con id ${pid} no encontrado`;
                    }

                    cart.products.push({ id: pid, quantity: 1 });
                }

                carts[index] = cart;
                await this.saveCart(carts);
                return cart;
            } else {
                return `Carrito con id ${cid} no encontrado`;
            }
        } catch (error) {
            throw new Error(`Error al añadir producto al carrito: ${error.message}`);
        }
    }
}
