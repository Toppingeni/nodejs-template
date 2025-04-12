import { Sequelize } from "sequelize";
import { initUserModel } from "./usersModel";

export const initModels = (sequelize: Sequelize) => {
    initUserModel(sequelize);
};
