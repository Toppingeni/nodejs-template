import { Sequelize } from "sequelize";
import { initTasksManager } from "./invoiceSequelizeModel";

export const initModels = (sequelize: Sequelize) => {
    initTasksManager(sequelize);
};
