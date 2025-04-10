import { Dialect } from "sequelize";
import fs from "fs";
import type { ITns, ITnsConfig } from "../../types/oracleType";

const tns = require("tns").default;

export interface SequelizeConfig {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: Dialect;
    logging?: boolean;
}

function parseTnsConfig(con_tns: ITnsConfig) {
    const address = con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS;
    return {
        host: address.HOST,
        port: address.PORT,
    };
}

export const getConfig = async (): Promise<SequelizeConfig> => {
    const tnsPath =
        (process.env.TNS_PATH ? process.env.TNS_PATH : __dirname) +
        "/tnsnames.ora";
    const content = fs.readFileSync(tnsPath, "utf-8");
    const allTns: ITns = tns(content);
    const dbName = process.env.ORACLE_DB_NAME || "ORCL";

    if (!allTns[dbName]) {
        throw new Error(`TNS entry for ${dbName} not found`);
    }

    const { host, port } = parseTnsConfig(allTns[dbName]);
    const portNumber = parseInt(port, 10);

    return {
        username: process.env.ORACLE_USER || "",
        password: process.env.ORACLE_PWD || "",
        database: dbName,
        host,
        port: portNumber,
        dialect: "oracle",
        logging: process.env.NODE_ENV === "development",
    };
};
