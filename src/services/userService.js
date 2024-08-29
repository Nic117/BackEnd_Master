import UserManager from "../dao/UsersDAO.js";

class UserService {
    constructor(dao) {
        this.dao = dao;
    }

    async createUser(user) {
        return this.dao.createUser(user);
    }

    async getAllUser() {
        return this.dao.getAllUser();
    }

    async getUsersBy(filtro = {}) {
        return this.dao.getUsersBy(filtro);
    }

    async getDocumentsByUserId(id) {
        return this.dao.getDocumentsByUserId(id);
    }

    async updatePassword(id, hashedPassword) {
        return this.dao.update(id, { password: hashedPassword });
    }

    async updateRol(id, nuevoRol) {
        return this.dao.updateRol(id, nuevoRol);
    }

    async getUserId(id) {
        return this.dao.getUsersById({ _id: id });
    }

    async deleteUserByEmail(userEmail) {
        return this.dao.deleteUserByEmail(userEmail);
    }

    async updateUser(uid, update) {
        return this.dao.updateUser(uid, update);
    }

    async deleteUsers(filter) {
        return this.dao.deleteUsers(filter);
    }
}

export const userService = new UserService(new UserManager());
