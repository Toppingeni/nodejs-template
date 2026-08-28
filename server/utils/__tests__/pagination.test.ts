import { describe, it, expect } from "vitest";
import { buildPaginatedQuery, buildPaginatedResponse } from "../pagination";

describe("buildPaginatedQuery", () => {
    const baseSql =
        "SELECT ID, NAME FROM SAMPLE_TABLE WHERE STATUS = :status ORDER BY CREATED_AT DESC";
    const baseParams = { status: "A" };

    it("should generate correct SQL for page 1", () => {
        const result = buildPaginatedQuery(baseSql, baseParams, {
            page: 1,
            pageSize: 10,
        });

        expect(result.countSql).toBe(`SELECT COUNT(*) AS TOTAL FROM (${baseSql})`);
        expect(result.dataSql).toContain("ROWNUM");
        expect(result.dataParams).toEqual({
            status: "A",
            startRow: 1,
            endRow: 10,
        });
        expect(result.countParams).toEqual({ status: "A" });
    });

    it("should calculate correct offsets for page 2", () => {
        const result = buildPaginatedQuery(baseSql, baseParams, {
            page: 2,
            pageSize: 10,
        });

        expect(result.dataParams.startRow).toBe(11);
        expect(result.dataParams.endRow).toBe(20);
    });

    it("should calculate correct offsets for page 3 with pageSize 25", () => {
        const result = buildPaginatedQuery(baseSql, baseParams, {
            page: 3,
            pageSize: 25,
        });

        expect(result.dataParams.startRow).toBe(51);
        expect(result.dataParams.endRow).toBe(75);
    });

    it("should preserve original params in countParams without pagination", () => {
        const params = { status: "A", type: "B" };
        const result = buildPaginatedQuery(baseSql, params, {
            page: 1,
            pageSize: 10,
        });

        expect(result.countParams).toEqual({ status: "A", type: "B" });
        expect(result.countParams).not.toHaveProperty("startRow");
        expect(result.countParams).not.toHaveProperty("endRow");
    });

    it("should use Oracle 11g compatible ROWNUM pattern (not FETCH FIRST/OFFSET)", () => {
        const result = buildPaginatedQuery(baseSql, baseParams, {
            page: 1,
            pageSize: 10,
        });

        expect(result.dataSql).toContain("ROWNUM");
        expect(result.dataSql).not.toContain("FETCH FIRST");
        expect(result.dataSql).not.toContain("OFFSET");
    });
});

describe("buildPaginatedResponse", () => {
    it("should build correct response for first page", () => {
        const rows = [{ id: "1" }, { id: "2" }];
        const result = buildPaginatedResponse(rows, 50, {
            page: 1,
            pageSize: 10,
        });

        expect(result).toEqual({
            data: rows,
            total: 50,
            page: 1,
            pageSize: 10,
            totalPages: 5,
        });
    });

    it("should calculate totalPages correctly with remainder", () => {
        const result = buildPaginatedResponse([], 51, {
            page: 1,
            pageSize: 10,
        });

        expect(result.totalPages).toBe(6);
    });

    it("should handle zero total", () => {
        const result = buildPaginatedResponse([], 0, {
            page: 1,
            pageSize: 10,
        });

        expect(result.totalPages).toBe(0);
        expect(result.data).toEqual([]);
    });
});
