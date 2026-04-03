/** Base row type สำหรับ Oracle table — ทุก entity ควร extend */
export interface BaseRow {
  CREATED_AT?: string;
  CREATED_BY?: string;
  UPDATED_AT?: string;
  UPDATED_BY?: string;
}

/** Status ทั่วไปสำหรับ soft delete */
export type RecordStatus = "A" | "D"; // A = Active, D = Deleted
