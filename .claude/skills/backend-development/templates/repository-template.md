# Repository Template

Database access layer using SQLTab.

```typescript
import { getOracle } from "../libs/oracle";

// Row types (match Oracle column names exactly)
export type FeatureRow = {
    FEATURE_ID: number;
    FEATURE_NAME: string;
    DESCRIPTION: string | null;
    STATUS: string;
    CREATED_AT: string;
};

class FeatureRepository {
    // #region Query

    /**
     * SQL_NO 1: SELECT features with optional search/status filter
     * SQLTab file: src/sqltabs/<APP_ID>_1.sql
     */
    async getFeatures(search?: string, status?: string) {
        const oracle = getOracle();

        // Static query (no dynamic WHERE)
        if (!search && !status) {
            return oracle.queryFromSqlTab<FeatureRow>(1, {});
        }

        // Dynamic query (with placeholder replacement)
        let sql = await oracle.getSqlStmt(1);
        const params: Record<string, unknown> = {};
        const conditions: string[] = [];

        if (search) {
            conditions.push("FEATURE_NAME LIKE '%' || :search || '%'");
            params.search = search;
        }
        if (status) {
            conditions.push("STATUS = :status");
            params.status = status;
        }

        const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
        sql = sql.replace("/*where*/", whereClause);

        return oracle.query<FeatureRow>(sql, params);
    }

    /**
     * SQL_NO 2: SELECT feature by ID
     * SQLTab file: src/sqltabs/<APP_ID>_2.sql
     */
    async getById(id: number) {
        const oracle = getOracle();
        const rows = await oracle.queryFromSqlTab<FeatureRow>(2, { id });
        return rows[0] ?? null;
    }

    // #endregion

    // #region Command

    /**
     * SQL_NO 3: INSERT new feature
     * SQLTab file: src/sqltabs/<APP_ID>_3.sql
     */
    async create(name: string, description?: string) {
        const oracle = getOracle();
        return oracle.commandFromSqlTab(3, { name, description: description ?? null });
    }

    // #endregion
}

export default new FeatureRepository();
```

## Rules

- **SQL_NO** must match `src/sqltabs/<APP_ID>_<SQL_NO>.sql` files
- **`#region Query` / `#region Command`** — always separate reads from writes
- **Row types** — define types matching Oracle UPPER_CASE column names exactly
- **Bind parameters** — NEVER concatenate SQL strings; only replace structural placeholders (`/*where*/`)
- **Dynamic queries** — use `getSqlStmt()` + placeholder replacement + `oracle.query()`
- **Static queries** — use `queryFromSqlTab()` / `commandFromSqlTab()` directly
- **Schema check** — verify column names against `src/schema/<table>.md` before writing SQL
