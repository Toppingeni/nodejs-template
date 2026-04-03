---
name: "oracle-sqltab-generator"
description: "Generates sqltab .sql files and optional INSERT scripts for KPDBA.SQL_TAB_OPPN, and explains queryFromSqlTab/commandFromSqlTab/getSqlStmt. Invoke when generating queries or adding DB operations."
---

# Oracle SQL_TAB_OPPN Generator & Usage

This project stores raw SQL statements in the database (`KPDBA.SQL_TAB_OPPN`) instead of hardcoding them in source code. Statements are accessed via helper functions in `src/libs/oracle/index.ts`.

---

## 1. SQL_TAB_OPPN Table Structure

When creating a new query, create a `.sql` file in `src/sqltabs/`:

```sql
CREATE TABLE KPDBA.SQL_TAB_OPPN
(
  APP_ID         NUMBER(5)                      NOT NULL,
  SQL_NO         NUMBER(5)                      NOT NULL,
  SQL_TYPE       NUMBER(5)                      NOT NULL,
  SQL_DESC       VARCHAR2(1000 BYTE),
  SQL_STMT       CLOB,
  DB_CONNECTION  VARCHAR2(50 BYTE)              DEFAULT 'OPP',
  REVISION       NUMBER                         DEFAULT 0                     NOT NULL
)
```

**Key columns:**

- `APP_ID`: application number (from `.env`)
- `SQL_NO`: SQL sequence number (AI must determine or ask user)
- `SQL_TYPE`: `1` = SELECT, `2` = UPDATE, `3` = INSERT, `4` = DELETE
- `SQL_STMT`: actual SQL statement with bind parameters (`:param`)

### 1.1 Development: store SQL as files (fast, no DB update needed)

Filename: `<APP_ID>_<SQL_NO>.sql` e.g. `99_1.sql`

File contains only the SQL statement (supports bind `:param`). One statement per file.

```sql
SELECT *
FROM USERS
WHERE STATUS = :status
```

Usage rules:

- Node.js calls `getSqlStmt(sqlNo)` as usual; in dev it reads from file if available
- Path can be overridden via env `SQLTAB_DIR`
- Trailing `;` is auto-stripped

### 1.2 Production/Staging: create INSERT script for `SQL_TAB_OPPN`

```sql
INSERT INTO KPDBA.SQL_TAB_OPPN (APP_ID, SQL_NO, SQL_TYPE, SQL_DESC, SQL_STMT, DB_CONNECTION, REVISION)
VALUES (
  99,
  1,
  1, -- 1 = SELECT
  'Get active users by role',
  'SELECT * FROM USERS WHERE STATUS = ''ACTIVE'' AND ROLE_ID = :roleId',
  'OPP',
  0
);
COMMIT;
```

---

## 2. Source Code Usage (TypeScript)

### 2.1 Direct usage (no string manipulation)

When the query has all conditions built-in and only needs bind parameters:

```typescript
import { oracle } from "../../libs/oracle";

// SELECT
export const getUsersByRole = async (roleId: number) => {
  const result = await oracle.queryFromSqlTab<any>(1, { roleId });
  return result;
};

// UPDATE/INSERT/DELETE
export const deleteUser = async (userId: number) => {
  const result = await oracle.commandFromSqlTab(2, { userId });
  return result.rowsAffected;
};
```

### 2.2 Dynamic Query (modify SQL structure before execution)

When you need to modify the query structure (e.g. dynamic `WHERE` or `ORDER BY`), use `getSqlStmt` to get the SQL string, replace placeholders, then pass to `.query()` or `.command()`.

SQL template example:

```sql
SELECT * FROM USERS /*where*/ ORDER BY CREATED_AT DESC
```

Code example:

```typescript
import { oracle } from "../../libs/oracle";

export const getUsersDynamic = async (status?: string) => {
  let sql = await oracle.getSqlStmt(3);

  const params: any = {};
  let whereClause = "";

  if (status) {
    whereClause = "WHERE STATUS = :status";
    params.status = status;
  }

  sql = sql.replace("/*where*/", whereClause);
  const result = await oracle.query<any>(sql, params);
  return result;
};
```

---

## Mandatory AI Rules When Creating Queries

1. Always check `src/schema/<table>.md` first. If missing, fetch via Oracle MCP and save (Skill `oracle-schema-cache`)
2. Determine `APP_ID` and `SQL_NO` before creating sqltab files (never guess)
   - **APP_ID** resolution order:
     - Check config (`config.APP_ID`) and env files (`.env`, `.env.<NODE_ENV>`, `.env.sample`)
     - If unknown, ask the user immediately
   - **SQL_NO** resolution order:
     - Check existing files in `src/sqltabs/` for the same `APP_ID`, pick next unused number
     - If DB is available, query `MAX(SQL_NO)` from `KPDBA.SQL_TAB_OPPN` for the `APP_ID` and use max + 1
       ```sql
       SELECT NVL(MAX(sql_no), 0) AS MAX_SQL_NO
       FROM KPDBA.SQL_TAB_OPPN
       WHERE app_id = :appId
       ```
     - `SQL_NO` starts at `1` and increments by `1` (per `APP_ID`)
     - If uncertain, ask the user immediately
   - Questions to ask when info is insufficient:
     - "What is the APP_ID for this system?"
     - "What SQL_NO should be used for this task?"
3. Create dev SQL file at `src/sqltabs/<APP_ID>_<SQL_NO>.sql` with SQL statement only (no INSERT/COMMIT)
4. If user needs prod/staging DB update, create an additional INSERT script file (e.g. `src/sqltabs/<APP_ID>_<SQL_NO>__insert.sql`) with `INSERT INTO KPDBA.SQL_TAB_OPPN ...; COMMIT;`
5. In Repository/Service code, use `oracle.queryFromSqlTab`, `oracle.commandFromSqlTab`, or `oracle.getSqlStmt` correctly
6. Never concatenate SQL strings directly — only replace structural placeholders (e.g. `/*where*/`); data must always go through bind parameters
7. For dynamic queries, use placeholders in SQL (e.g. `/*where*/`, `/*orderBy*/`) and let TypeScript code handle the replacement
