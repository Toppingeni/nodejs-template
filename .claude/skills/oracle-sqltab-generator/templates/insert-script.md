# Production INSERT Script Template

Use when deploying SQLTab entries to production/staging `KPDBA.SQL_TAB_OPPN` table.

## Template

File: `server/sqltabs/<APP_ID>_<SQL_NO>__insert.sql`

```sql
INSERT INTO KPDBA.SQL_TAB_OPPN (APP_ID, SQL_NO, SQL_TYPE, SQL_DESC, SQL_STMT, DB_CONNECTION, REVISION)
VALUES (
  <APP_ID>,
  <SQL_NO>,
  <SQL_TYPE>,  -- 1=SELECT, 2=UPDATE, 3=INSERT, 4=DELETE
  '<Description of what this query does>',
  '<SQL statement with bind params - escape single quotes by doubling>',
  'OPP',
  0
);
COMMIT;
```

## SQL_TYPE Reference

| SQL_TYPE | Operation |
| -------- | --------- |
| 1        | SELECT    |
| 2        | UPDATE    |
| 3        | INSERT    |
| 4        | DELETE    |

## Example

```sql
INSERT INTO KPDBA.SQL_TAB_OPPN (APP_ID, SQL_NO, SQL_TYPE, SQL_DESC, SQL_STMT, DB_CONNECTION, REVISION)
VALUES (
  99,
  1,
  1,
  'Get active users by role',
  'SELECT USER_ID, USERNAME, EMAIL FROM USERS WHERE STATUS = ''ACTIVE'' AND ROLE_ID = :roleId',
  'OPP',
  0
);
COMMIT;
```

## Rules

- **Escape single quotes** by doubling: `'ACTIVE'` becomes `''ACTIVE''`
- **Always include COMMIT** at the end
- **SQL_DESC** should clearly describe what the query does
- **DB_CONNECTION** is usually `'OPP'` (default)
- **REVISION** starts at `0`
- Filename convention: `<APP_ID>_<SQL_NO>__insert.sql` (double underscore before "insert")
