import { Sequelize } from "sequelize";
import { getConfig } from "./config";
import { initModels } from "./models";

let sequelizeInstance: Sequelize;

export const initSequelize = async () => {
    if (sequelizeInstance) return sequelizeInstance;

    const config = await getConfig();
    console.log(config);
    sequelizeInstance = new Sequelize(
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

    await sequelizeInstance.authenticate();
    console.log("Sequelize connection established successfully");
    initModels(sequelizeInstance);
    return sequelizeInstance;
};

const rawQuery = async (query: string) => {
    const sequelize = await initSequelize();
    try {
        const res = await sequelize.query(query);
        return res;
    } catch (error) {
        console.error("Error executing raw query:", error);
        throw error;
    }
};

export { rawQuery, sequelizeInstance };
export default initSequelize;
