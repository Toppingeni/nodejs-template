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
