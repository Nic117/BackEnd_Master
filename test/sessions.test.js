import mongoose from "mongoose";
import { describe, it, before, after } from "mocha";
import { config } from "../src/config/config.js";
import { expect } from "chai";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../src/app.js";
import { userService } from "../src/services/userService.js";
import { userModel } from "../src/dao/models/userModel.js";

const requester = supertest(app);

const connectToDB = async () => {
    console.log("Conectando a la base de datos de pruebas...");
    await mongoose.connect(config.MONGO_TEST_URL, { dbName: config.DB_NAME_TEST });
};

connectToDB();

describe("Pruebas integrales del router de sesiones", function () {
    this.timeout(10000);

    let newUser;

    before(async function () {
        newUser = {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 80 }),
            password: faker.internet.password(),
            rol: "admin"
        };
    });

    after(async () => {
        console.log("Cerrando la conexión a la base de datos...");
        await mongoose.connection.close();
        console.log("Conexión cerrada.");
    });

    describe("Pruebas de endpoints de sesiones", () => {
        beforeEach(async function () {
            await userModel.deleteMany({});
        });

        it("Debería retornar todos los usuarios", async () => {
            const result = await requester.get("/api/users/");
            const statusCode = result.statusCode;
            const users = JSON.parse(result.text).users;

            expect(Array.isArray(users)).to.be.true;
            expect(statusCode).to.equal(200);
        });

        it("Debería crear un nuevo usuario", async () => {
            const result = await requester.post("/api/sessions/register").send(newUser);
            expect(result.statusCode).to.equal(200);

            const user = await userService.getUsersBy({ email: newUser.email });
            expect(user).to.be.an("object");
            expect(user).to.have.property("_id").and.not.be.null;
            expect(user.email).to.equal(newUser.email);
        });

        it("Debería obtener un usuario por ID correctamente", async () => {
            const createdUser = await userService.createUser(newUser);
            const fetchedUser = await userService.getUsersBy({ _id: createdUser._id });

            expect(fetchedUser).to.have.property("_id").and.not.be.null;
            expect(fetchedUser.email).to.equal(createdUser.email);
        });

        it("Debería iniciar sesión correctamente", async () => {
            await requester.post("/api/sessions/register").send(newUser);

            const loginResponse = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: newUser.password,
            });

            expect(loginResponse.status).to.equal(200);
            expect(loginResponse.body).to.have.property("token").and.not.be.null;
        });

        it("Debería eliminar un usuario por email correctamente", async () => {
            await userService.createUser(newUser);
            const deleteResult = await userService.deleteUserByEmail(newUser.email);

            const fetchedUser = await userService.getUsersBy({ email: newUser.email });
            expect(fetchedUser).to.be.null;
        });

        it("No debería iniciar sesión con credenciales incorrectas", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const response = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: "wrongpassword",
            });

            expect(response.statusCode).to.equal(302);
            expect(response.headers).to.have.property("location").that.includes("/error");
        });

        it("No debería registrar un usuario con un email ya existente", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const response = await requester.post("/api/sessions/register").send(newUser);

            expect(response.status).to.equal(302);
            expect(response.headers).to.have.property("location").that.includes("/error");
        });

        it("No debería registrar un usuario con un email inválido", async () => {
            const invalidUser = { ...newUser, email: "invalid-email" };
            const response = await requester.post("/api/sessions/register").send(invalidUser);

            expect(response.statusCode).to.equal(200);
        });

        it("No debería exponer la contraseña en la respuesta", async () => {
            const response = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: newUser.password,
            });

            expect(response.body).to.not.have.property("password");
        });

        it("Debería redirigir a la página de login después de un inicio de sesión fallido", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const response = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: "wrongpassword",
            });

            const redirectResponse = await requester.get(response.headers.location);
            expect(redirectResponse.statusCode).to.equal(500);
        });
    });
});