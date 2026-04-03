import type { AuditFields, PaginationParams } from "./index";
import type { RecordStatus } from "./database";

// ===== Sample Entity =====

/** Sample row จาก Oracle (camelCase หลังแปลงแล้ว) */
export interface Sample extends AuditFields {
  id: string;
  name: string;
  description?: string;
  status: RecordStatus;
}

/** DTO สำหรับสร้าง Sample ใหม่ */
export interface CreateSampleDto {
  name: string;
  description?: string;
}

/** DTO สำหรับแก้ไข Sample */
export interface UpdateSampleDto {
  name?: string;
  description?: string;
}

/** Filter สำหรับค้นหา Sample */
export interface SampleFilters extends PaginationParams {
  search?: string;
  status?: RecordStatus;
}

// ===== Oracle Row Type (UPPER_SNAKE_CASE ตรงจาก DB) =====

export interface SampleRow {
  ID: string;
  NAME: string;
  DESCRIPTION?: string;
  STATUS: string;
  CREATED_AT?: string;
  CREATED_BY?: string;
  UPDATED_AT?: string;
  UPDATED_BY?: string;
}
