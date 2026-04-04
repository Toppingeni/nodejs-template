# Dynamic Query Template

Use for queries where the SQL structure changes at runtime (dynamic WHERE, ORDER BY).

## SQL File with Placeholders

File: `src/sqltabs/<APP_ID>_<SQL_NO>.sql`

```sql
SELECT
  FEATURE_ID,
  FEATURE_NAME,
  DESCRIPTION,
  STATUS,
  TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
FROM FEATURES
/*where*/
ORDER BY /*orderBy*/ CREATED_AT DESC
```

## TypeScript Usage

```typescript
import { oracle } from "../../libs/oracle";

export const getFeaturesDynamic = async (search?: string, status?: string, orderBy?: string) => {
    let sql = await oracle.getSqlStmt(SQL_NO);

    const params: Record<string, unknown> = {};
    const conditions: string[] = [];

    // Build dynamic WHERE
    if (search) {
        conditions.push("FEATURE_NAME LIKE '%' || :search || '%'");
        params.search = search;
    }
    if (status) {
        conditions.push("STATUS = :status");
        params.status = status;
    }

    const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    // Build dynamic ORDER BY
    const orderByClause = orderBy ? `${orderBy},` : "";

    // Replace placeholders
    sql = sql.replace("/*where*/", whereClause);
    sql = sql.replace("/*orderBy*/", orderByClause);

    return oracle.query<FeatureRow>(sql, params);
};
```

## Supported Placeholders

| Placeholder   | Purpose                 | Example Replacement                          |
| ------------- | ----------------------- | -------------------------------------------- |
| `/*where*/`   | Dynamic WHERE clause    | `WHERE STATUS = :status AND NAME LIKE :name` |
| `/*orderBy*/` | Dynamic ORDER BY prefix | `FEATURE_NAME ASC,`                          |
| `/*columns*/` | Dynamic column list     | `COL_A, COL_B`                               |

## Rules

- **Only replace structural placeholders** — never inject user data directly
- **All data values MUST go through bind parameters** (`:paramName`)
- Build conditions as array, then join with `AND`
- Include a sensible default ORDER BY after the placeholder
- Never concatenate user input into the SQL string
