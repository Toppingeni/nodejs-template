import { Sequelize } from "sequelize";
import { getConfig } from "./config";
import { initModels } from "../../models";

export const initSequelize = async () => {
    const config = await getConfig();
    const sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            port: config.port,
            dialect: config.dialect,
            logging: config.logging,
            dialectModule: require("oracledb"),
            quoteIdentifiers: config.quoteIdentifiers,
        }
    );

    await sequelize.authenticate();
    console.log("Sequelize connection established successfully");
    initModels(sequelize);
    return sequelize;
};

export default initSequelize;
