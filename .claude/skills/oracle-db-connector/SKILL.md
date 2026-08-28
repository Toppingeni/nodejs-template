---
name: "oracle-db-connector"
description: "Guidelines for Oracle DB connections, queries, stored procedures, and transactions in this project. Use when writing repository code, executing SQL, calling stored procedures, or handling Oracle transactions. Covers query(), command(), commandSp(), and commands() patterns."
---

# Oracle DB Connector

Step-by-step guide for all Oracle database operations in this project. The project uses a connection pool — never create connections manually.

## When to Use

- **Writing repository code** that queries or modifies Oracle data
- **Calling stored procedures** via `commandSp`
- **Running multiple commands in a transaction** via `commands`
- **Debugging Oracle connection or query issues**

## Core Rules (Read First)

1. **NEVER create connections manually** — use the pool in `src/libs/oracle/oracledb.ts`
2. **NEVER concatenate SQL strings** — always use bind parameters (`:paramName`)
3. **ALWAYS import the singleton** — `import { oracle } from "../../libs/oracle"`
4. **ALWAYS specify types** — use `.query<T>()` with a defined interface
5. **Oracle 11g restrictions**: NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`

## Step-by-Step: Choose the Right Method

### Decision Tree

| Operation                     | Method                                        | When to Use                            |
| ----------------------------- | --------------------------------------------- | -------------------------------------- |
| SELECT (read)                 | `oracle.query<T>(sql, params)`                | Reading data, reports                  |
| INSERT/UPDATE/DELETE (single) | `oracle.command(sql, params)`                 | Single write operation                 |
| Multiple writes (transaction) | `oracle.commands([...])`                      | Multi-table inserts, atomic operations |
| Stored procedure              | `oracle.commandSp({...})`                     | Calling PL/SQL packages                |
| SQLTab query                  | `oracle.queryFromSqlTab<T>(sqlNo, params)`    | Reading via SQLTab                     |
| SQLTab command                | `oracle.commandFromSqlTab(sqlNo, params)`     | Writing via SQLTab                     |
| Dynamic SQL                   | `oracle.getSqlStmt(sqlNo)` + `oracle.query()` | SQL with dynamic WHERE/ORDER           |

### After Choosing a Method

1. Check schema via skill `oracle-schema-cache` — verify column names and types
2. Write the SQL or identify the SQLTab SQL_NO
3. Define the result type interface (for queries)
4. Use the appropriate method from the reference: [references/oracle-methods.md](references/oracle-methods.md)

---

## References

- [Oracle Methods](references/oracle-methods.md) — All oracle methods with full code examples

## Related Files

- `src/libs/oracle/config.ts` — reads connection string from `tnsnames.ora`
- `src/libs/oracle/oracledb.ts` — manages Oracle Connection Pool
- `src/libs/oracle/index.ts` — `Oracle` utility class with all methods
- `src/types/oracleType.ts` — Oracle DB types

## Integration

This skill is referenced by:

- `backend-development` (Phase 3 — agent: backend-builder uses these patterns)
- `tsoa-api-layer-generator` (Step 3 — Repository layer)
- `oracle-sqltab-generator` (TypeScript usage section)
