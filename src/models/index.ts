import { Sequelize } from "sequelize";
import { initTasksManager } from "./invoiceSequelizeModel";
import { initUserModel } from "./usersModel";

export const initModels = (sequelize: Sequelize) => {
    initTasksManager(sequelize);
    initUserModel(sequelize);
};
