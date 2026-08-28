---
name: "tsoa-api-layer-generator"
description: "Step-by-step guide for creating a complete TSOA API endpoint (Controller + Service + Repository + SQLTab). Use when creating new APIs or adding endpoints. Walks through schema check, SQLTab creation, and all three layers with code templates."
---

# TSOA API Layer Generator

Step-by-step guide for creating a complete API endpoint following the Controller → Service → Repository pattern. Each step has preconditions and produces artifacts that feed the next step.

## When to Use

- Creating a **new API endpoint** (GET, POST, PATCH, DELETE)
- Adding a **new method** to an existing controller
- Setting up a **new feature module** (controller + service + repository)

## Workflow Overview

```
Step 0: Confirm APP_ID + SQL_NO
    ↓
Step 1: Prepare Schema Cache (skill: oracle-schema-cache)
    ↓
Step 2: Create SQLTab Files (skill: oracle-sqltab-generator)
    ↓
Step 3: Create Repository
    ↓
Step 4: Create Service
    ↓
Step 5: Create Controller
    ↓
Step 6: Generate TSOA Routes (pnpm tsoa:gen)
    ↓
Step 7: Verify
```

---

## Step 0: Confirm APP_ID + SQL_NO

**STOP and ask the user if any of these are unknown.**

### APP_ID Resolution

1. Check config: `config.APP_ID` or env files (`.env`, `.env.<NODE_ENV>`, `.env.sample`)
2. If unknown → **ask the user immediately** (never guess)

### SQL_NO Resolution

1. Scan existing files in `server/sqltabs/` for the same APP_ID
2. Pick next unused number (starts at 1, increments by 1)
3. If uncertain → **ask the user immediately**

### Controller Glob Check

- Verify `tsoa.json` `controllerPathGlobs` matches your controller filename pattern
- Common patterns: `*controller.ts` or `*Controller.ts`

---

## Step 1: Prepare Schema Cache

Invoke skill: **`oracle-schema-cache`**

- Check `server/schema/<table>.md` for each table you'll query
- If missing: fetch via Oracle MCP and save using the [schema template](../oracle-schema-cache/templates/schema-template.md)
- **Must have**: column name, type/length, nullable, PK

---

## Step 2: Create SQLTab Files

Invoke skill: **`oracle-sqltab-generator`**

- Create `server/sqltabs/<APP_ID>_<SQL_NO>.sql` for each query (1 statement per file)
- Use bind parameters (`:param`) — never string concatenation
- For dynamic queries, use placeholders: `/*where*/`, `/*orderBy*/`
- Oracle 11g: NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`

See [SQLTab templates](../oracle-sqltab-generator/templates/) for examples.

---

## Step 3: Create Repository

File: `src/repositories/<name>Repository.ts`

Use the template: [repository template](../backend-development/templates/repository-template.md)

Key rules:

- Define row types matching Oracle UPPER_CASE column names exactly
- Use `#region Query` / `#region Command` to separate reads from writes
- SQL_NO must match the SQLTab files from Step 2
- Static queries: `oracle.queryFromSqlTab()` / `oracle.commandFromSqlTab()`
- Dynamic queries: `oracle.getSqlStmt()` + placeholder replacement + `oracle.query()`

---

## Step 4: Create Service

File: `src/services/<name>Service.ts`

Use the template: [service template](../backend-development/templates/service-template.md)

Key rules:

- Validate ALL input with Zod schemas before calling repository
- Map Oracle UPPER_CASE rows to camelCase DTOs
- Use `#region Query` / `#region Command` to separate reads from writes
- Throw meaningful typed errors

---

## Step 5: Create Controller

File: `src/controllers/<name>Controller.ts`

Use the template: [controller template](../backend-development/templates/controller-template.md)

Key rules:

- Extend `BaseController`
- Zero business logic — delegate to service
- Wrap all handlers in `asyncErrorWrapper`
- Use TSOA decorators: `@Route`, `@Tags`, `@Get/@Post/@Patch/@Delete`, `@SuccessResponse`, `@Response`
- Define request/response types above the class

---

## Step 6: Generate TSOA Routes

```bash
pnpm tsoa:gen
```

**ALWAYS run this after adding or editing a controller.** Never edit generated files:

- `server/tsoa/routes.ts` — auto-generated
- `server/tsoa/swagger.json` — auto-generated

---

## Step 7: Verify

### Checklist

- [ ] Schema cache exists in `server/schema/` for all used tables
- [ ] SQLTab files exist in `server/sqltabs/` for all queries
- [ ] Repository uses `#region Query` and `#region Command`
- [ ] Service validates input with Zod before calling repository
- [ ] Controller extends BaseController with TSOA decorators
- [ ] Ran `pnpm tsoa:gen` after controller changes
- [ ] No business logic in controller
- [ ] All SQL uses bind parameters (no string concatenation)
- [ ] No Oracle 11g incompatible SQL (`FETCH FIRST`, `OFFSET`, `JSON_TABLE`)

---

## File Structure (per feature)

```
src/
├── controllers/<name>Controller.ts    # TSOA controller
├── services/<name>Service.ts          # Business logic + Zod
├── repositories/<name>Repository.ts   # Database access
├── sqltabs/<APP_ID>_<SQL_NO>.sql      # SQL statements
└── schema/<table>.md                  # Table schema cache
```

## Related Skills

- `oracle-schema-cache` — Step 1
- `oracle-sqltab-generator` — Step 2
- `oracle-db-connector` — Oracle method patterns for Step 3
- `backend-development` — Templates for Steps 3-5
