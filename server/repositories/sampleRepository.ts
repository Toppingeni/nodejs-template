import { getOracle } from "../libs/oracle";
import type { SampleRow, SampleFilters } from "../../shared/types/sample";

class SampleRepository {
  private get oracle() {
    return getOracle();
  }

  /** ดึงรายการทั้งหมด พร้อม filter */
  async findAll(filters?: SampleFilters): Promise<SampleRow[]> {
    let sql = `
      SELECT ID, NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY
      FROM {SCHEMA}.SAMPLE_TABLE
      WHERE STATUS = 'A'
    `;
    const params: Record<string, unknown> = {};

    if (filters?.search) {
      sql += ` AND (UPPER(NAME) LIKE UPPER(:search) OR UPPER(DESCRIPTION) LIKE UPPER(:search))`;
      params.search = `%${filters.search}%`;
    }

    sql += ` ORDER BY CREATED_AT DESC`;

    return this.oracle.query<SampleRow>(sql, params);
  }

  /** ดึงข้อมูลตาม ID */
  async findById(id: string): Promise<SampleRow | null> {
    const sql = `
      SELECT ID, NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY, UPDATED_AT, UPDATED_BY
      FROM {SCHEMA}.SAMPLE_TABLE
      WHERE ID = :id AND STATUS = 'A'
    `;
    const rows = await this.oracle.query<SampleRow>(sql, { id });
    return rows[0] || null;
  }

  /** สร้างข้อมูลใหม่ */
  async create(data: {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
  }) {
    const sql = `
      INSERT INTO {SCHEMA}.SAMPLE_TABLE (ID, NAME, DESCRIPTION, STATUS, CREATED_AT, CREATED_BY)
      VALUES (:id, :name, :description, 'A', SYSDATE, :createdBy)
    `;
    return this.oracle.command(sql, {
      id: data.id,
      name: data.name,
      description: data.description || null,
      createdBy: data.createdBy,
    });
  }

  /** แก้ไขข้อมูล */
  async update(
    id: string,
    data: { name?: string; description?: string; updatedBy: string },
  ) {
    const setClauses: string[] = [
      "UPDATED_AT = SYSDATE",
      "UPDATED_BY = :updatedBy",
    ];
    const params: Record<string, unknown> = { id, updatedBy: data.updatedBy };

    if (data.name !== undefined) {
      setClauses.push("NAME = :name");
      params.name = data.name;
    }
    if (data.description !== undefined) {
      setClauses.push("DESCRIPTION = :description");
      params.description = data.description;
    }

    const sql = `
      UPDATE {SCHEMA}.SAMPLE_TABLE
      SET ${setClauses.join(", ")}
      WHERE ID = :id AND STATUS = 'A'
    `;
    return this.oracle.command(sql, params);
  }

  /** Soft delete */
  async softDelete(id: string, updatedBy: string) {
    const sql = `
      UPDATE {SCHEMA}.SAMPLE_TABLE
      SET STATUS = 'D', UPDATED_AT = SYSDATE, UPDATED_BY = :updatedBy
      WHERE ID = :id
    `;
    return this.oracle.command(sql, { id, updatedBy });
  }
}

export const sampleRepository = new SampleRepository();
