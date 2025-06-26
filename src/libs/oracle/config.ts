import fs from "fs";

import type { ITns } from "../../types/oracleType";
import { getTnsString } from "../../utils/databaseHelper";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config({
    path: `${__dirname}/../.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
    }`,
});
const tns = require("tns").default;

export const getConfig = async () => {
    const tnsPath =
        (process.env.TNS_PATH ? process.env.TNS_PATH : __dirname) +
        "/tnsnames.ora";
    const content = fs.readFileSync(tnsPath, "utf-8");
    const allTns: ITns = tns(content);
    const tnsConnectString: Record<string, string> = {};

    for await (const key of Object.keys(allTns)) {
        const con_tns = allTns[key];

        if (con_tns.DESCRIPTION.ADDRESS_LIST) {
            tnsConnectString[key] = getTnsString(con_tns);
        }
    }

    return tnsConnectString;
};
