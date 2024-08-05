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

    async getUsersBy(filtro = {}) {
        return await this.dao.getUsersBy(filtro);
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
}
export const userService = new UserService(new UserManager())
