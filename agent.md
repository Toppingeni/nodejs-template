# โครงสร้างโปรเจกต์ (Agent Overview)

เอกสารนี้สรุปสถาปัตยกรรม ภาพรวมโฟลเดอร์ และแนวทางการเพิ่มฟีเจอร์ของโปรเจกต์ Node.js + TypeScript สำหรับเชื่อมต่อฐานข้อมูล Oracle ทั้งแบบ native (node-oracledb) และผ่าน ORM (Sequelize).

## ภาพรวมสถาปัตยกรรม

-   Server ใช้ Express เป็น HTTP API entrypoint และโหลดค่า environment จากไฟล์ `.env` ตาม `NODE_ENV` (dev/stag/prod)
-   รองรับการเชื่อม Oracle 2 แนวทาง:
    -   Native OracleDB (ประสิทธิภาพสูง ใช้งาน Stored Procedure/Function ได้ยืดหยุ่น)
    -   Sequelize (ORM เพื่อทำงานกับ Models)
-   แยกเลเยอร์ชัดเจน: Route → Controller → Service → Repository → DB Libraries
-   จัดการ Error และ 404 ด้วย Middleware กลาง

## โครงสร้างไฟล์

```
.
├─ agent.md
├─ README.md
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ server/
   ├─ server.ts               — Entry point, CORS, .env, Oracle Client, Router
   ├─ routes/
   │  ├─ index.ts            — รวม routes และผูก requestLogger
   │  └─ usersRoute.ts       — เส้นทาง `/users`
   ├─ controllers/
   │  └─ usersController.ts  — จัดการ request/response ของผู้ใช้
   ├─ services/
   │  └─ usersService.ts     — ธุรกิจลอจิกเรียก Repository
   ├─ repositories/
   │  ├─ usersRepository.ts  — ดึงข้อมูลด้วย Sequelize Model
   │  └─ transRepository.ts  — โครง repository สำหรับ Oracle Native
   ├─ libs/
   │  ├─ oracle/
   │  │  ├─ index.ts         — คลาส Oracle: query/command/.../SP
   │  │  ├─ oracledb.ts      — จัดการ connection ต่อคำสั่ง
   │  │  └─ config.ts        — อ่าน/แปลง tnsnames.ora
   │  └─ sequelize/
   │     ├─ index.ts         — init Sequelize และ initModels
   │     ├─ config.ts        — config จาก tnsnames.ora
   │     └─ models/
   │        ├─ index.ts      — รวมการ init models
   │        └─ usersModel.ts — โมเดล users
   ├─ middlewares/
   │  ├─ requestLogger.ts    — Log inbound request
   │  └─ errorHandler.ts     — 404 และ Error Handler
   ├─ utils/
   │  ├─ keyConverter.ts     — แปลงคีย์ camelCase ↔ snake_case
   │  ├─ sqlHelper.ts        — แทนค่าพารามิเตอร์ใน SQL
   │  └─ databaseHelper.ts   — ประกอบ TNS connect string
   └─ types/
      └─ oracleType.ts       — Types ที่ใช้กับ Oracle/TNS
```

## เส้นทางการทำงานของ Request

1. Client เรียก API → `server/routes/index.ts` ผูก `requestLogger`
2. ส่งเข้า route เฉพาะทาง (เช่น `/users`) → Controller
3. Controller เรียก Service → Service เรียก Repository
4. Repository เข้าถึง DB ผ่าน `libs/oracle` หรือ `libs/sequelize`
5. ส่งผลลัพธ์กลับ Controller → Response JSON
6. กรณีไม่พบเส้นทางหรือเกิดข้อผิดพลาด → `notFoundHandler`/`errorHandler`

## การเชื่อมต่อฐานข้อมูล

-   Oracle Native (`server/libs/oracle/index.ts`)
    -   `query/queries` — อ่านข้อมูล
    -   `command/commands` — เขียน/อัปเดต/ลบ พร้อม auto-commit เมื่อมีการเปลี่ยนแปลง
    -   `commandMany` — batch executeMany พร้อมตรวจจับ batch errors
    -   `commandSp/commandsSp` — เรียก Stored Procedure/Function พร้อมรับ OUT Binds
    -   `getSqlStmt/queryFromSqlTab/commandFromSqlTab` — ดึง SQL จากตารางเก็บสคริปต์ `KPDBA.SQL_TAB_OPPN`
-   Sequelize (`server/libs/sequelize/index.ts`)
    -   `initSequelize()` — สร้าง connection จากค่าใน `config.ts`
    -   `models/` — กำหนด Table/Fields/Primary keys

## การตั้งค่าและ Environment

-   ไฟล์ env: โหลดจาก `./.env` หรือ `./.env.<NODE_ENV>` โดย `server/server.ts`
-   ตัวแปรสำคัญ:
    -   `PORT` — พอร์ตรันเซิร์ฟเวอร์ (default 3000)
    -   `NODE_ENV` — development/staging/production เป็นต้น
    -   `ORACLE_CLIENT_PATH` — ตำแหน่งไลบรารี Oracle Client สำหรับ `initOracleClient`
    -   `ORACLE_DB_NAME` — ชื่อ TNS (เช่น `ORCL`)
    -   `ORACLE_USER`, `ORACLE_PWD` — บัญชีเชื่อมต่อ Oracle
    -   `APP_ID` — รหัสแอปสำหรับอ่าน SQL ใน `SQL_TAB_OPPN`
    -   `TNS_PATH` — โฟลเดอร์ที่มีไฟล์ `tnsnames.ora` (ถ้าไม่ระบุ ใช้ path ภายใน libs)
-   `tnsnames.ora`: ระบบอ่านจาก `${TNS_PATH}/tnsnames.ora` เพื่อประกอบ connect string

## สคริปต์ใช้งาน (npm)

-   `npm run dev` — รันด้วย `ts-node-dev` แบบ hot reload
-   `npm run build` — คอมไพล์ TypeScript ไปที่ `dist/`
-   `npm start` — รันจากไฟล์ที่คอมไพล์แล้ว `dist/server.js`
-   `npm run lint` / `npm run lint:fix` — ตรวจ/แก้สไตล์โค้ด

## แนวทางเพิ่มฟีเจอร์ (ตัวอย่าง CRUD ใหม่)

1. สร้างเส้นทาง: เพิ่มไฟล์ใน `server/routes/` และผูกใน `server/routes/index.ts`
2. Controller: เพิ่มฟังก์ชันใน `server/controllers/` เพื่อรับ/ตรวจพารามิเตอร์ และเรียก Service
3. Service: เขียนลอจิกใน `server/services/` (รวมหลาย Repository ได้)
4. Repository: เข้าถึง DB ใน `server/repositories/` ผ่าน Oracle หรือ Sequelize ตามความเหมาะสม
5. Model (ถ้าจำเป็น): สร้าง/แก้ใน `server/libs/sequelize/models/`
6. ทดสอบผ่าน Postman/HTTP client และตรวจ log จาก `requestLogger`

## หมายเหตุสำคัญ

-   ต้องติดตั้ง Oracle Client ในเครื่อง และตั้ง `ORACLE_CLIENT_PATH` ให้ถูกต้อง มิฉะนั้นจะไม่สามารถ init client ได้
-   ตรวจสอบให้แน่ใจว่า `tnsnames.ora` ถูกต้องและ `ORACLE_DB_NAME` ชี้ไปยัง entry ในไฟล์ดังกล่าว
-   ปกป้องค่า credential ด้วย vault/secret manager ตามตัวอย่างใน `README.md` (ใช้งาน `igs-vault`)

## อ้างอิงไฟล์หลัก

-   `server/server.ts:1` — Entry point, โหลด env, init Oracle Client, Router
-   `server/routes/index.ts:1` — รวม routes และผูก middleware
-   `server/middlewares/errorHandler.ts:1` — NotFound และ Error Handler
-   `server/libs/oracle/index.ts:1` — คลาส Oracle (native)
-   `server/libs/oracle/config.ts:1` — อ่าน/แปลง tnsnames.ora
-   `server/libs/sequelize/index.ts:1` — Init Sequelize และ raw query
-   `server/libs/sequelize/models/usersModel.ts:1` — ตัวอย่าง Model `users`
-   `server/utils/keyConverter.ts:1` — แปลงคีย์ object
-   `server/utils/sqlHelper.ts:1` — Helper แทนค่าพารามิเตอร์ใน SQL

---

เอกสารนี้ตั้งใจให้เป็นภาพรวมสั้น กระชับ เพื่อช่วย Onboard ทีมและเป็นคู่มือเพิ่มฟีเจอร์ใหม่ได้อย่างรวดเร็ว หากต้องการรายละเอียดเชิงลึกในส่วนใด แจ้งได้เพื่อเพิ่มตัวอย่างโค้ด/แผนภาพเพิ่มเติม

## ภาคผนวก: โค้ดไฟล์ทั้งหมด

หมายเหตุ: เพื่อลดขนาดไฟล์ เอกสารนี้ไม่รวม `package-lock.json` และโฟลเดอร์ `node_modules/` ซึ่งมีขนาดใหญ่ และไม่เกี่ยวกับการอ่านสถาปัตยกรรมโดยตรง

### README.md

````md
<!-- README.md -->

# NodeJS API

A REST API for comparing invoice data between Oracle and other systems using both native OracleDB and Sequelize ORM.

## Features

-   Dual database access (OracleDB + Sequelize)
-   TNS configuration support
-   Structured error handling
-   TypeScript support
-   ESLint for code quality

## Prerequisites

-   Node.js 18+
-   Oracle Client libraries
-   Oracle Database access
-   TNS configuration file

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo.git
cd your-repo
```
````

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# install igs-vault
npm i @ingeni/igs-vault -g

# login to igs-vault
igs-vault setup-script http://192.168.55.25:8200 username password

# load global env
# 1. load app env
igs-vault write stag/data/xxxx .env;
# 2. load app env
## MAC
igs-vault append global/data/dev/mac .env;
## LINUX
igs-vault append global/data/dev/linux .env
## Windows
igs-vault append global/data/dev/windows .env

```

## Running the API

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

````

### package.json

```jsonc
// package.json
{
    "name": "nodejs-template",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "lint": "eslint . --ext .ts",
        "lint:fix": "eslint . --ext .ts --fix",
        "test": "echo \"Error: no test specified\" && exit 1",
        "dev": "ts-node-dev --respawn server/server.ts",
        "build": "tsc",
        "start": "node dist/server.js"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "@types/express": "^5.0.1",
        "@types/node": "^22.14.0",
        "@types/sequelize": "^4.28.20",
        "cors": "^2.8.5",
        "dotenv": "^16.4.7",
        "express": "^5.1.0",
        "keys-converter": "^3.0.4",
        "oracledb": "^6.8.0",
        "sequelize": "^6.37.7",
        "sequelize-oracle": "^3.3.2-0.0",
        "tns": "^0.2.0",
        "ts-node": "^10.9.2",
        "typescript": "^5.8.3"
    },
    "devDependencies": {
        "@types/cors": "^2.8.19",
        "@types/oracledb": "^6.5.4",
        "@typescript-eslint/eslint-plugin": "^8.29.1",
        "@typescript-eslint/parser": "^8.29.1",
        "eslint": "^9.24.0",
        "ts-node-dev": "^2.0.0"
    }
}
````

### tsconfig.json

```jsonc
// tsconfig.json
{
    "compilerOptions": {
        /* Visit https://aka.ms/tsconfig.json to read more about this file */

        /* Projects */
        // "incremental": true,                              /* Enable incremental compilation */
        // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
        // "tsBuildInfoFile": "./",                          /* Specify the folder for .tsbuildinfo incremental compilation files. */
        // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects */
        // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
        // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */

        /* Language and Environment */
        "target": "es2016",
        "lib": ["es6"],
        // "jsx": "preserve",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        // "jsxFactory": "",
        // "jsxFragmentFactory": "",
        // "jsxImportSource": "",
        // "reactNamespace": "",
        // "noLib": true,
        // "useDefineForClassFields": true,

        /* Modules */
        "module": "commonjs",
        "rootDir": "src",
        // "moduleResolution": "node",
        // "baseUrl": "./",
        // "paths": {},
        // "rootDirs": [],
        // "typeRoots": [],
        // "types": [],
        // "allowUmdGlobalAccess": true,
        "resolveJsonModule": true,
        // "noResolve": true,

        /* JavaScript Support */
        "allowJs": true,
        // "checkJs": true,
        // "maxNodeModuleJsDepth": 1,

        /* Emit */
        // "declaration": true,
        // "declarationMap": true,
        // "emitDeclarationOnly": true,
        // "sourceMap": true,
        // "outFile": "./",
        "outDir": "build",
        // "removeComments": true,
        // "noEmit": true,
        // "importHelpers": true,
        // "importsNotUsedAsValues": "remove",
        // "downlevelIteration": true,
        // "sourceRoot": "",
        // "mapRoot": "",
        // "inlineSourceMap": true,
        // "inlineSources": true,
        // "emitBOM": true,
        // "newLine": "crlf",
        // "stripInternal": true,
        // "noEmitHelpers": true,
        // "noEmitOnError": true,
        // "preserveConstEnums": true,
        // "declarationDir": "./",
        // "preserveValueImports": true,

        /* Interop Constraints */
        // "isolatedModules": true,
        // "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        // "preserveSymlinks": true,
        "forceConsistentCasingInFileNames": true,

        /* Type Checking */
        "strict": true,
        "noImplicitAny": true,
        // "strictNullChecks": true,
        // "strictFunctionTypes": true,
        // "strictBindCallApply": true,
        // "strictPropertyInitialization": true,
        // "noImplicitThis": true,
        // "useUnknownInCatchVariables": true,
        // "alwaysStrict": true,
        // "noUnusedLocals": true,
        // "noUnusedParameters": true,
        // "exactOptionalPropertyTypes": true,
        // "noImplicitReturns": true,
        // "noFallthroughCasesInSwitch": true,
        // "noUncheckedIndexedAccess": true,
        // "noImplicitOverride": true,
        // "noPropertyAccessFromIndexSignature": true,
        // "allowUnusedLabels": true,
        // "allowUnreachableCode": true,

        /* Completeness */
        // "skipDefaultLibCheck": true,
        "skipLibCheck": true
    },
    "include": ["server/**/*.ts"]
}
```

### server/server.ts

```ts
// server/server.ts
// Set application timezone to match server location
process.env.TZ = "Asia/Bangkok";

import express from "express";
import { initOracleClient } from "oracledb";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config({
    path: `${__dirname}/../.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
    }`,
});
console.log("ORACLE_CLIENT_PATH", process.env.ORACLE_CLIENT_PATH);
if (process.env.ORACLE_CLIENT_PATH) {
    try {
        initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
    } catch (err) {
        console.error("Failed to initialize Oracle Client:", err);
        throw new Error(
            "Cannot load Oracle Client. Ensure ORACLE_CLIENT_PATH is set correctly."
        );
    }
} else {
    console.warn(
        "ORACLE_CLIENT_PATH is not set. Ensure the Oracle Client is installed and configured."
    );
}

// Error handling
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
// import { initSequelize } from "./libs/sequelize";

//// Initialize Sequelize before starting the server
// (async () => {
//     try {
//         await initSequelize();
//         console.log("Database initialized successfully");
//     } catch (error) {
//         console.error("Failed to initialize database:", error);
//         process.exit(1);
//     }
// })();

import router from "./routes";
import cors from "cors";
// Now import other modules that depend on environment variables
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(
    cors({
        origin: [
            "http://192.168.55.38:51106",
            "http://localhost:3101",
            "http://localhost:3000",
        ],
    })
);

// Routes
app.use("/", router);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// exit
process.on("SIGINT", () => {
    console.log("Server shutting down...");
    process.exit(0);
});
process.on("SIGTERM", () => {
    console.log("Server shutting down...");
    process.exit(0);
});

// import { createModel } from "./utils/modelGenerator";
// async function main() {
//     createModel("SUPPLIER");
// }
// main();
```

### server/routes/index.ts

```ts
// server/routes/index.ts
import { Router } from "express";
import usersRouter from "./usersRoute";
import { requestLogger } from "../middlewares/requestLogger";

const router = Router();
router.use(requestLogger);
router.use("/users", usersRouter);

export default router;
```

### server/routes/usersRoute.ts

```ts
// server/routes/usersRoute.ts
import { Router } from "express";
import usersController from "../controllers/usersController";

const router = Router();

router.get("/", usersController.getUsers);

export default router;
```

### server/controllers/usersController.ts

```ts
// server/controllers/usersController.ts
import { Request, Response, NextFunction } from "express";
import usersService from "../services/usersService";

class UserController {
    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.getUsers();
            res.json({ message: "Invoice diff endpoint", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
```

### server/libs/oracle/oracledb.ts

```ts
// server/libs/oracle/oracledb.ts
import type { Connection } from "oracledb";
import { getConnection } from "oracledb";
import { getConfig } from "./config";
import dotenv from "dotenv";
// Load environment variables first
dotenv.config({
    path: `${__dirname}/../.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""
    }`,
});
export type IOracleDB = ReturnType<typeof oracleDB>;

async function oracleDB(mode: string) {
    const config = await getConfig();

    if (!config[mode]) throw new Error("Oracle connection string not found");

    return getConnection({
        user: process.env.ORACLE_USER || "",
        password: process.env.ORACLE_PWD || "",
        connectString: config[mode],
    });
}

export async function oracleConnection(
    mode: string,
    callback: (connection: Connection) => Promise<any>
) {
    const connection = await oracleDB(mode);

    try {
        return await callback(connection);
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}
```

### server/libs/oracle/config.ts

```ts
// server/libs/oracle/config.ts
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
```

### server/libs/oracle/index.ts

```ts
// server/libs/oracle/index.ts
import oracledb, { initOracleClient } from "oracledb";

import { oracleConnection } from "./oracledb";
import type { CommandsSpType } from "../../types/oracleType";
import { convertSQL } from "../../utils/sqlHelper";

class Oracle {
    dbName: string;
    appID: string;
    options = {
        autoCommit: false,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
    };
    optionExecuteMany = {
        autoCommit: false,
        batchErrors: true,
    };
    constructor(dbName?: string, appID?: string) {
        this.dbName = dbName || process.env.ORACLE_DB_NAME!;
        this.appID = appID || process.env.APP_ID!;
    }

    /*
  For Function query, queries, command, and commands

  Read on => https://node-oracledb.readthedocs.io/en/latest/user_guide/sql_execution.html
  Example:
  const sql = `SELECT * FROM mytab WHERE id = :id`
  const params = { id: 101 }
  const result = await command(sql, params, options)
  */
    async query<T>(
        sql: string,
        params: oracledb.BindParameters = {},
        options?: oracledb.ExecuteOptions
    ) {
        return await oracleConnection(this.dbName, async (connection) => {
            try {
                const result = await connection.execute<T>(sql, params, {
                    ...this.options,
                    ...options,
                });

                return result.rows ? result.rows : [];
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error querying Oracle database"
                );
            }
        });
    }

    async queries<T>(
        queries: { sql: string; params: oracledb.BindParameters }[]
    ) {
        await oracleConnection(this.dbName, async (connection) => {
            try {
                const results = await Promise.all(
                    queries.map(async (query) => {
                        const result = await connection.execute<T>(
                            query.sql,
                            query.params,
                            this.options
                        );

                        return result.rows ? result.rows : [];
                    })
                );

                return results;
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error querying Oracle database"
                );
            }
        });
    }

    async command<T>(sql: string, params: oracledb.BindParameters) {
        return await oracleConnection(this.dbName, async (connection) => {
            try {
                const result = await connection.execute<T>(
                    sql,
                    params,
                    this.options
                );

                if (result.rowsAffected && result.rowsAffected > 0) {
                    await connection.commit();
                }

                return result;
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error executing Oracle command"
                );
            }
        });
    }

    async commands<T>(
        commands: { sql: string; params: oracledb.BindParameters }[]
    ) {
        return await oracleConnection(this.dbName, async (connection) => {
            try {
                const results = await Promise.all(
                    commands.map(async (command) => {
                        const result = await connection.execute<T>(
                            command.sql,
                            command.params,
                            this.options
                        );

                        return result;
                    })
                );

                if (
                    results.some(
                        (result) =>
                            result.rowsAffected && result.rowsAffected > 0
                    )
                ) {
                    await connection.commit();
                }

                return results;
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error executing Oracle command"
                );
            }
        });
    }

    /*
  Read on => https://node-oracledb.readthedocs.io/en/latest/user_guide/batch_statement.html#handling-data-errors-with-executemany
  Example:
  const sql = `INSERT INTO mytab VALUES (:1, :2)`
  const binds = [
    [101, 'Alpha'],
    [102, 'Beta'],
    [103, 'Gamma']
  ]
  const options = {
    bindDefs: {
      1: { type: oracledb.NUMBER },
      2: { type: oracledb.STRING, maxSize: 20 }
    }
  }
  await commandMany(sql, binds, options)
  */
    async commandMany<T>(
        sql: string,
        params: oracledb.BindParameters[],
        bindDefs: oracledb.BindDefinition
    ) {
        return await oracleConnection(this.dbName, async (connection) => {
            try {
                const options = {
                    ...this.optionExecuteMany,
                    bindDefs,
                } as oracledb.ExecuteManyOptions;
                const result = await connection.executeMany<T>(
                    sql,
                    params,
                    options
                );

                if (result.batchErrors && result.batchErrors.length > 0) {
                    await connection.rollback();
                    throw new Error(result.batchErrors[0].message);
                }

                return result;
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error executing Oracle command"
                );
            }
        });
    }

    /*

  Example:
   const spName = `KPDBA.PACK_COSTING.SP_GET_COST_ID`;
   const input: InOutParamsType = {
      AN_YEAR: {
        type: OracleDB.NUMBER,
        dir: OracleDB.BIND_IN,
        value: year,
      },
      AN_MONTH: {
        type: OracleDB.NUMBER,
        dir: OracleDB.BIND_IN,
        value: month,
      },
    };
    const out: InOutParamsType = {
      V_NEW_COST_ID: { type: oracledb.STRING, dir: OracleDB.BIND_OUT },
    };
    type SpOutputType = { V_NEW_COST_ID: string; }
    const res = await commandSp<SpOutputType>({
      spName
      output: out,
      input: input,
    });
    return res.output.V_NEW_COST_ID;
  */
    async commandSp<T>(
        queries: CommandsSpType
    ): Promise<{ rowsAffected: number; output: T }> {
        try {
            const result = await this.commandsSp([queries]);

            return result[0];
        } catch (error: any) {
            console.error(error);
            throw new Error(error.message || "Error executing Oracle command");
        }
    }
    async commandsSp(
        queries: CommandsSpType[]
    ): Promise<{ rowsAffected: number; output: any }[]> {
        return await oracleConnection(this.dbName, async (connection) => {
            try {
                const output = [];
                const _sqlLog: string[] = [];

                for await (const obj of queries) {
                    const _sql = `
              BEGIN
              ${obj.spName}(${
                        obj.input
                            ? Object.keys(obj.input)
                                  .map((x) => `:${x}`)
                                  .join(", ")
                            : ""
                    }${obj.input ? "," : ""}${
                        obj.output
                            ? Object.keys(obj.output)
                                  .map((x) => `:${x}`)
                                  .join(", ")
                            : ""
                    });
            END;`;

                    const convertParam = obj.input
                        ? Object.keys(obj.input).reduce((pre, curr) => {
                              return { ...pre, [curr]: obj.input![curr].value };
                          }, {})
                        : undefined;

                    const sql = convertSQL("oracle", _sql, convertParam);

                    _sqlLog.push(sql);
                    const bindOutput: any = {};

                    if (obj.output !== undefined) {
                        Object.keys(obj.output).forEach((x) => {
                            bindOutput[x] = {
                                type: obj.output![x].type,
                                dir: obj.output![x].dir,
                                value: obj.output![x].value,
                            };
                        });
                    }

                    const res = await connection.execute(sql, bindOutput, {
                        autoCommit: false,
                    });

                    output.push({
                        rowsAffected: res.rowsAffected || 0,
                        output: res.outBinds,
                    });
                }

                await connection.commit();

                return Promise.resolve(output);
            } catch (error: any) {
                console.error(error);
                throw new Error(
                    error.message || "Error executing Oracle command"
                );
            }
        });
    }

    async getSqlStmt(sqlNo: number, _appId?: number): Promise<string> {
        try {
            const appId = _appId ?? this.appID;
            const sqlTab = `SELECT  SQL_STMT FROM KPDBA.SQL_TAB_OPPN sto WHERE app_id = ${appId} AND sql_no = ${sqlNo}`;

            // ลองใช้ oracledb.STRING.num แล้วไม่ได้เลยต้อง cast แบบนี้
            const result = await this.query<{ SQL_STMT: string }>(sqlTab, [], {
                fetchInfo: {
                    SQL_STMT: { type: oracledb.STRING },
                } as any,
            });

            return result[0].SQL_STMT;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async queryFromSqlTab<T>(
        sqlNo: number,
        params: oracledb.BindParameters
    ): Promise<T[]> {
        try {
            const sql = await this.getSqlStmt(sqlNo);

            // console.log(sql)

            const result = await this.query<T>(sql as string, params);

            return result;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async commandFromSqlTab<T>(
        sqlNo: number,
        params: oracledb.BindParameters
    ): Promise<oracledb.Result<T>> {
        try {
            const sql = await this.getSqlStmt(sqlNo);

            const result = await this.command<T>(sql as string, params);

            return result;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
}

const oracleInstance = new Oracle(process.env.ORACLE_DB_NAME || "ORCL");
export { oracleInstance as oracle };
export default Oracle;
```

### server/libs/sequelize/config.ts

```ts
// server/libs/sequelize/config.ts
import { Dialect } from "sequelize";
import fs from "fs";
import type { ITns, ITnsConfig } from "../../types/oracleType";
import { getTnsString } from "../../utils/databaseHelper";

const tns = require("tns").default;

export interface SequelizeConfig {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: Dialect;
    logging?: boolean | ((sql: string, timing?: number) => void);
    tnsConnectString: string;
    quoteIdentifiers?: boolean;
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
    const tnsConnectString: string = getTnsString(allTns[dbName]);
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
        logging: (e) => {
            // Custom logging function
            console.log("SQL executed", e);
        },
        quoteIdentifiers: false,
        tnsConnectString,
    };
};
```

### server/libs/sequelize/index.ts

```ts
// server/libs/sequelize/index.ts
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
```

### server/libs/sequelize/models/index.ts

```ts
// server/libs/sequelize/models/index.ts
import { Sequelize } from "sequelize";
import { initUserModel } from "./usersModel";

export const initModels = (sequelize: Sequelize) => {
    initUserModel(sequelize);
};
```

### server/libs/sequelize/models/usersModel.ts

```ts
// server/libs/sequelize/models/usersModel.ts
import { DataTypes, Model, Sequelize } from "sequelize";

class User extends Model {
    public user_id!: number;
    public user_name!: string;
}

export const initUserModel = (sequelize: Sequelize) => {
    User.init(
        {
            user_id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            user_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "users",
            tableName: "users",
            timestamps: false,
        }
    );
};

export default User;
```

### server/middlewares/requestLogger.ts

```ts
// server/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers["x-forwarded-for"] || req.ip;
    const auth = req.headers.authorization
        ? req.headers.authorization.startsWith("Bearer ")
            ? "Bearer token"
            : req.headers.authorization
        : "None";

    console.log(
        `[${new Date().toISOString()}] ${req.method} ${
            req.originalUrl
        } - IP: ${ip}, Auth: ${auth}`
    );

    next();
}
```

### server/middlewares/errorHandler.ts

```ts
// server/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

interface ErrorResponse {
    status: number;
    message: string;
    stack?: string;
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const response: ErrorResponse = {
        status: statusCode,
        message: err.message,
    };

    // Only show stack in development
    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

export function notFoundHandler(
    req: Request,
    res: Response,
    next: NextFunction
) {
    res.status(404);
    const error = new Error(`Not Found - ${req.originalUrl}`);
    next(error);
}
```

### server/utils/keyConverter.ts

```ts
// server/utils/keyConverter.ts
import {
    objectKeysToCamelCaseV2,
    objectKeysToSnakeCaseV2,
} from "keys-converter";

/**
 * แปลง object หรือ array ของ objects จาก snake_case เป็น camelCase
 * @param data - Object หรือ Array ของ objects ที่ต้องการแปลง
 * @returns Object หรือ Array ที่มี keys เป็น camelCase
 */
export function convertSnakeToCamelCase<T>(data: T): T {
    // ตรวจสอบว่าเป็น null หรือ undefined
    if (data === null || data === undefined) {
        return data;
    }

    // ตรวจสอบว่าเป็น array หรือไม่
    if (Array.isArray(data)) {
        return data.map((item) => {
            // ถ้าเป็น object ให้แปลง keys
            if (typeof item === "object" && item !== null) {
                return objectKeysToCamelCaseV2(item);
            }
            // ถ้าไม่ใช่ object ให้ return ค่าเดิม
            return item;
        }) as T;
    }

    // ถ้าเป็น object (แต่ไม่ใช่ array)
    if (typeof data === "object") {
        return objectKeysToCamelCaseV2(data) as T;
    }

    // ถ้าไม่ใช่ object หรือ array ให้ return ค่าเดิม
    return data;
}

/**
 * Helper function: แปลง keys ของ object เป็น uppercase
 * @param obj - Object ที่ต้องการแปลง keys เป็น uppercase
 * @returns Object ที่มี keys เป็น uppercase
 */
function convertKeysToUpperCase(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToUpperCase(item));
    }

    if (typeof obj === "object") {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const upperKey = key.toUpperCase();
                result[upperKey] = convertKeysToUpperCase(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

/**
 * แปลง object หรือ array ของ objects จาก camelCase เป็น snake_case
 * @param data - Object หรือ Array ของ objects ที่ต้องการแปลง
 * @param toUpper - ถ้าเป็น true จะแปลงเป็น UPPERCASE_SNAKE_CASE (default: false)
 * @returns Object หรือ Array ที่มี keys เป็น snake_case หรือ UPPERCASE_SNAKE_CASE
 */
export function convertCamelToSnakeCase<T>(
    data: T,
    toUpper: boolean = false
): T {
    // ตรวจสอบว่าเป็น null หรือ undefined
    if (data === null || data === undefined) {
        return data;
    }

    // ตรวจสอบว่าเป็น array หรือไม่
    if (Array.isArray(data)) {
        return data.map((item) => {
            // ถ้าเป็น object ให้แปลง keys
            if (typeof item === "object" && item !== null) {
                const converted = objectKeysToSnakeCaseV2(item);
                return toUpper ? convertKeysToUpperCase(converted) : converted;
            }
            // ถ้าไม่ใช่ object ให้ return ค่าเดิม
            return item;
        }) as T;
    }

    // ถ้าเป็น object (แต่ไม่ใช่ array)
    if (typeof data === "object") {
        const converted = objectKeysToSnakeCaseV2(data) as T;
        return toUpper ? (convertKeysToUpperCase(converted) as T) : converted;
    }

    // ถ้าไม่ใช่ object หรือ array ให้ return ค่าเดิม
    return data;
}
```

### server/utils/sqlHelper.ts

```ts
// server/utils/sqlHelper.ts
import moment from "moment";

export function convertParam(
    value: string | number | boolean | Date | null,
    format: "mssql" | "oracle"
): string {
    if (value === null && typeof value === "object") return "NULL";
    if (Object.prototype.toString.call(value) === "[object Null]")
        return "null";

    try {
        switch (typeof value) {
            case "string":
                return `'${value}'`;
            case "number":
                return value.toString();
            case "boolean":
                return value ? "1" : "0";
            case "object":
                if (Object.prototype.toString.call(value) === "[object Date]") {
                    return format === "mssql"
                        ? `CONVERT(DATETIME, '${value.toISOString()}',127)`
                        : `TO_DATE('${moment(value).format(
                              "YYYY-MM-DD HH:mm:ss"
                          )}', 'YYYY-MM-DD HH24:MI:SS')`;
                }

                throw new Error(
                    "Unsupported type:" +
                        typeof value +
                        Object.prototype.toString.call(value)
                );
            default:
                throw new Error(
                    "Unsupported type:" +
                        typeof value +
                        Object.prototype.toString.call(value)
                );
        }
    } catch (err) {
        throw err;
    }
}

export function convertSQL(
    format: "mssql" | "oracle",
    sql: string,
    params?: Record<string, string | number | boolean | Date | null>,
    clobData?: string[]
): string {
    if (!params) return sql;

    try {
        const keys = Object.keys(params);

        if (keys.length === 0) return sql;
        const key = keys.shift() || "";
        const value = convertParam(params[key], format);

        delete params[key];

        const _sql = clobData?.includes(key)
            ? sql
            : sql
                  .replace(new RegExp(`:${key}\\b`, "g"), value)
                  .replace(new RegExp(`@${key}\\b`, "g"), value)
                  .replace(new RegExp(`:${key.toUpperCase()}\\b`, "g"), value)
                  .replace(new RegExp(`@${key.toUpperCase()}\\b`, "g"), value);

        return convertSQL(format, _sql, params);
    } catch (err) {
        throw err;
    }
}
```

### server/utils/databaseHelper.ts

```ts
// server/utils/databaseHelper.ts
import { ITnsConfig } from "../types/oracleType";

export function getTnsString(con_tns: ITnsConfig): string {
    return `(DESCRIPTION = (ADDRESS_LIST = (ADDRESS = (PROTOCOL = ${
        con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PROTOCOL
    })(HOST = ${con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.HOST})(PORT = ${
        con_tns.DESCRIPTION.ADDRESS_LIST.ADDRESS.PORT
    }))) (CONNECT_DATA =(SID = ${con_tns.DESCRIPTION.CONNECT_DATA.SID}) ${
        con_tns.DESCRIPTION.CONNECT_DATA.SRVR ||
        con_tns.DESCRIPTION.CONNECT_DATA.SERVER
            ? `(SERVER = ${
                  con_tns.DESCRIPTION.CONNECT_DATA.SRVR ||
                  con_tns.DESCRIPTION.CONNECT_DATA.SERVER
              })`
            : ""
    }))`;
}
```

### server/utils/modelGenerator.ts

```ts
// server/utils/modelGenerator.ts
import { oracle } from "../libs/oracle";
import { writeFileSync } from "fs";
import OracleDB, { STRING } from "oracledb";
import { join } from "path";

interface OracleColumn {
    COLUMN_NAME: string;
    DATA_TYPE: string;
    DATA_LENGTH: number;
    NULLABLE: "Y" | "N";
}

// Map Oracle types to Sequelize types
const typeMap: Record<string, string> = {
    VARCHAR2: "STRING",
    CHAR: "STRING",
    NUMBER: "NUMBER",
    DATE: "DATE",
    TIMESTAMP: "DATE",
    CLOB: "TEXT",
    BLOB: "BLOB",
};

export async function createModel(table: string) {
    try {
        // Get table columns info from Oracle
        const sql = `SELECT column_name, data_type, data_length, nullable FROM all_tab_columns WHERE table_name = '${table.toUpperCase()}' ORDER BY column_id`;
        const columns = await oracle.query<any>(sql);

        if (!columns.length) {
            throw new Error(`Table ${table} not found or has no columns`);
        }

        // Generate model content
        let modelContent = `import { DataTypes, Model } from 'sequelize'\n`;
        modelContent += `import sequelize from '../libs/sequelize'\n\n`;
        modelContent += `class ${table} extends Model {\n`;

        // Add property declarations
        columns.forEach((col: OracleColumn) => {
            modelContent += `  public ${col.COLUMN_NAME.toLowerCase()}!: ${getTsType(
                col.DATA_TYPE
            )}\n`;
        });

        modelContent += `}\n\n`;

        // Add model init
        modelContent += `${table}.init({\n`;
        columns.forEach((col: OracleColumn) => {
            modelContent += `  ${col.COLUMN_NAME.toLowerCase()}: {\n`;
            modelContent += `    type: DataTypes.${
                typeMap[col.DATA_TYPE] || "STRING"
            },\n`;
            if (col.DATA_TYPE === "VARCHAR2" || col.DATA_TYPE === "CHAR") {
                modelContent += `    allowNull: ${
                    col.NULLABLE === "Y" ? "true" : "false"
                },\n`;
            }
            modelContent += `  },\n`;
        });
        modelContent += `}, {\n`;
        modelContent += `  sequelize,\n`;
        modelContent += `  modelName: '${table}',\n`;
        modelContent += `  tableName: '${table.toUpperCase()}',\n`;
        modelContent += `  timestamps: false\n`;
        modelContent += `})\n\n`;
        modelContent += `export default ${table}`;

        // Write model file
        const modelPath = join(
            __dirname,
            "../libs/sequelize/models",
            `${table.toLowerCase()}Model.ts`
        );
        writeFileSync(modelPath, modelContent);

        console.log(
            `Successfully created model for table ${table} at ${modelPath}`
        );
    } catch (error) {
        console.error(`Error creating model for table ${table}:`, error);
        throw error;
    }
}

function getTsType(oracleType: string): string {
    switch (oracleType) {
        case "NUMBER":
            return "number";
        case "DATE":
        case "TIMESTAMP":
            return "Date";
        default:
            return "string";
    }
}
```

### server/repositories/usersRepository.ts

```ts
// server/repositories/usersRepository.ts
import User from "../libs/sequelize/models/usersModel";

class UserRepository {
    async getUsers() {
        const res = await User.findAll();
        console.log(res);
        return res;
    }
}

export default new UserRepository();
```

### server/repositories/transRepository.ts

```ts
// server/repositories/transRepository.ts
import Oracle from "../libs/oracle";

class TransRepository {
    private oracle: Oracle;

    constructor() {
        this.oracle = new Oracle(
            process.env.ORACLE_DB_NAME,
            process.env.APP_ID
        );
    }

    async getTrans() {
        return "";
    }

    async getAllMachines() {
        return "";
    }
}

export default new TransRepository();
```

### server/services/usersService.ts

```ts
// server/services/usersService.ts
import User from "../libs/sequelize/models/usersModel";
import usersRepository from "../repositories/usersRepository";

class UserService {
    async getUsers() {
        const users = usersRepository.getUsers();
        return users;
    }
}

export default new UserService();
```

### server/types/oracleType.ts

```ts
// server/types/oracleType.ts
export type ITnsConfig = {
    DESCRIPTION: {
        ADDRESS_LIST: {
            ADDRESS: { PROTOCOL: string; HOST: string; PORT: string };
        };
        CONNECT_DATA: { SID: string; SERVER?: string; SRVR?: string };
    };
};

export type ITns = Record<string, ITnsConfig>;
export type IMssqlConfig = {
    user: string;
    password: string;
    server: string;
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
    };
    options: {
        trustServerCertificate: boolean;
    };
};

export type InOutParamsType = {
    [key: string]: {
        type: any;
        value?: any;
        dir?: unknown;
    };
};

export type CommandsSpType = {
    spName: string;
    input: InOutParamsType;
    output: InOutParamsType | undefined;
};
```
