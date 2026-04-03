# CLAUDE.md (OPPN)

- Run: dev `npm run dev`; lint `npm run lint`; build `npm run build` (tsoa auto)
- TSOA: never edit `src/tsoa/routes.ts`, `src/tsoa/swagger.json`; after editing controller run `npm run tsoa:gen`
- Architecture: C->S->Repo; no biz logic in C; DB via Repo; bootstrap `src/bootstrap/`
- Coding: extend `BaseController`+`handleSuccess()`/`handleError()`; async `asyncErrorWrapper()`; context `src/utils/context.ts`; logger `src/utils/logger.ts`; Zod
- Oracle 11g: never use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`
- Schema: before writing SQL check `src/schema/<table>.md` / Skill `oracle-schema-cache`
- Oracle: bind params only; use pool; see Skill `oracle-db-connector`
- SQLTab: `queryFromSqlTab`/`commandFromSqlTab`; Dynamic `getSqlStmt`+replace placeholder (e.g. `/*where*/`)+bind; Skill `oracle-sqltab-generator`
- Dev `getSqlStmt`: reads `src/sqltabs/<APP_ID>_<SQL_NO>.sql` first; override `SQLTAB_DIR`
- Sequelize: watch for N+1; use `limit`/`include` only as needed
