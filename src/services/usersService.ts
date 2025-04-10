import User from "../libs/sequelize/models/usersModel";
import usersRepository from "../repositories/usersRepository";

class UserService {
    async getUsers() {
        const users = usersRepository.getUsers();
        return users;
    }
}

export default new UserService();
