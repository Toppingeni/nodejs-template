---
name: "oracle-schema-cache"
description: "Fetches and caches Oracle table schemas locally in compact format. Use BEFORE writing any SQL — check server/schema/<table>.md first; if missing, fetch via Oracle MCP and save. Ensures column names, types, and constraints are verified before query creation."
---

# Oracle Schema Cache

Ensures table schemas are verified before writing any SQL. Schemas are cached locally in `server/schema/` to save tokens and avoid redundant MCP calls.

## When to Use

- **Before writing ANY SQL query** — always check schema first
- **Before creating SQLTab files** — verify column names and types
- **When onboarding a new table** — fetch and cache its schema
- **When a column mismatch error occurs** — refresh the schema cache

## Step-by-Step Instructions

### Step 1: Check if Schema Exists

Look for `server/schema/<table>.md` (lowercase filename).

```
server/schema/users.md
server/schema/sql_tab_oppn.md
```

**If file exists**: Read it and proceed with your SQL work.
**If file is missing or outdated**: Continue to Step 2.

### Step 2: Fetch Schema from Oracle MCP

Use the `mcp__oracle__getOracleTableSchema` tool:

```
Table: KPDBA.<TABLE_NAME>
```

This returns column definitions including name, data type, length, nullable, and primary key info.

### Step 3: Save in Compact Format

Create `server/schema/<table>.md` using the template: [templates/schema-template.md](templates/schema-template.md)

Format: one line per column, only essential info.

### Step 4: Verify Before Writing SQL

Before writing any SQL, cross-check:

1. **Column names** — match exactly (Oracle is case-sensitive in metadata)
2. **Data types** — ensure bind parameters match (e.g., NUMBER vs VARCHAR2)
3. **Lengths** — prevent overflow (e.g., VARCHAR2(50) means max 50 bytes)
4. **Nullable** — handle NULL cases in queries where needed

### Step 5: Keep Cache Fresh

- If you discover columns have been added/modified in DB, **refresh immediately**
- Delete the old file and re-fetch from Oracle MCP
- Never rely on stale schema data

---

## Rules

1. **NEVER write SQL without checking schema first** — this is the most common source of bugs
2. **NEVER guess column names** — always verify against cached schema
3. **One table = one file** — filename is lowercase table name
4. **Keep format compact** — minimize tokens, no extra prose in schema files
5. **Bind parameters must match types** — NUMBER columns get number binds, VARCHAR2 get string binds

## Integration

This skill is called by:

- `backend-development` (Phase 2, Step 2.1)
- `tsoa-api-layer-generator` (Step 1)
- `oracle-sqltab-generator` (before creating any query)

## Templates

- [Schema Template](templates/schema-template.md) — compact schema format
