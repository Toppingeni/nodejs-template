# CLAUDE.md (OPPN)

## Backend (Server)

### Tech Stack

- Node.js, TypeScript
- TSOA (OpenAPI + Controllers)
- Oracle 11g Database
- Sequelize ORM
- Zod Validation

### Architecture

**Controller → Service → Repository**

- Controller: Request/response handling, no business logic
- Service: Business logic layer
- Repository: Database access via SQLTab

### Key Patterns

- Extend `BaseController` with `handleSuccess()`/`handleError()`
- Use `asyncErrorWrapper()` for error handling
- Context-aware logger via AsyncLocalStorage
- Oracle DB with bind parameters, never use `FETCH FIRST`/`OFFSET`/`JSON_TABLE`
- SQLTab for query management: `queryFromSqlTab`, `commandFromSqlTab`, `getSqlStmt`

### Commands

- `pnpm dev` - Start dev server
- `pnpm lint` - Lint code
- `pnpm build` - Build (auto-runs TSOA)
- `pnpm tsoa:gen` - Regenerate TSOA routes after controller changes

### Important Rules

- NEVER edit generated TSOA files (`server/tsoa/routes.ts`, `server/tsoa/swagger.json`)
- Always use bind parameters for Oracle queries
- Check table schemas in `server/schema/*.md` before writing SQL

### Skills for Details

- `oracle-db-connector` - Oracle connections, queries, stored procedures
- `oracle-schema-cache` - Table schemas and column validation
- `oracle-sqltab-generator` - SQLTab file generation and dynamic queries
- `tsoa-api-layer-generator` - Full API layer patterns
- `logger-system` - Context-aware logging setup
