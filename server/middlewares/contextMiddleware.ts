import { Request, Response, NextFunction } from 'express';
import { context } from '../utils/context';

export const contextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let userId = 'anonymous';
  let userName = 'Anonymous';
  let trackingStatus: string | undefined;

  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Decode JWT แบบง่าย (ไม่ได้ Verify Signature ที่นี่เพื่อความเร็ว หรือถ้ามี Middleware Auth แยกก็ใช้ค่าจากตรงนั้นได้)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        // Map field ตาม Structure ของ JWT ที่ใช้
        userId = payload.nameid || payload.userId || payload.sub || 'unknown_user';
        userName = payload.UserName || payload.username || 'Unknown User';
        trackingStatus = payload.TrackingStatus;
      }
    }
  } catch (e) {
    // กรณี Decode ไม่ผ่าน ให้ใช้ค่า Default
  }

  const store = {
    userId,
    userName,
    requestId: (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trackingStatus,
  };

  // Run next() ภายใน context.run เพื่อให้ store นี้ใช้ได้ตลอด flow ของ request นี้
  context.run(store, () => {
    next();
  });
};
