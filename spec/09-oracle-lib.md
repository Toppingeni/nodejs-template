# Oracle Database Library

## โครงสร้าง

```
server/libs/oracle/
├── config.ts     # อ่าน tnsnames.ora → connection strings
├── oracledb.ts   # Connection management (auto-close)
└── index.ts      # Oracle class — query, command, stored procedure
```

## Connection (`oracledb.ts`)

```ts
import type { Connection } from 'oracledb';
import oracledb from 'oracledb';
import { getConfig } from './config';

async function oracleDB(mode: string) {
  const config = await getConfig();
  if (!config[mode]) throw new Error('Oracle connection string not found');

  return oracledb.getConnection({
    user: process.env.ORACLE_USER || '',
    password: process.env.ORACLE_PWD || '',
    connectString: config[mode],
  });
}

// Auto-close connection wrapper
export async function oracleConnection(mode: string, callback: (connection: Connection) => Promise<any>) {
  const connection = await oracleDB(mode);
  try {
    return await callback(connection);
  } finally {
    try {
      await connection.close();
    } catch (err) {
      console.error(err);
    }
  }
}
```

## Config (`config.ts`)

```ts
import fs from 'fs';
import tns from 'tns';

export const getConfig = async () => {
  const tnsPath = `${process.env.TNS_PATH || process.cwd()}/tnsnames.ora`;
  const content = fs.readFileSync(tnsPath, 'utf-8');
  const allTns = tns(content);
  const result: Record<string, string> = {};

  for (const key of Object.keys(allTns)) {
    const con = allTns[key];
    if (con.DESCRIPTION.ADDRESS_LIST) {
      result[key] = getTnsString(con); // convert TNS object → connection string
    }
  }
  return result;
};
```

## Oracle Class (`index.ts`)

Singleton class ที่ให้ methods หลักๆ:

```ts
class Oracle {
  dbName: string;
  options = { autoCommit: false, outFormat: oracledb.OUT_FORMAT_OBJECT };

  constructor(dbName?: string) {
    this.dbName = dbName || process.env.ORACLE_DB_NAME!;
  }

  // SELECT
  async query<T>(sql: string, params = {}): Promise<T[]> {
    return await oracleConnection(this.dbName, async (conn) => {
      const result = await conn.execute<T>(sql, params, this.options);
      return result.rows || [];
    });
  }

  // INSERT/UPDATE/DELETE (auto-commit on success)
  async command<T>(sql: string, params) {
    return await oracleConnection(this.dbName, async (conn) => {
      const result = await conn.execute<T>(sql, params, this.options);
      if (result.rowsAffected && result.rowsAffected > 0) {
        await conn.commit();
      }
      return result;
    });
  }

  // Multiple commands in single transaction
  async commands<T>(commands: { sql: string; params }[]) {
    return await oracleConnection(this.dbName, async (conn) => {
      try {
        const results = await Promise.all(
          commands.map((cmd) => conn.execute<T>(cmd.sql, cmd.params, this.options))
        );
        if (results.some((r) => r.rowsAffected && r.rowsAffected > 0)) {
          await conn.commit();
        }
        return results;
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    });
  }

  // Batch insert/update (executeMany)
  async commandMany<T>(sql: string, params[], bindDefs) {
    return await oracleConnection(this.dbName, async (conn) => {
      const result = await conn.executeMany<T>(sql, params, { autoCommit: false, batchErrors: true, bindDefs });
      if (result.batchErrors?.length > 0) {
        await conn.rollback();
        throw new Error(result.batchErrors[0].message);
      }
      return result;
    });
  }

  // Stored Procedure
  async commandSp<T>(spConfig): Promise<{ rowsAffected: number; output: T }> {
    // Build BEGIN...END block จาก spConfig
    // Execute + commit
  }
}

export const oracle = new Oracle();
```

## ใช้งานใน Repository

```ts
import { oracle } from '../libs/oracle';

class SampleRepository {
  async findAll() {
    return oracle.query<SampleRow>("SELECT * FROM {SCHEMA}.SAMPLE_TABLE WHERE STATUS = 'A'");
  }

  async findById(id: string) {
    const rows = await oracle.query<SampleRow>('SELECT * FROM {SCHEMA}.SAMPLE_TABLE WHERE ID = :id', { id });
    return rows[0] || null;
  }

  async create(data: CreateSampleDto) {
    return oracle.command(
      `INSERT INTO {SCHEMA}.SAMPLE_TABLE (ID, NAME, CREATED_BY)
       VALUES (:id, :name, :createdBy)`,
      { id: data.id, name: data.name, createdBy: data.userId },
    );
  }

  async update(id: string, data: UpdateSampleDto) {
    return oracle.command(
      `UPDATE {SCHEMA}.SAMPLE_TABLE SET NAME = :name, UPDATED_BY = :updatedBy
       WHERE ID = :id`,
      { id, name: data.name, updatedBy: data.userId },
    );
  }

  async delete(id: string) {
    return oracle.command("UPDATE {SCHEMA}.SAMPLE_TABLE SET STATUS = 'D' WHERE ID = :id", { id });
  }
}
```

## Environment Variables

```
ORACLE_DB_NAME=ORCL          # ชื่อ DB ใน tnsnames.ora
ORACLE_USER=KPDB
ORACLE_PWD=xxx
ORACLE_CLIENT_PATH=/path     # สำหรับ Thick mode (optional)
TNS_PATH=/path               # path ไปหา tnsnames.ora
```

## Key Points

- ทุก connection **auto-close** ผ่าน `oracleConnection()` wrapper
- `query()` = SELECT, `command()` = INSERT/UPDATE/DELETE
- `commands()` = multiple SQL in **single transaction** (rollback ถ้า error)
- `commandMany()` = batch operations ด้วย `executeMany`
- Output format: `OUT_FORMAT_OBJECT` → return เป็น object (ไม่ใช่ array)
- Column names จาก Oracle เป็น UPPER_SNAKE → ใช้ `convertSnakeToCamelCase()` แปลง
