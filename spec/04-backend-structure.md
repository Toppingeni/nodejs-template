# Backend Structure

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Oracle 11g (oracledb driver, raw SQL — ไม่ใช้ ORM)
- **Dev**: `tsx --watch` (auto-restart on change)
- **Build**: Vite (vite.config.server.ts) → single ESM bundle
- **Deploy**: PM2 (ecosystem.config.cjs)

## Folder Structure

```
server/
├── index.ts           # createServer() - Express app factory
├── start.ts           # Dev entry point
├── node-build.ts      # Production entry point
├── routes/
│   ├── index.ts       # Route registry (/api/*)
│   └── {entity}Routes.ts
├── controllers/
│   └── {entity}Controller.ts
├── services/
│   └── {entity}Service.ts
├── repositories/
│   └── {entity}Repository.ts
├── libs/
│   ├── oracle/        # Oracle connection pool management
│   └── notification/  # Notification utilities
├── middlewares/
│   ├── contextMiddleware.ts  # Request context (user info จาก JWT)
│   ├── auditFields.ts        # Auto-fill created/updated fields
│   ├── errorHandler.ts        # Global error handler
│   ├── uploadMiddleware.ts    # File upload (multer)
│   ├── validate.ts            # Request validation
│   ├── requestLogger.ts       # Request logging
│   └── logging.ts             # App-level logging
├── types/             # Server-only types
└── utils/
    └── keyConverter.ts  # Snake → camelCase converter (Oracle columns)
```

## Layered Pattern

```
Route → Controller → Service → Repository → Oracle DB
```

- **Route**: HTTP method + path → เรียก controller
- **Controller**: รับ req/res, validate input → เรียก service
- **Service**: Business logic, orchestrate repositories
- **Repository**: Raw SQL ผ่าน `oracledb` → return typed results

## Database Pattern

- ใช้ **raw SQL** ตรงๆ (ไม่มี ORM)
- Oracle connection pool ผ่าน `server/libs/oracle/`
- Repository return typed objects → ใช้ `convertSnakeToCamelCase()` แปลง column names
- Shared types ใน `shared/types/` เป็น contract ระหว่าง client/server

## Middleware Stack (ตามลำดับ)

1. `cors()` - CORS headers
2. `express.json()` - Parse JSON body
3. `express.urlencoded()` - Parse URL-encoded body
4. `contextMiddleware` - Extract user context จาก JWT
5. `loggingMiddleware` - Request logging

## API Route Pattern

ทุก route อยู่ใต้ `/api`:

```
/api/health            - Health check
/api/ping              - Ping/status check
/api/{entity}          - CRUD routes ของแต่ละ entity
```

### Route Registry (`routes/index.ts`)

```ts
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/{entity}', entityRoutes);

export default router;
```
