# Server Middlewares

## Middleware Stack (ตามลำดับใน `server/index.ts`)

```ts
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(contextMiddleware); // Extract user จาก JWT → AsyncLocalStorage
app.use(loggingMiddleware); // Request logging

app.use('/api', routes);

// Error handling (ต้องอยู่หลัง routes — ใน node-build.ts)
app.use(errorLoggingMiddleware);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## contextMiddleware — Extract User จาก JWT

Decode JWT payload จาก `Authorization: Bearer xxx` header แล้วเก็บใน AsyncLocalStorage ให้ทุก layer เข้าถึงได้

```ts
import { Request, Response, NextFunction } from 'express';
import { context } from '../utils/context'; // AsyncLocalStorage instance

export const contextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let userId = 'anonymous';
  let userName = 'Anonymous';

  try {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.nameid || payload.sub || 'unknown_user';
        userName = payload.UserName || payload.username || 'Unknown User';
      }
    }
  } catch {
    // Ignore decode errors
  }

  const store = {
    userId,
    userName,
    requestId: (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  context.run(store, () => next());
};
```

---

## auditFields — Auto-fill userId สำหรับ POST/PUT

Decode JWT → แนบ `userId`, `orgId` ลง `req.body` + `req.userInfo` ให้ controller/service ใช้ได้เลย

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuditFields {
  userId: string;
  orgId: string;
}

export function addAuditFields(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7);
  const user = jwt.decode(token) as any;

  req.user = { userId: user.nameid, id: user.nameid };

  const auditFields: AuditFields = {
    userId: user.nameid,
    orgId: user.ORG,
  };

  req.userInfo = auditFields;

  // เพิ่ม audit fields ลง body สำหรับ POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.body) req.body = {};
    req.body.userId = auditFields.userId;
    req.body.orgId = auditFields.orgId;
  }

  next();
}
```

**ใช้งาน**: ใส่เป็น route-level middleware

```ts
router.post('/sample', addAuditFields, sampleController.create);
router.put('/sample/:id', addAuditFields, sampleController.update);
```

---

## errorHandler — Global Error Handling

```ts
// Not Found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: any = { message, status: statusCode };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
```

---

## uploadMiddleware — File Upload (Multer)

```ts
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
```

**ใช้งาน**:

```ts
router.post('/sample/upload', upload.single('file'), sampleController.upload);
router.post('/sample/upload-many', upload.array('files', 10), sampleController.uploadMany);
```

---

## validate — Request Validation (Zod)

```ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
};
```

**ใช้งาน**:

```ts
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

router.post('/sample', validate(createSchema), addAuditFields, sampleController.create);
```
