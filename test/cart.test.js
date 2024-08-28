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
    this.timeout(10000)
    let cartId
    let testProduct

    before(async function () {
        console.log("Conectando a la base de datos de pruebas...");
        await mongoose.connect(config.MONGO_TEST_URL, { dbName: config.DB_NAME_TEST })

        const productMock = {
            status: faker.datatype.boolean(0.9),
            title: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.commerce.price(),
            thumbnail: faker.image.url(),
            code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            stock: faker.number.int({ min: 0, max: 100 }),
            category: faker.commerce.department(),
            owner: "admin"
        }
        testProduct = await productService.createProduct(productMock);
        const mockCart = { products: [] };
        const createdCart = await cartService.createCart(mockCart);
        cartId = createdCart._id;
    })

    after(async function () {
        if (testProduct && testProduct._id) {
            await productService.deleteProduct(testProduct._id);
        }
    });




    it("Prueba del metodo 'getCarts', se devuelve un array de carritos", async () => {
        let cart = await cartService.getCarts();

        expect(Array.isArray(cart)).to.be.true
        if (Array.isArray(cart) && cart.length > 0) {
            expect(cart[0]._id).to.be.ok
            expect(cart[0].products).to.exist
        }
    })

    it("Prueba de getCartsBy, devuelve un carrito buscandolo por ID", async () => {
        const cart = await cartService.getCartsBy(cartId);
        expect(cart).to.be.a("object").and.have.property("_id");
    });

    it("Prueba del metodo createCart, crea un carrito en DB", async () => {
        let mockCart = { products: [] }
        let cart = await cartService.createCart(mockCart)

        expect(cart._id).to.exist
        await cartModelo.deleteOne(cart._id);
    })

    it("Prueba de eliminación de un carrito por ID", async () => {
        const mockCart = { products: [] };
        const cart = await cartService.createCart(mockCart);
        const deleteResult = await cartModelo.deleteOne(cart._id);
        expect(deleteResult).to.have.property("acknowledged", true);

        const fetchedCart = await cartService.getCartsBy(cart._id);
        expect(fetchedCart).to.be.null;
    });

    it("Prueba de addProductByID", async () => {
        const cart = await cartService.addProductToCart(cartId, testProduct._id);
        console.log("Carrito después de agregar el producto:", cart);
        console.log("ID del carrito:", cart._id.toString());
        console.log("ID del producto agregado:", cart.products[0]?.product.toString());
        
        
        expect(cart.products).to.be.a("array").and.not.have.length(0);
        expect(cart).to.have.property("_id");
        expect(cart._id.toString()).to.be.equal(cartId.toString());
        expect(cart).to.have.property("products").that.is.an("array").that.is.not.empty;
        const addedProduct = cart.products[0];
        expect(addedProduct).to.have.property("_id");
        console.log("ADDED PRODUCT" + addedProduct)
        console.log("TEST PRODUCT" + testProduct)
        expect(addedProduct.product._id.toString()).to.be.equal(testProduct._id.toString());
    });
    

    it("Debería manejar la solicitud de un carrito no existente", async () => {
        const notACart = new mongoose.Types.ObjectId();
        const cart = await cartService.getCartsBy(notACart);
        expect(cart).to.be.null;
    });



})