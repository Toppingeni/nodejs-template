import { getOracle } from "../libs/oracle";
import { context } from "../utils/context";
import {
    buildPaginatedQuery,
    buildPaginatedResponse,
    type BindParams,
    type PaginationOptions,
} from "../utils/pagination";
import type { PaginatedResponse } from "../../shared/types";

/**
 * Abstract base repository for Oracle 11g tables.
 * Provides findAll, findById, findAllPaginated, create, update, and softDelete.
 *
 * Concrete repositories must implement:
 *   - tableName   : Oracle table name (e.g. "SAMPLE_TABLE")
 *   - primaryKey  : Primary key column name (e.g. "ID")
 *   - selectColumns : Comma-separated column list for SELECT statements
 *
 * Convention:
 *   - Active rows have STATUS = 'A'
 *   - Soft-deleted rows have STATUS = 'D'
 *   - Audit columns: CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY
 */
abstract class BaseRepository<TRow, TCreate, TUpdate> {
    protected get oracle() {
        return getOracle();
    }

    /** Oracle table name, e.g. "SAMPLE_TABLE" */
    abstract get tableName(): string;

    /** Primary key column name, e.g. "ID" */
    abstract get primaryKey(): string;

    /**
     * Comma-separated columns for SELECT, e.g.
     * "ID, NAME, STATUS, CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY"
     */
    abstract get selectColumns(): string;

    // -------------------------------------------------------------------------
    // Context helpers
    // -------------------------------------------------------------------------

    /** Returns userId from AsyncLocalStorage request context, or "SYSTEM". */
    protected getCurrentUser(): string {
        return context.getStore()?.userId ?? "SYSTEM";
    }

    // -------------------------------------------------------------------------
    // WHERE clause builder
    // -------------------------------------------------------------------------

    /**
     * Builds a parameterised WHERE clause from a plain filter object.
     * Only non-null, non-undefined values are included.
     * All conditions are joined with AND.
     *
     * Returns an empty string (no WHERE keyword) when filters is empty.
     *
     * @example
     * const { where, params } = this.buildWhereClause({ STATUS: "A", ORG: "IT" });
     * // where  → "STATUS = :STATUS AND ORG = :ORG"
     * // params → { STATUS: "A", ORG: "IT" }
     */
    protected buildWhereClause(filters: Record<string, unknown>): {
        where: string;
        params: BindParams;
    } {
        const params: BindParams = {};
        const conditions: string[] = [];

        for (const [col, val] of Object.entries(filters)) {
            if (val === undefined || val === null) continue;
            conditions.push(`${col} = :${col}`);
            params[col] = val;
        }

        return {
            where: conditions.length > 0 ? conditions.join(" AND ") : "",
            params,
        };
    }

    // -------------------------------------------------------------------------
    // Read operations
    // -------------------------------------------------------------------------

    /**
     * Returns all active rows, optionally narrowed by column-value filters.
     * Always appends STATUS = 'A' unless overridden via filters.
     */
    async findAll(filters?: Record<string, unknown>): Promise<TRow[]> {
        const allFilters: Record<string, unknown> = { STATUS: "A", ...filters };
        const { where, params } = this.buildWhereClause(allFilters);

        const sql = `
            SELECT ${this.selectColumns}
            FROM ${this.tableName}
            ${where ? `WHERE ${where}` : ""}
            ORDER BY CREATED_AT DESC`;

        return this.oracle.query<TRow>(sql, params);
    }

    /**
     * Returns a single active row by primary key, or null if not found.
     */
    async findById(id: string | number): Promise<TRow | null> {
        const sql = `
            SELECT ${this.selectColumns}
            FROM ${this.tableName}
            WHERE ${this.primaryKey} = :id
              AND STATUS = 'A'`;

        const rows = await this.oracle.query<TRow>(sql, { id });
        return rows[0] ?? null;
    }

    /**
     * Returns a paginated result of active rows.
     * Uses Oracle 11g double-ROWNUM pattern — no FETCH FIRST, no OFFSET.
     */
    async findAllPaginated(
        filters: Record<string, unknown>,
        pagination: PaginationOptions,
    ): Promise<PaginatedResponse<TRow>> {
        const allFilters: Record<string, unknown> = { STATUS: "A", ...filters };
        const { where, params } = this.buildWhereClause(allFilters);

        const baseSql = `
            SELECT ${this.selectColumns}
            FROM ${this.tableName}
            ${where ? `WHERE ${where}` : ""}
            ORDER BY CREATED_AT DESC`;

        const { dataSql, countSql, dataParams, countParams } = buildPaginatedQuery(
            baseSql,
            params,
            pagination,
        );

        const [rows, countRows] = await Promise.all([
            this.oracle.query<TRow>(dataSql, dataParams),
            this.oracle.query<{ TOTAL: number }>(countSql, countParams),
        ]);

        const total = countRows[0]?.TOTAL ?? 0;
        return buildPaginatedResponse<TRow>(rows, total, pagination);
    }

    // -------------------------------------------------------------------------
    // Write operations
    // -------------------------------------------------------------------------

    /**
     * Inserts a new row.
     * Concrete repositories must implement this to supply their specific columns.
     */
    abstract create(data: TCreate): Promise<void>;

    /**
     * Updates an existing active row by primary key.
     * Concrete repositories must implement this for their specific SET clauses.
     */
    abstract update(id: string | number, data: TUpdate): Promise<void>;

    /**
     * Soft-deletes a row by setting STATUS = 'D'.
     * Records UPDATED_AT = SYSDATE and UPDATED_BY from request context.
     */
    async softDelete(id: string | number, updatedBy?: string): Promise<void> {
        const actor = updatedBy ?? this.getCurrentUser();
        const sql = `
            UPDATE ${this.tableName}
            SET STATUS = 'D',
                UPDATED_AT = SYSDATE,
                UPDATED_BY = :updatedBy
            WHERE ${this.primaryKey} = :id`;

        await this.oracle.command(sql, { id, updatedBy: actor });
    }
}

export default BaseRepository;
