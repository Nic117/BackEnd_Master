import mongoose from "mongoose";
import { describe, it, before, after } from "mocha";
import { config } from "../src/config/config.js";
import { expect } from "chai";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../src/app.js";
import { productService } from "../src/services/productService.js";


describe("Pruebas Products", function () {
    this.timeout(10000)
    let testProduct
    let productMock

    before(async function () {
        console.log("Conectando a la base de datos de pruebas...");
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(config.MONGO_TEST_URL, { dbName: config.DB_NAME_TEST });
        }

        productMock = {
            status: faker.datatype.boolean(0.9),
            title: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.commerce.price(),
            thumbnail: faker.image.url(),
            code: `C-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            stock: faker.number.int({ min: 0, max: 100 }),
            category: faker.commerce.department(),
            owner: "admin"
        };
        testProduct = await productService.createProduct(productMock);
    });

    describe("Prueba de operaciones CRUD de productos", function () {
        it("Creación de producto", async () => {
            const testProduct = await productService.createProduct(productMock);
            expect(testProduct).to.have.property("_id").and.not.null;
        })

        it("Obtener producto por ID", async () => {
            const fetchedProduct = await productService.getProductsBy({ _id: testProduct._id });
            expect(fetchedProduct).to.have.property("_id").and.not.null;
            expect(fetchedProduct.title).to.equal(productMock.title);
        })

        it("Actualizar producto", async () => {
            const updatedProductMock = { ...productMock, price: 150 };
            const updatedProduct = await productService.updateProduct(testProduct._id, updatedProductMock);
            expect(updatedProduct).to.have.property("_id").and.not.null;
            expect(updatedProduct.price).to.equal(150);
        })

        it("Eliminar producto", async () => {
            const deleteResult = await productService.deleteProduct(testProduct._id);
            const getProduct = await productService.getProductsBy({ _id: testProduct._id });
            expect(getProduct).to.be.null;
        })
    });

})
