import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import type { ITns } from "../../types/oracleType";

// `tns` เป็น Babel-style CJS (`exports.default = parse`) — Node ESM ไม่ unwrap
// `__esModule` ให้ ดังนั้น `import tns from "tns"` ใน prod bundle จะได้ wrapper object
// ไม่ใช่ function → `TypeError: tns is not a function`. ต้อง require + .default เอง
const require = createRequire(import.meta.url);
const tns = require("tns").default as (content: string) => ITns;

import { getTnsString } from "../../utils/databaseHelper";
import { config } from "../../config/unifiedConfig";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getConfig = async () => {
    const tnsPath = (config.TNS_PATH ? config.TNS_PATH : __dirname) + "/tnsnames.ora";
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
