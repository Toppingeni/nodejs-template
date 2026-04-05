import type { PaginatedResponse } from "../../shared/types";

export interface PaginationOptions {
    page: number;
    pageSize: number;
}

/** Bind params — simple key-value pairs for Oracle named bind parameters */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BindParams = Record<string, any>;

/**
 * Result of buildPaginatedQuery — ready to pass to oracle.query()
 */
export interface PaginatedQueryParts {
    dataSql: string;
    countSql: string;
    dataParams: BindParams;
    countParams: BindParams;
}

/**
 * Wraps a base SELECT SQL with Oracle 11g ROWNUM-based pagination.
 * Compatible with Oracle 11g — uses nested ROWNUM, never FETCH FIRST or OFFSET.
 *
 * @param baseSql  - The inner SELECT query (no trailing semicolon, no ORDER BY restriction)
 * @param params   - Bind parameters already used in baseSql
 * @param options  - { page, pageSize } (1-indexed page)
 *
 * @example
 * const base = `SELECT ID, NAME FROM SAMPLE_TABLE WHERE STATUS = :status ORDER BY CREATED_AT DESC`;
 * const { dataSql, countSql, dataParams, countParams } = buildPaginatedQuery(base, { status: "A" }, { page: 1, pageSize: 10 });
 * const [rows, counts] = await Promise.all([
 *   oracle.query<Row>(dataSql, dataParams),
 *   oracle.query<{ TOTAL: number }>(countSql, countParams),
 * ]);
 */
export function buildPaginatedQuery(
    baseSql: string,
    params: BindParams,
    options: PaginationOptions,
): PaginatedQueryParts {
    const { page, pageSize } = options;
    const startRow = (page - 1) * pageSize + 1;
    const endRow = page * pageSize;

    // COUNT query — wraps base without pagination params
    const countSql = `SELECT COUNT(*) AS TOTAL FROM (${baseSql})`;

    // DATA query — double ROWNUM wrap required for Oracle 11g range pagination
    const dataSql = `
SELECT * FROM (
    SELECT a.*, ROWNUM AS RNUM FROM (${baseSql}) a
    WHERE ROWNUM <= :endRow
) WHERE RNUM >= :startRow`;

    return {
        dataSql,
        countSql,
        dataParams: { ...params, startRow, endRow },
        countParams: { ...params },
    };
}

/**
 * Builds a PaginatedResponse<T> from raw query results and options.
 * Use after calling oracle.query() with the parts from buildPaginatedQuery.
 *
 * @param rows    - Data rows returned from the paginated query
 * @param total   - Total row count from the count query
 * @param options - Same PaginationOptions passed to buildPaginatedQuery
 */
export function buildPaginatedResponse<T>(
    rows: T[],
    total: number,
    options: PaginationOptions,
): PaginatedResponse<T> {
    const { page, pageSize } = options;
    return {
        data: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
