import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tns from "tns";

import type { ITns } from "../../types/oracleType";
import { getTnsString } from "../../utils/databaseHelper";
import { config } from "../../config/unifiedConfig";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getConfig = async () => {
    const tnsPath =
        (config.TNS_PATH ? config.TNS_PATH : __dirname) + "/tnsnames.ora";
    const content = fs.readFileSync(tnsPath, "utf-8");
    const allTns: ITns = tns(content);
    const tnsConnectString: Record<string, string> = {};
    for (const key of Object.keys(allTns)) {
        const con_tns = allTns[key];

        if (con_tns.DESCRIPTION.ADDRESS_LIST) {
            tnsConnectString[key] = getTnsString(con_tns);
        }
    }

    return tnsConnectString;
};
