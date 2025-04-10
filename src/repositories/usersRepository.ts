import User from "../libs/sequelize/models/usersModel";

class UserRepository {
    async getUsers() {
        return await User.findAll();
    }
}

export default new UserRepository();
