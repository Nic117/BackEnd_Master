import { userModel } from "./models/userModel.js";

export default class UserManager {
    
    async createUser(user) {
        try {
            let newUser = await userModel.create(user);
            return newUser.toJSON();
        } catch (error) {
            console.error("Error al crear usuario:", error);
            throw new Error("Error al crear usuario");
        }
    }

    async getUsersBy(filtro = {}) {
        try {
            return await userModel.findOne(filtro).lean();
        } catch (error) {
            console.error("Error al obtener usuario por filtro:", error);
            throw new Error("Error al obtener usuario");
        }
    }

    async getByPopulate(filtro = {}) {
        try {
            return await userModel.findOne(filtro).populate("cart").lean();
        } catch (error) {
            console.error("Error al obtener usuario con carrito populado:", error);
            throw new Error("Error al obtener usuario");
        }
    }
}
