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

const connDB = async () => {
    console.log("Conectando a la base de datos de pruebas...");
    await mongoose.connect(config.MONGO_TEST_URL, { dbName: config.DB_NAME_TEST })
}

connDB()

describe("Test integral del router de sessions", function () {
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

    describe("Pruebas de endpoints de sessions", () => {

        beforeEach(async function () {
            await userModel.deleteMany({});
        });

        it("GET /api/users debe retornar todos los usuarios", async () => {
            let resultado = await requester.get("/api/users/")
            const statusCode = resultado.statusCode;
            const users = JSON.parse(resultado.text).users;
            expect(Array.isArray(users)).to.be.true
            expect(statusCode).to.exist.and.to.be.equal(200)
        });

        it("POST /api/users debe crear un usuario", async () => {
            let resultado = await requester.post("/api/sessions/register").send(newUser)
            expect(resultado.statusCode).to.be.equal(200);

            const user = await userService.getUsersBy({ email: newUser.email });
            expect(user).to.be.an("object");
            expect(user).to.have.property("_id").and.not.null;
            expect(user.email).to.equal(newUser.email);
        });

        it("Debería obtener un usuario por ID correctamente", async () => {
            const createdUser = await userService.createUser(newUser);
            const fetchedUser = await userService.getUsersBy({ _id: createdUser._id });
            // console.log("Usuario obtenido por ID:", fetchedUser.email);
            expect(fetchedUser).to.have.property("_id").and.not.null;
            expect(fetchedUser.email).to.equal(createdUser.email);
        });

        it("POST /api/sessions/login debe iniciar sesión", async () => {
            await requester.post("/api/sessions/register").send(newUser);

            const loginNewUser = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: newUser.password,
            });
            // console.log("respuesta de login:", loginNewUser.status);
            expect(loginNewUser.status).to.equal(200);
            expect(loginNewUser.body).to.have.property("token").and.not.null;
        });

        it("Debería eliminar un usuario por email correctamente", async () => {
            await userService.createUser(newUser);
            const deleteResult = await userService.deleteUserByEmail(newUser.email);
            // console.log("Resultado de la eliminación:", deleteResult);

            const getUser = await userService.getUsersBy({ email: newUser.email });
            expect(getUser).to.be.null;
        });

        it("No debería iniciar sesión con credenciales incorrectas", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const res = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: "wrongpassword",
            });
            // console.log("respuesta de login con credenciales incorrectas:", res.body);
            expect(res.statusCode).to.equal(302);
            expect(res.headers).to.have.property("location").that.includes("/error");
        });

        it("No debería registrar un usuario con un email ya existente", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const res = await requester.post("/api/sessions/register").send(newUser);
            expect(res.status).to.equal(302);
            expect(res.headers).to.have.property("location").that.includes("/error");
        });

        it("No debería registrar un usuario con un email inválido", async () => {
            const invalidUser = { ...newUser, email: "invalid-email" };
            const res = await requester.post("/api/sessions/register").send(invalidUser);
            expect(res.statusCode).to.equal(200);
        });

        it("No debería exponer la contraseña en la respuesta", async () => {
            const res = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: newUser.password,
            });
            expect(res.body).to.not.have.property("password");
        });

        it("Debería redirigir a la página de login después de un inicio de sesión fallido", async () => {
            await requester.post("/api/sessions/register").send(newUser);
            const res = await requester.post("/api/sessions/login").send({
                email: newUser.email,
                password: "wrongpassword",
            });
            const redirectRes = await requester.get(res.headers.location);
            expect(redirectRes.statusCode).to.equal(500);
        });
    });
});
