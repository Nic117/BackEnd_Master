import Assert from "assert";
import mongoose from "mongoose";
import { describe, it, before, after } from "mocha";
import { config } from "../src/config/config.js";
import { cartService } from "../src/services/cartService.js";
import { expect } from "chai";
import { productService } from "../src/services/productService.js";
import { faker } from "@faker-js/faker";
import { cartModelo } from "../src/dao/models/cartModelo.js";

describe("Pruebas Carts", function () {
    this.timeout(10000);
    let cartId;
    let testProduct;

    before(async function () {
        console.log("Iniciando conexión a la base de datos de pruebas...");
        await mongoose.connect(config.MONGO_TEST_URL, { dbName: config.DB_NAME_TEST });
        await initializeTestData();
    });

    after(async function () {
        console.log("Limpiando los datos de prueba...");
        await cleanUpTestData();
    });

    const initializeTestData = async () => {
        const productMock = createMockProduct();
        testProduct = await productService.createProduct(productMock);
        const mockCart = { products: [] };
        const createdCart = await cartService.createCart(mockCart);
        cartId = createdCart._id;
    };

    const cleanUpTestData = async () => {
        if (testProduct && testProduct._id) {
            await productService.deleteProduct(testProduct._id);
        }
    };

    const createMockProduct = () => ({
        status: faker.datatype.boolean(0.9),
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price(),
        thumbnail: faker.image.url(),
        code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        stock: faker.number.int({ min: 0, max: 100 }),
        category: faker.commerce.department(),
        owner: "admin"
    });

    it("Debería devolver un array de carritos", async () => {
        const carts = await cartService.getCarts();
        expect(Array.isArray(carts)).to.be.true;

        if (carts.length > 0) {
            expect(carts[0]).to.have.property("_id");
            expect(carts[0]).to.have.property("products");
        }
    });

    it("Debería devolver un carrito buscándolo por ID", async () => {
        const cart = await cartService.getCartsBy(cartId);
        expect(cart).to.be.an("object").and.have.property("_id");
    });

    it("Debería crear un carrito en la base de datos", async () => {
        const mockCart = { products: [] };
        const cart = await cartService.createCart(mockCart);
        expect(cart).to.have.property("_id");
        await cartModelo.deleteOne(cart._id);
    });

    it("Debería eliminar un carrito por ID", async () => {
        const mockCart = { products: [] };
        const cart = await cartService.createCart(mockCart);
        const deleteResult = await cartModelo.deleteOne(cart._id);
        expect(deleteResult).to.have.property("acknowledged", true);

        const fetchedCart = await cartService.getCartsBy(cart._id);
        expect(fetchedCart).to.be.null;
    });

    it("Debería agregar un producto al carrito", async () => {
        const cart = await cartService.addProductToCart(cartId, testProduct._id);
        expect(cart.products).to.be.an("array").and.not.be.empty;
        expect(cart).to.have.property("_id").that.equals(cartId.toString());

        const addedProduct = cart.products[0];
        expect(addedProduct).to.have.property("_id");
        expect(addedProduct.product._id.toString()).to.equal(testProduct._id.toString());
    });

    it("No debería encontrar un carrito con un ID no existente", async () => {
        const notACart = new mongoose.Types.ObjectId();
        const cart = await cartService.getCartsBy(notACart);
        expect(cart).to.be.null;
    });
});