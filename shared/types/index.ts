// ===== User & Auth Types =====

/** ข้อมูล User จาก JWT token (decode แล้ว) */
export interface DecodedUser {
  nameid: string;
  UserName: string;
  UserType?: string;
  ORG?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Response จาก Auth API */
export interface AuthResponse {
  token: string;
  user?: DecodedUser;
}

// ===== API Types =====

/** รูปแบบ response สำเร็จจาก API */
export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
}

/** รูปแบบ error จาก API */
export interface ApiError {
  message: string;
  status: number;
  stack?: string;
  errors?: Record<string, string[]>;
}

/** Pagination request params */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** Pagination response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== Audit Fields =====

/** Audit fields ที่ทุก entity ควรมี */
export interface AuditFields {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
