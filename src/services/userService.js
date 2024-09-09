import UserManager from "../dao/UsersDAO.js";

class UserService {
    constructor(dao) {
        this.dao = dao;
    }

    createUser = async (user) => await this.dao.createUser(user);

    getAllUser = async () => await this.dao.getAllUser();

    getUsersBy = async (filter = {}) => await this.dao.getUsersBy(filter);

    getDocumentsByUserId = async (id) => await this.dao.getDocumentsByUserId(id);

    updatePassword = async (id, hashedPassword) => this.dao.update(id, hashedPassword);

    updateRol = async (id, newRole) => this.dao.updateRol(id, newRole);

    getUserId = async (id) => this.dao.getUsersById({ _id: id });

    deleteUserByEmail = async (userEmail) => await this.dao.deleteUserByEmail(userEmail);

    updateUser = async (uid, update) => await this.dao.updateUser(uid, update);

    deleteUsers = async (filter) => await this.dao.deleteUsers(filter);
}

export const userService = new UserService(new UserManager());