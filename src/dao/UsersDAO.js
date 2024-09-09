import { userModel } from "./models/userModel.js";

export default class UserManager {
    async createUser(user) {
        const newUser = await userModel.create(user);
        return newUser.toJSON();
    }

    async getAllUsers() {
        return await userModel.find().lean();
    }

    async getUsersBy(filtro = {}) {
        return await userModel.findOne(filtro).lean();
    }

    async getUserById(id) {
        return await userModel.findById(id).lean();
    }

    async getDocumentsByUserId(id) {
        const user = await this.getUserById(id);
        if (!user) throw new Error("Usuario no encontrado");
        return user.documents || [];
    }

    async getByPopulate(filtro = {}) {
        return await userModel.findOne(filtro).populate("cart").lean();
    }

    async updatePassword(id, hashedPassword) {
        return await userModel.findByIdAndUpdate(
            id, 
            { password: hashedPassword }, 
            { runValidators: true, returnDocument: "after" }
        );
    }

    async updateRole(id, newRole) {
        return await userModel.findByIdAndUpdate(
            id, 
            { rol: newRole }, 
            { runValidators: true, returnDocument: "after" }
        );
    }

    async updateUser(uid, updateData) {
        const user = await userModel.findByIdAndUpdate(uid, updateData, { new: true });
        if (!user) throw new Error("Usuario no encontrado.");
        return user;
    }

    async deleteUserByEmail(email) {
        const result = await userModel.deleteOne({ email });
        if (!result.deletedCount) throw new Error("Usuario no encontrado.");
        return result;
    }
}
