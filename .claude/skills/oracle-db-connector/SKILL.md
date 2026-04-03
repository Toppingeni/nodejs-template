---
name: "oracle-db-connector"
description: "Provides guidelines and examples for Oracle DB connections, queries, and stored procedures in this project. Invoke when working with Oracle Database, creating repositories, or writing SQL."
---

# Oracle DB Connector

Guidelines and examples for Oracle Database usage in this project.

## Related Files

- `src/libs/oracle/config.ts` - reads and converts connection string from `tnsnames.ora`
- `src/libs/oracle/oracledb.ts` - manages Oracle Connection Pool
- `src/libs/oracle/index.ts` - `Oracle` utility class (`query`, `command`, `commandSp`, etc.)
- `src/types/oracleType.ts` - Oracle DB types

---

## Best Practices

1. **Never create connections manually** - project uses Connection Pool in `src/libs/oracle/oracledb.ts`
2. **Never concatenate SQL strings** - always use bind parameters (`:paramName`) to prevent SQL injection
3. **Use singleton instance** - import `oracle` from `src/libs/oracle/index.ts` (or `src/libs/oracle`)
4. **Always specify types** - when using `.query<T>()`, define the result interface/type

---

## Examples

### 1. SELECT (Query)

```typescript
import { oracle } from "../../libs/oracle";

interface IUserRow {
  USER_ID: number;
  USERNAME: string;
}

export const getActiveUsers = async () => {
  const sql = `
    SELECT USER_ID, USERNAME 
    FROM USERS 
    WHERE STATUS = :status
  `;
  const users = await oracle.query<IUserRow>(sql, { status: "ACTIVE" });
  return users;
};
```

### 2. INSERT/UPDATE/DELETE (Command)

```typescript
import { oracle } from "../../libs/oracle";

export const updateUserStatus = async (userId: number, status: string) => {
  const sql = `
    UPDATE USERS 
    SET STATUS = :status 
    WHERE USER_ID = :userId
  `;
  const result = await oracle.command(sql, { status, userId });
  return result.rowsAffected;
};
```

### 3. Stored Procedure

```typescript
import { oracle } from "../../libs/oracle";
import oracledb from "oracledb";

export const callUserProcedure = async (userId: number) => {
  const result = await oracle.commandSp({
    spName: "PKG_USER.GET_USER_INFO",
    input: {
      p_user_id: { type: oracledb.NUMBER, value: userId },
    },
    output: {
      p_result_cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      p_error_code: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
    },
  });
  return result.output;
};
```

### 4. Multiple Commands in a Single Transaction

```typescript
import { oracle } from "../../libs/oracle";

export const processMultipleCommands = async () => {
  const commands = [
    {
      sql: `INSERT INTO LOGS (MSG) VALUES (:msg)`,
      params: { msg: "Step 1" },
    },
    {
      sql: `UPDATE USERS SET LAST_LOGIN = SYSDATE WHERE USER_ID = :id`,
      params: { id: 1 },
    },
  ];
  // Auto-commits on success, rollbacks on any error
  await oracle.commands(commands);
};
```
