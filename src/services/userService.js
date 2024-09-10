import UserManager from "../dao/UsersDAO.js"

class UserService {
    constructor(dao) {
        this.dao = dao
    }

    async createUser(user) {
        return await this.dao.createUser(user);
    }

    async getAllUser() {
        return await this.dao.getAllUser();
    }

    async getInactiveUsers(days) {
        return await this.dao.getInactiveUsers(days);
    }

    async getUsersBy(filtro = {}) {
        return await this.dao.getUsersBy(filtro);
    }

    async getDocumentsByUserId(id) {
        return await this.dao.getDocumentsByUserId(id)
    }

    async updatePassword(id, hashedPassword) {
        return this.dao.update(id, hashedPassword)
    }

    async updateRol(id, nuevoRol) {
        return this.dao.updateRol(id, nuevoRol)
    }

    async getUserId(id) {
        return this.dao.getUsersById({ _id: id })
    }

    async deleteUserByEmail(userEmail) {
        return await this.dao.deleteUserByEmail(userEmail);
    };

    async updateUser(uid, update) {
        return await this.dao.updateUser(uid, update);
    }

}
export const userService = new UserService(new UserManager())
