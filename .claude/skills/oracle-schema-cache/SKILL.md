---
name: "oracle-schema-cache"
description: "Caches compact Oracle table schemas locally to reduce token and MCP calls. Invoke when generating SQL, verifying column names/types, or onboarding a new table."
---

# Oracle Schema Cache

Stores compact table schemas in the repo to save tokens and reduce redundant Oracle MCP calls when writing queries.

## Directory

- Schema files: `src/schema/`
- 1 table = 1 file
- Filename: `<table>.md` (lowercase), e.g. `users.md`

## Format (token-efficient)

One line per column, only essential info:

```text
columns:
- COL_NAME DATA_TYPE(LEN|PREC,SCALE) [PK] [NN] [NULL]
```

Example:

```text
columns:
- USER_ID NUMBER(10) PK NN
- USERNAME VARCHAR2(50) NN
- STATUS VARCHAR2(10) NN
- CREATED_AT DATE NULL
```

Abbreviations: `PK` = primary key, `NN` = not null, `NULL` = nullable

## Mandatory Workflow (when writing SQL)

1. Always check `src/schema/<table>.md` before writing any SQL
2. If schema file missing or incomplete, fetch via Oracle MCP and save summary using the format above
3. When writing SQL:
   - Verify column/table names match schema exactly
   - Check data types/lengths (e.g. VARCHAR2(50)) to prevent overflow/type mismatch
   - Always use bind params, never concat strings
4. If columns are added/modified in DB, refresh the schema file immediately

## SQLTab Integration

When creating a SQLTab:

- Check schema first
- Then create `src/sqltabs/<APP_ID>_<SQL_NO>.sql` or insert script per skill `oracle-sqltab-generator`
