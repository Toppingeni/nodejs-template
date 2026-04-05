import BaseRepository from "./baseRepository";
import type { BindParams } from "../utils/pagination";
import type { SampleRow, SampleFilters } from "../../shared/types/sample";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SampleCreate = {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
};

type SampleUpdate = {
    name?: string;
    description?: string;
    updatedBy: string;
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

class SampleRepository extends BaseRepository<SampleRow, SampleCreate, SampleUpdate> {
    get tableName(): string {
        return "SAMPLE_TABLE";
    }

    get primaryKey(): string {
        return "ID";
    }

    get selectColumns(): string {
        return "ID, NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY";
    }

    // -------------------------------------------------------------------------
    // Overrides — search filter requires LIKE, not simple equality
    // -------------------------------------------------------------------------

    /** ดึงรายการทั้งหมด พร้อม filter */
    async findAll(filters?: SampleFilters): Promise<SampleRow[]> {
        let sql = `
            SELECT ${this.selectColumns}
            FROM ${this.tableName}
            WHERE STATUS = 'A'`;

        const params: BindParams = {};

        if (filters?.search) {
            sql += ` AND (UPPER(NAME) LIKE UPPER(:search) OR UPPER(DESCRIPTION) LIKE UPPER(:search))`;
            params.search = `%${filters.search}%`;
        }

        sql += ` ORDER BY CREATED_AT DESC`;

        return this.oracle.query<SampleRow>(sql, params);
    }

    // -------------------------------------------------------------------------
    // Abstract implementations
    // -------------------------------------------------------------------------

    /** สร้างข้อมูลใหม่ */
    async create(data: SampleCreate): Promise<void> {
        const sql = `
            INSERT INTO ${this.tableName} (ID, NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY)
            VALUES (:id, :name, :description, 'A', SYSDATE, :createdBy)`;

        await this.oracle.command(sql, {
            id: data.id,
            name: data.name,
            description: data.description ?? null,
            createdBy: data.createdBy,
        });
    }

    /** แก้ไขข้อมูล */
    async update(id: string | number, data: SampleUpdate): Promise<void> {
        const setClauses: string[] = ["UPDATED_AT = SYSDATE", "UPDATED_BY = :updatedBy"];
        const params: BindParams = {
            id,
            updatedBy: data.updatedBy,
        };

        if (data.name !== undefined) {
            setClauses.push("NAME = :name");
            params.name = data.name;
        }
        if (data.description !== undefined) {
            setClauses.push("DESCRIPTION = :description");
            params.description = data.description;
        }

        const sql = `
            UPDATE ${this.tableName}
            SET ${setClauses.join(", ")}
            WHERE ${this.primaryKey} = :id AND STATUS = 'A'`;

        await this.oracle.command(sql, params);
    }
}

export const sampleRepository = new SampleRepository();
