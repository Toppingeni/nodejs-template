---
name: "backend-development"
description: "Orchestrates backend API development for OPPN (Node.js + TSOA + Oracle 11g). Use when building new endpoints, services, repositories, or database operations. Guides through schema check → implementation → review workflow using specialized agents and skills."
---

# Backend Development (OPPN)

A systematic workflow for building backend APIs. Orchestrates the full cycle: schema preparation → API implementation → code review, delegating to specialized agents and referencing related skills.

## Workflow Overview

```
Phase 1: Understand Requirements
    ↓
Phase 2: Schema & Query Preparation (skills: oracle-schema-cache, oracle-sqltab-generator)
    ↓
Phase 3: Implementation (agent: backend-builder)
    ↓
Phase 4: Code Review (agent: code-reviewer)
```

---

## Phase 1: Understand Requirements

### Objectives

- Clarify what API/endpoint the user wants to build
- Identify which Oracle tables are involved
- Determine APP_ID and SQL_NO for SQLTab files

### Questions to Ask (if unclear)

1. **What**: What endpoint/feature are you building? (CRUD, report, workflow?)
2. **Tables**: Which Oracle tables are involved?
3. **APP_ID**: What is the APP_ID for this system? (check `.env` or `config.APP_ID` first)
4. **SQL_NO**: Check existing files in `src/sqltabs/` to determine next available number

### Decision Point: Route to Correct Workflow

| Scenario                     | Workflow                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| **New endpoint (full CRUD)** | Phase 2 → 3 → 4 (full workflow)                                  |
| **New endpoint (simple)**    | Phase 2 → 3 → 4 (full workflow, but faster)                      |
| **Bug fix or small change**  | Skip to Phase 3 → 4                                              |
| **Full-stack feature**       | Run Phase 2-3 here, then run `frontend-development` skill for UI |
| **Schema/table design only** | Phase 2 only                                                     |

---

## Phase 2: Schema & Query Preparation

Before writing any code, prepare the database layer.

### Step 2.1: Check/Create Schema Cache

Invoke skill: **`oracle-schema-cache`**

- Check `src/schema/<table>.md` for each table involved
- If missing: fetch via Oracle MCP (`mcp__oracle__getOracleTableSchema`) and save in compact format
- Verify column names, types, and constraints before writing SQL

### Step 2.2: Create SQLTab Files

Invoke skill: **`oracle-sqltab-generator`**

- Determine APP_ID (from `.env` or ask user)
- Determine next SQL_NO (scan `src/sqltabs/` for existing files)
- Create `src/sqltabs/<APP_ID>_<SQL_NO>.sql` for each query needed
- Use bind parameters (`:param`) — never concatenate strings
- Oracle 11g restrictions: NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`

### Output of Phase 2

- Schema files in `src/schema/` for all tables used
- SQLTab `.sql` files in `src/sqltabs/` for all queries needed
- Clear mapping: which SQL_NO does what

**Present to user and get approval before proceeding.**

---

## Phase 3: Implementation

### Agent: `backend-builder`

Launch the **backend-builder** agent with a prompt that includes:

1. The requirements and approved schema/SQLTab from Phase 2
2. Architecture: **Controller → Service → Repository** (see [references/architecture.md](references/architecture.md))
3. Templates to follow:
    - Controller: [templates/controller-template.md](templates/controller-template.md)
    - Service: [templates/service-template.md](templates/service-template.md)
    - Repository: [templates/repository-template.md](templates/repository-template.md)
4. Key rules:
    - Controller: extends `BaseController`, uses `handleSuccess()`/`handleError()`, wrapped in `asyncErrorWrapper()`
    - Service: business logic + Zod validation, `#region Query` / `#region Command`
    - Repository: uses `queryFromSqlTab`/`commandFromSqlTab`, `#region Query` / `#region Command`
    - TSOA decorators on controller (`@Route`, `@Get`, `@Post`, `@Tags`, `@Security`)
    - After controller changes: run `npm run tsoa:gen`
    - NEVER edit generated files (`src/tsoa/routes.ts`, `src/tsoa/swagger.json`)
5. Related skills for Oracle patterns:
    - `oracle-db-connector` — Oracle connection, query, stored procedure patterns
    - `oracle-sqltab-generator` — SQLTab usage with `queryFromSqlTab`/`commandFromSqlTab`

### What the Agent Produces

- Controller with TSOA decorators
- Service with Zod validation + business logic
- Repository with SQLTab integration
- Updated TSOA routes (via `npm run tsoa:gen`)

---

## Phase 4: Code Review

### Agent: `code-reviewer`

**ALWAYS run this after Phase 3 completes.** Do not wait for the user to ask.

Launch the **code-reviewer** agent to check:

- Architecture compliance: no business logic in controller, no DB access outside repository
- Oracle 11g compatibility: no `FETCH FIRST`, `OFFSET`, `JSON_TABLE`
- Bind parameters used everywhere (no SQL string concatenation)
- Zod validation in service layer
- Error handling with `asyncErrorWrapper`
- TSOA routes regenerated after controller changes
- SQLTab files match repository usage

### If Issues Found

- P0/P1 issues: Fix immediately, then re-run code-reviewer
- P2-P4 issues: Present to user for decision

---

## Commands

- `npm run dev` — Start dev server
- `npm run lint` — Lint code
- `npm run build` — Build (auto-runs TSOA)
- `npm run tsoa:gen` — Regenerate TSOA routes after controller changes

## References

- [Architecture](references/architecture.md) — Controller → Service → Repository pattern details, file structure

## Templates

- [Controller Template](templates/controller-template.md) — TSOA controller with BaseController
- [Service Template](templates/service-template.md) — Business logic + Zod validation
- [Repository Template](templates/repository-template.md) — SQLTab integration with Query/Command regions

## Related Skills

- `oracle-db-connector` — Oracle connections, queries, stored procedures
- `oracle-schema-cache` — Table schemas and column validation
- `oracle-sqltab-generator` — SQLTab file generation and dynamic queries
- `tsoa-api-layer-generator` — Full step-by-step endpoint creation guide
- `logger-system` — Context-aware logging setup
