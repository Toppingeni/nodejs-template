# Architecture Reference

## Layered Architecture

```
Controller → Service → Repository
```

| Layer          | Responsibility                 | Rules                                                              |
| -------------- | ------------------------------ | ------------------------------------------------------------------ |
| **Controller** | HTTP request/response handling | No business logic. Extends `BaseController`. Uses TSOA decorators. |
| **Service**    | Business logic + validation    | Zod validation. Orchestrates repositories. Throws typed errors.    |
| **Repository** | Database access                | SQLTab only. Bind parameters. `#region Query` / `#region Command`. |

## File Structure

```
src/
├── bootstrap/           # App initialization
├── controllers/         # TSOA controllers
├── services/            # Business logic
├── repositories/        # Database access
├── models/              # Sequelize models
├── utils/               # Context, logger, helpers
├── sqltabs/             # SQLTab .sql files
├── tsoa/                # Generated (NEVER edit)
└── schema/              # Table documentation (schema cache)
```

## File Naming

- Controller: `src/controllers/<name>Controller.ts`
- Service: `src/services/<name>Service.ts`
- Repository: `src/repositories/<name>Repository.ts`
- SQLTab: `server/sqltabs/<APP_ID>_<SQL_NO>.sql`
- Schema: `server/schema/<table>.md`

## Key Rules

1. **NEVER edit** `server/tsoa/routes.ts` or `server/tsoa/swagger.json` — these are generated
2. **ALWAYS run** `pnpm tsoa:gen` after controller changes
3. **ALWAYS use** bind parameters for Oracle queries
4. **ALWAYS check** `server/schema/<table>.md` before writing SQL
5. **Oracle 11g**: NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`

## Context & Logger

### Context (`src/utils/context.ts`)

- JWT context management via AsyncLocalStorage
- Use for request-scoped data (user ID, tenant, etc.)

### Logger (`src/utils/logger.ts`)

- Context-aware logging (automatically includes JWT context)
- See skill: `logger-system` for full setup

## Error Handling Pattern

All async operations wrapped with `asyncErrorWrapper`:

```typescript
return asyncErrorWrapper(async () => {
    const result = await this.myService.doSomething(body);
    return this.handleSuccess(result);
}, this.handleError);
```
