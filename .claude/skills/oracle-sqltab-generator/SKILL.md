---
name: "oracle-sqltab-generator"
description: "Generates SQLTab .sql files for dev and optional INSERT scripts for production KPDBA.SQL_TAB_OPPN. Use when creating new SQL queries, adding DB operations, or setting up SQLTab files. Covers queryFromSqlTab, commandFromSqlTab, and getSqlStmt usage."
---

# Oracle SQLTab Generator

Step-by-step guide for creating SQLTab files. This project stores SQL statements in files (dev) or in the database table `KPDBA.SQL_TAB_OPPN` (prod), accessed via helper functions.

## When to Use

- **Creating a new SQL query** for a repository
- **Adding a new DB operation** (SELECT, INSERT, UPDATE, DELETE)
- **Setting up dynamic queries** with placeholder replacement
- **Generating production INSERT scripts** for SQL_TAB_OPPN

## Workflow Overview

```
Step 1: Determine APP_ID and SQL_NO
    ↓
Step 2: Check Schema (skill: oracle-schema-cache)
    ↓
Step 3: Create Dev SQLTab File
    ↓
Step 4: (Optional) Create Production INSERT Script
    ↓
Step 5: Use in Repository Code
```

---

## Step 1: Determine APP_ID and SQL_NO

### APP_ID

Resolution order:

1. Check `config.APP_ID` and env files (`.env`, `.env.<NODE_ENV>`, `.env.sample`)
2. If unknown → **ask the user immediately** (never guess)

### SQL_NO

Resolution order:

1. Scan existing files in `server/sqltabs/` for the same APP_ID, pick next unused number
2. If DB is available, query MAX:
    ```sql
    SELECT NVL(MAX(SQL_NO), 0) AS MAX_SQL_NO
    FROM KPDBA.SQL_TAB_OPPN
    WHERE APP_ID = :appId
    ```
3. SQL_NO starts at `1` and increments by `1` per APP_ID
4. If uncertain → **ask the user immediately**

---

## Step 2: Check Schema

Invoke skill: **`oracle-schema-cache`**

- Verify all table/column names against `server/schema/<table>.md`
- If schema file is missing, fetch and save first
- **Never write SQL without checking schema**

---

## Step 3: Create Dev SQLTab File

File: `server/sqltabs/<APP_ID>_<SQL_NO>.sql`

Use the appropriate template from [templates/](templates/):

- [Static Query Template](templates/static-query.md) — simple SELECT/INSERT/UPDATE/DELETE
- [Dynamic Query Template](templates/dynamic-query.md) — queries with `/*where*/` placeholders

### Rules

- **One statement per file** — no multi-statement files
- **Bind parameters only** (`:paramName`) — never concatenate strings
- **No trailing semicolons** — auto-stripped by the runtime
- **Oracle 11g compatible** — NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`

---

## Step 4: (Optional) Create Production INSERT Script

Only if user needs to deploy to prod/staging DB.

File: `server/sqltabs/<APP_ID>_<SQL_NO>__insert.sql`

Use template: [Production INSERT Template](templates/insert-script.md)

---

## Step 5: Use in Repository Code

### Static Query (no SQL manipulation needed)

```typescript
// SELECT
const rows = await oracle.queryFromSqlTab<RowType>(SQL_NO, { param: value });

// INSERT/UPDATE/DELETE
const result = await oracle.commandFromSqlTab(SQL_NO, { param: value });
```

### Dynamic Query (with placeholder replacement)

```typescript
let sql = await oracle.getSqlStmt(SQL_NO);

const params: Record<string, unknown> = {};
const conditions: string[] = [];

if (status) {
    conditions.push("STATUS = :status");
    params.status = status;
}

const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
sql = sql.replace("/*where*/", whereClause);

const rows = await oracle.query<RowType>(sql, params);
```

---

## SQL_TAB_OPPN Table Structure (Reference)

```sql
CREATE TABLE KPDBA.SQL_TAB_OPPN (
  APP_ID         NUMBER(5)         NOT NULL,
  SQL_NO         NUMBER(5)         NOT NULL,
  SQL_TYPE       NUMBER(5)         NOT NULL,  -- 1=SELECT, 2=UPDATE, 3=INSERT, 4=DELETE
  SQL_DESC       VARCHAR2(1000 BYTE),
  SQL_STMT       CLOB,
  DB_CONNECTION  VARCHAR2(50 BYTE) DEFAULT 'OPP',
  REVISION       NUMBER            DEFAULT 0 NOT NULL
)
```

## Templates

- [Static Query](templates/static-query.md) — SELECT/INSERT/UPDATE/DELETE with bind params
- [Dynamic Query](templates/dynamic-query.md) — queries with `/*where*/` placeholders
- [Production INSERT Script](templates/insert-script.md) — INSERT for SQL_TAB_OPPN

## Integration

This skill is called by:

- `backend-development` (Phase 2, Step 2.2)
- `tsoa-api-layer-generator` (Step 2)
