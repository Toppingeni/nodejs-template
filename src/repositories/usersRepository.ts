import User from "../libs/sequelize/models/usersModel";

class UserRepository {
    async getUsers() {
        const res = await User.findAll({ limit: 1 });
        console.log(res);
        return res;
    }
}

export default new UserRepository();
