# Static Query Template

Use for queries where the SQL structure is fixed — only bind parameter values change.

## SELECT

File: `src/sqltabs/<APP_ID>_<SQL_NO>.sql`

```sql
SELECT
  FEATURE_ID,
  FEATURE_NAME,
  DESCRIPTION,
  STATUS,
  TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
FROM FEATURES
WHERE STATUS = :status
ORDER BY CREATED_AT DESC
```

## SELECT by ID

```sql
SELECT
  FEATURE_ID,
  FEATURE_NAME,
  DESCRIPTION,
  STATUS
FROM FEATURES
WHERE FEATURE_ID = :id
```

## INSERT

```sql
INSERT INTO FEATURES (FEATURE_ID, FEATURE_NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY)
VALUES (:id, :name, :description, :status, SYSDATE, :createdBy)
```

## UPDATE

```sql
UPDATE FEATURES
SET
  FEATURE_NAME = :name,
  DESCRIPTION = :description,
  UPDATED_AT = SYSDATE,
  UPDATED_BY = :updatedBy
WHERE FEATURE_ID = :id
```

## DELETE (Soft)

```sql
UPDATE FEATURES
SET STATUS = 'D', UPDATED_AT = SYSDATE, UPDATED_BY = :updatedBy
WHERE FEATURE_ID = :id
```

## Rules

- One statement per file
- No trailing semicolons
- Bind parameters with `:paramName`
- Use `SYSDATE` for timestamps
- Use `TO_CHAR` for date formatting in SELECT
- Oracle 11g: NEVER use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`
