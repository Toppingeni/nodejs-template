# Oracle Methods Reference

All available methods on the `oracle` singleton from `src/libs/oracle/index.ts`.

---

## 1. query — SELECT (Read)

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
    return oracle.query<IUserRow>(sql, { status: "ACTIVE" });
};
```

**Checklist:**

- [ ] Schema checked via `oracle-schema-cache`
- [ ] Result type interface defined
- [ ] Bind parameters used (not string concat)

---

## 2. command — INSERT/UPDATE/DELETE (Single Write)

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

**Checklist:**

- [ ] Schema checked — column types match bind params
- [ ] Returns `rowsAffected` for verification

---

## 3. commands — Transaction (Multiple Writes)

Auto-commits on success, rollbacks on any error.

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
    await oracle.commands(commands);
};
```

**Checklist:**

- [ ] All commands in the array are related (same business operation)
- [ ] Error handling wraps the entire transaction

---

## 4. commandSp — Stored Procedure

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

**Checklist:**

- [ ] SP name includes package prefix (e.g., `PKG_USER.GET_USER_INFO`)
- [ ] Input types match Oracle types (`oracledb.NUMBER`, `oracledb.STRING`)
- [ ] Output includes cursor and error code binds

---

## 5. queryFromSqlTab — SELECT via SQLTab

```typescript
import { oracle } from "../../libs/oracle";

// SQL_NO 1 reads from src/sqltabs/<APP_ID>_1.sql (dev) or SQL_TAB_OPPN (prod)
const result = await oracle.queryFromSqlTab<IUserRow>(1, { status: "ACTIVE" });
```

---

## 6. commandFromSqlTab — INSERT/UPDATE/DELETE via SQLTab

```typescript
import { oracle } from "../../libs/oracle";

const result = await oracle.commandFromSqlTab(2, { userId: 1, status: "D" });
```

---

## 7. getSqlStmt — Dynamic SQL via SQLTab

Use when you need to modify SQL structure before execution (dynamic WHERE, ORDER BY).

```typescript
import { oracle } from "../../libs/oracle";

export const getUsersDynamic = async (status?: string) => {
    let sql = await oracle.getSqlStmt(3);

    const params: Record<string, unknown> = {};
    let whereClause = "";

    if (status) {
        whereClause = "WHERE STATUS = :status";
        params.status = status;
    }

    sql = sql.replace("/*where*/", whereClause);
    return oracle.query<IUserRow>(sql, params);
};
```

**Rules for dynamic SQL:**

- Only replace **structural placeholders** (`/*where*/`, `/*orderBy*/`)
- Data values MUST go through bind parameters
- Never concatenate user input into SQL string
