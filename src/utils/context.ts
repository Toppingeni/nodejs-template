import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId?: string;
  userName?: string;
  requestId?: string;
  trackingStatus?: string; // ใช้สำหรับ logic พิเศษ เช่น ถ้าเป็น 'F' ไม่ต้องส่ง WebSocket
}

// สร้าง Instance ของ AsyncLocalStorage
export const context = new AsyncLocalStorage<RequestContext>();
