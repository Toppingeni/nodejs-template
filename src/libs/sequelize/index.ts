import { Sequelize } from "sequelize";
import { getConfig } from "./config";
import { initModels } from "../../models";

export const initSequelize = async () => {
    const config = await getConfig();
    const sequelize = new Sequelize({
        username: config.username,
        password: config.password,
        database: config.database,
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        dialectOptions: {
            connectString: `${config.host}:${config.port}/${config.database}`,
        },
        logging: config.logging,
    });

    await sequelize.authenticate();
    console.log("Sequelize connection established successfully");
    initModels(sequelize);
    return sequelize;
};

export default initSequelize;
