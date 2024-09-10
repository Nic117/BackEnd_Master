import { userModel } from "./models/userModel.js";


export default class UserManager {

    async createUser(user) {
        let newUser = await userModel.create(user);
        return newUser.toJSON();
    };

    async getAllUser() {
        return await userModel.find().lean();
    };

    async getInactiveUsers(days) {
        try {
            const inactiveDateLimit = new Date();
            inactiveDateLimit.setDate(inactiveDateLimit.getDate() - days);

            return await userModel.find({ last_connection: { $lt: inactiveDateLimit } }).lean();
        } catch (error) {
            console.error("Error al obtener usuarios inactivos:", error);
            throw new Error("Error al obtener usuarios inactivos");
        }
    }

    async getUsersBy(filtro = {}) {
        return await userModel.findOne(filtro).lean();
    };

    async getUsersById(id) {
        return await userModel.findOne(id).lean();
    };

    async getDocumentsByUserId(id) {
        const user = await userModel.findOne({ _id: id }).lean();
        if (!user) {
            throw new Error("Usuario no encontrado");
        }
        return user.documents || [];
    };

    async getByPopulate(filtro = {}) {
        return await userModel.findOne(filtro).populate("cart").lean()
    }

    async update(id, hashedPassword) {
        return await userModel.findByIdAndUpdate(id, { password: hashedPassword }, { runValidators: true, returnDocument: "after" })
    }

    async updateRol(id, nuevoRol) {
        return await userModel.findByIdAndUpdate(id, { rol: nuevoRol }, { runValidators: true, returnDocument: "after" })
    }

    async updateUser(uid, update) {
        try {
            const user = await userModel.findByIdAndUpdate(uid, update, { new: true });
            if (!user) {
                throw new Error("Usuario no encontrado.");
            }
            return user;
        } catch (error) {
            throw new Error(error.message);
        }
    };


    async deleteUserByEmail(emails) {
        try {
            if (!Array.isArray(emails)) {
                throw new Error("El parámetro 'emails' debe ser un array");
            }
            return await userModel.deleteMany({ email: { $in: emails } });
        } catch (error) {
            console.error("Error al eliminar usuarios por correo electrónico:", error);
            throw new Error("Error al eliminar usuario");
        }
    }

}
