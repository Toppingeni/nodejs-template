# OPPN Node.js Template — โครงสร้างสไลด์สื่อการสอน

> สไลด์ทั้งหมด ~30 หน้า แบ่งเป็น 8 บท ภาษาไทย
> กลุ่มเป้าหมาย: นักพัฒนาที่จะใช้ template นี้ในการสร้างระบบ ERP

---

## บทที่ 1: ภาพรวมโปรเจกต์ (Slide 1-4)

### Slide 1 — หน้าปก

- ชื่อ: "OPPN Node.js Template"
- Subtitle: "Full-Stack Template สำหรับระบบ ERP บน Oracle 11g"
- Tech icons: Node.js, React, TypeScript, Oracle

### Slide 2 — ปัญหาที่ Template นี้แก้

- ทุกโปรเจกต์เริ่มต้นจาก 0 เสียเวลา setup ซ้ำๆ
- ไม่มีมาตรฐานโครงสร้าง ทำให้ดูแลยาก
- Oracle 11g มีข้อจำกัด (ไม่มี FETCH FIRST, OFFSET, JSON_TABLE)
- ต้องการ Authentication, Error Handling, Logging สำเร็จรูป
- **Template นี้แก้ทุกปัญหาข้างต้น — พร้อมใช้งานทันที**

### Slide 3 — Tech Stack Overview

- **แผนภาพแบ่ง 3 ชั้น:**
    - **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Radix UI (shadcn/ui)
    - **Backend:** Node.js + Express 5 + TSOA (OpenAPI) + Zod
    - **Database:** Oracle 11g + oracledb (Thick Mode) + SQLTab Pattern
    - **Shared:** TypeScript types + utilities ใช้ร่วมกัน
- **DevTools:** ESLint, Prettier, Husky, lint-staged, Vitest, PM2

### Slide 4 — โครงสร้าง Monorepo

```
nodejs-template/
├── client/        ← React Frontend
├── server/        ← Express Backend
├── shared/        ← Types & Utils ใช้ร่วม
├── spec/          ← เอกสาร 13 บท
├── dist/          ← Build output
│   ├── spa/       ← Frontend build
│   └── server/    ← Backend build
├── package.json   ← Root scripts
└── tsconfig.json  ← Project references
```

- อธิบายว่าแต่ละโฟลเดอร์ทำอะไร
- คำสั่งหลัก: `npm run dev`, `npm run build`, `npm run lint`

---

## บทที่ 2: สถาปัตยกรรม Backend (Slide 5-11)

### Slide 5 — Backend Architecture Diagram

- **แผนภาพ 3 ชั้น (Layered Architecture):**
    ```
    Request → Middleware → Controller → Service → Repository → Oracle DB
    ```
- แต่ละชั้นมีหน้าที่ชัดเจน ห้ามข้ามชั้น
- Controller ไม่มี business logic
- Service ไม่รู้จัก Express
- Repository ไม่มี business logic

### Slide 6 — Controller Layer

- **หน้าที่:** รับ request, validate, ส่งต่อ service, คืน response
- **สืบทอดจาก** `BaseController`
    - `handleSuccess<T>(data, message, statusCode)` — format response เป็น `{ message, data }`
    - `handleError(error, methodName)` — log + rethrow
- **TSOA Decorators:**
    - `@Route("samples")` — กำหนด path
    - `@Tags("Samples")` — จัดกลุ่มใน Swagger
    - `@Security("jwt")` — ต้อง login
    - `@Get()`, `@Post()`, `@Put()`, `@Delete()` — HTTP method
    - `@Query()`, `@Path()`, `@Body()` — parameter source
- **ตัวอย่างโค้ด:** แสดง sampleController.ts (GET list + POST create)

### Slide 7 — Service Layer

- **หน้าที่:** Business logic ทั้งหมดอยู่ที่นี่
- **Pattern:**
    - รับ DTO จาก controller
    - เรียก repository เพื่อดึง/บันทึกข้อมูล
    - แปลง UPPER_SNAKE → camelCase ด้วย `convertSnakeToCamelCase()`
    - ดึง userId จาก `context.getStore()?.userId` (AsyncLocalStorage)
- **ตัวอย่างโค้ด:** sampleService.ts (getAll + create)

### Slide 8 — Repository Layer

- **หน้าที่:** จัดการ SQL และเข้าถึง Oracle DB
- **สืบทอดจาก** `BaseRepository<TRow, TCreate, TUpdate>`
    - ต้องกำหนด: `tableName`, `primaryKey`, `selectColumns`
    - ได้ฟรี: `findAll()`, `findById()`, `findAllPaginated()`, `softDelete()`
    - ต้อง implement: `create()`, `update()`
- **Soft Delete Pattern:**
    - ไม่ลบจริง — เปลี่ยน `STATUS = 'D'`
    - query ปกติจะ filter `STATUS = 'A'` เสมอ
- **Audit Columns:** `CREATED_AT`, `CREATED_BY`, `UPDATED_AT`, `UPDATED_BY`
- **ตัวอย่างโค้ด:** sampleRepository.ts

### Slide 9 — Middleware Pipeline

- **แผนภาพ Pipeline (ตามลำดับ):**
    1. `requestLogger` — log ทุก HTTP request
    2. `contextMiddleware` — decode JWT → เก็บ userId/requestId ใน AsyncLocalStorage
    3. `auditFields` — inject userId/orgId เข้า req.body (POST/PUT/PATCH)
    4. **TSOA Routes** — route matching + parameter validation
    5. `authentication` — ตรวจ JWT token (เรียกจาก @Security)
    6. `errorHandler` — จับ error ทั้งหมด format response
- **อธิบายแต่ละตัวสั้นๆ 1-2 บรรทัด**

### Slide 10 — Error Handling System

- **Error Hierarchy:**
  | Class | HTTP Status | ใช้เมื่อ |
  |---|---|---|
  | `ValidationError` | 400 | input ไม่ถูกต้อง |
  | `AuthenticationError` | 401 | ไม่ได้ login / token หมดอายุ |
  | `AuthorizationError` | 403 | ไม่มีสิทธิ์เข้าถึง |
  | `NotFoundError` | 404 | ไม่พบข้อมูล |
  | `ConflictError` | 409 | ข้อมูลซ้ำ |
  | `DatabaseError` | 500 | DB error |
- **Global Error Handler:** จับทุก error → format เป็น JSON response เดียวกัน
- **TSOA ValidateError:** จับ DTO validation error อัตโนมัติ
- **Stack trace:** แสดงเฉพาะ development mode

### Slide 11 — TSOA & OpenAPI

- **TSOA คืออะไร:** Framework ที่สร้าง OpenAPI spec + Express routes จาก TypeScript decorators
- **ข้อดี:**
    - เขียน controller ครั้งเดียว ได้ทั้ง API + Swagger doc
    - Type-safe parameter validation อัตโนมัติ
    - ไม่ต้องเขียน route manually
- **Workflow:**
    1. เขียน controller ด้วย decorators
    2. รัน `npm run tsoa:gen`
    3. ได้ `routes.ts` + `swagger.json` (ห้ามแก้ไขไฟล์เหล่านี้!)
    4. Swagger UI ดูได้ที่ `/api/docs`
- **การตั้งค่า:** `tsoa.json` — basePath `/api`, security jwt, strict DTO validation

---

## บทที่ 3: Oracle 11g & Database (Slide 12-16)

### Slide 12 — Oracle Connection Architecture

- **แผนภาพ:**
    ```
    App → Oracle Class (singleton) → Connection Pool → Oracle 11g
    ```
- **Pool Config:** poolMin=2, poolMax=10, poolAlias="defaultPool"
- **Connection Flow:**
    1. อ่าน `tnsnames.ora` → parse connection string
    2. สร้าง pool ตอน bootstrap
    3. ทุก query ยืม connection จาก pool → ใช้ → คืน (ใน finally block)
- **Thick Mode:** จำเป็นสำหรับ Oracle 11g (ต้องมี Instant Client)

### Slide 13 — Oracle Class Methods

- **ตาราง Methods:**
  | Method | ใช้กับ | Auto-commit | หมายเหตุ |
  |---|---|---|---|
  | `query<T>()` | SELECT | - | คืน rows |
  | `queries<T>()` | หลาย SELECT | - | ใช้ connection เดียว |
  | `command<T>()` | INSERT/UPDATE/DELETE | ถ้า rowsAffected > 0 | single statement |
  | `commands<T>()` | หลาย commands | manual | transaction + callback |
  | `commandMany<T>()` | batch INSERT | manual | ใช้ executeMany() |
  | `commandSp<T>()` | Stored Procedure | ตาม SP | PL/SQL block |
  | `getSqlStmt()` | อ่าน SQL จาก SQLTab | - | dev=file, prod=DB |
- **สำคัญ:** ใช้ bind parameters เสมอ ห้าม string concatenation!

### Slide 14 — SQLTab Pattern

- **แนวคิด:** เก็บ SQL แยกจาก code
- **Dev Mode:** ไฟล์ `.sql` ใน `server/sqltabs/` ชื่อ `<APP_ID>_<SQL_NO>.sql`
- **Production:** เก็บใน table `KPDBA.SQL_TAB_OPPN`
    - `APP_ID` — รหัสแอป
    - `SQL_NO` — ลำดับ SQL
    - `SQL_TYPE` — 1=SELECT, 2=UPDATE, 3=INSERT, 4=DELETE
    - `SQL_STMT` — ตัว SQL statement
- **วิธีใช้:**
    ```typescript
    // ดึง SQL จาก SQLTab แล้ว query
    const result = await oracle.queryFromSqlTab<T>({
        sqlNo: "001",
        params: { id: "123" },
    });
    ```
- **ข้อดี:** แก้ SQL ได้โดยไม่ต้อง deploy ใหม่ (prod)

### Slide 15 — Pagination (Oracle 11g)

- **ปัญหา:** Oracle 11g ไม่มี `FETCH FIRST` / `OFFSET`
- **วิธีแก้:** Double-ROWNUM Wrapping
    ```sql
    SELECT * FROM (
      SELECT a.*, ROWNUM AS RNUM
      FROM (... base query ...) a
      WHERE ROWNUM <= :endRow
    ) WHERE RNUM >= :startRow
    ```
- **Utility Functions:**
    - `buildPaginatedQuery(sql, params)` — ครอบ SQL ด้วย ROWNUM
    - `buildPaginatedResponse(rows, total, page, limit)` — format response
- **Response Format:**
    ```json
    {
      "data": [...],
      "pagination": {
        "page": 1, "limit": 10,
        "totalItems": 156, "totalPages": 16
      }
    }
    ```

### Slide 16 — Schema Cache & Best Practices

- **Schema Cache:** ไฟล์ `server/schema/*.md` เก็บ column definitions
    - ตรวจสอบ column ก่อนเขียน SQL เสมอ
    - ป้องกันพิมพ์ชื่อ column ผิด
- **Best Practices:**
    - ใช้ bind parameters `:paramName` ทุกครั้ง (ป้องกัน SQL injection)
    - ห้ามใช้ `FETCH FIRST`, `OFFSET`, `JSON_TABLE` (Oracle 11g ไม่รองรับ)
    - ใช้ `SYSDATE` สำหรับ timestamp (ไม่ใช่ JS Date)
    - Soft delete (`STATUS = 'D'`) แทนการลบจริง
    - Audit columns ทุก table: `CREATED_AT`, `CREATED_BY`, `UPDATED_AT`, `UPDATED_BY`

---

## บทที่ 4: สถาปัตยกรรม Frontend (Slide 17-22)

### Slide 17 — Frontend Architecture Diagram

- **แผนภาพ:**
    ```
    Browser → React Router → Pages → Components → TanStack Query → API → Backend
    ```
- **Provider Stack (นอก → ใน):**
    ```
    QueryClientProvider → AuthProvider → ErrorBoundary
    → UserRoleProvider → ThemeProvider → LayoutProvider
    → TooltipProvider → RouterProvider
    ```
- อธิบายว่าทำไมต้องเรียงแบบนี้

### Slide 18 — Component Architecture

- **แผนภาพ Component Tree:**
    ```
    components/
    ├── ui/          🔒 shadcn/ui primitives (ห้ามแก้!)
    ├── layout/      🏗️ Header, Sidebar, MainLayout
    ├── shared/      ♻️ Reusable (ใช้ซ้ำทุกหน้า)
    │   ├── form/    → Form, FormField, FormItem...
    │   ├── table/   → EmptyState, TablePagination
    │   ├── loading/ → PageLoader
    │   ├── error/   → ErrorBoundary
    │   ├── search/  → SearchInput
    │   └── badge/   → StatusBadge
    └── pages/       📄 เฉพาะหน้านั้นๆ
    ```
- **กฎสำคัญ:**
    - ใช้ shared components เสมอ ห้ามสร้างซ้ำ
    - ห้ามแก้ไฟล์ใน `ui/` (shadcn/ui)
    - Component เฉพาะหน้า → อยู่ใน `pages/<name>/components/`

### Slide 19 — Form Pattern (สำคัญมาก)

- **กฎ:** ทุก form ต้องใช้ pattern นี้ ห้ามใช้ native `<form>`
- **Stack:** React Hook Form + Zod + Shared Form Components
- **ตัวอย่างโค้ดเต็ม:**

    ```tsx
    // 1. สร้าง Zod Schema
    const schema = z.object({
        name: z.string().min(1, "กรุณากรอกชื่อ"),
        email: z.string().email("อีเมลไม่ถูกต้อง"),
    });

    // 2. ใช้ useForm
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    // 3. ใช้ Shared Form Components
    <Form form={form} onSubmit={handleSubmit}>
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormFieldItem>
                    <FormLabel>ชื่อ</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormFieldItem>
            )}
        />
    </Form>;
    ```

- **ข้อดี:** validation สม่ำเสมอ, type-safe, error message อัตโนมัติ

### Slide 20 — TanStack Query (Data Fetching)

- **หลักการ:** ห้ามใช้ `useEffect` + `useState` สำหรับ fetch data
- **Pattern:** Query Options Factory

    ```typescript
    // สร้าง query options
    export const sampleOptions = {
        list: (filters) =>
            queryOptions({
                queryKey: ["samples", filters],
                queryFn: () => sampleApi.getAll(filters),
            }),
        detail: (id) =>
            queryOptions({
                queryKey: ["samples", id],
                queryFn: () => sampleApi.getById(id),
            }),
    };

    // ใช้ใน component
    const { data, isLoading } = useQuery(sampleOptions.list(filters));
    ```

- **Mutation Pattern:**
    - `useMutation()` + `onSuccess` → `invalidateQueries()`
    - Toast notification ด้วย `sonner`
- **Config:** staleTime=5min, gcTime=10min, retry=1 (ไม่ retry 4xx)

### Slide 21 — Styling Guide (Glassmorphism)

- **Design System:**
    - Background: `bg-white/70` + `backdrop-blur-xl`
    - Border: `border-slate-200/60`
    - Shadow: `shadow-lg shadow-blue-500/30`
    - Radius: `rounded-xl` หรือ `rounded-2xl`
    - Button: gradient `from-blue-600 to-indigo-600`
- **ตัวอย่าง Card:**
    ```html
    <div
        class="bg-white/70 backdrop-blur-xl border border-slate-200/60
                rounded-2xl shadow-lg p-6"
    >
        ...
    </div>
    ```
- **กฎ:** ใช้ Tailwind เท่านั้น ห้ามใช้ inline styles
- **cn() helper:** ใช้สำหรับ merge class names
    ```tsx
    import { cn } from "@/lib/utils";
    <div className={cn("base-class", condition && "extra-class")} />;
    ```

### Slide 22 — Routing & Lazy Loading

- **โครงสร้าง Route:**
    ```
    / (public)
    ├── /login          → LoginPage
    ├── /token-login    → TokenLogin (SSO)
    └── / (PrivateRoute + MainLayout)
        ├── /           → HomePage
        ├── /samples    → SamplePage
        └── /...        → Lazy-loaded pages
    ```
- **Lazy Loading:** ทุกหน้าใช้ `React.lazy()` + `<Suspense>`
    ```tsx
    const SamplePage = React.lazy(() => import("./pages/sample/SamplePage"));
    ```
- **PrivateRoute:** redirect ไป `/login?redirectTo=...` ถ้าไม่ login
- **Role-Based:** `<PrivateRoute roles={["admin"]}>` จำกัดสิทธิ์

---

## บทที่ 5: Authentication & Authorization (Slide 23-25)

### Slide 23 — Auth Flow Diagram

- **แผนภาพ Login Flow:**
    ```
    1. User กรอก username/password
    2. POST /api/user/login
    3. Backend verify → ส่ง JWT token
    4. Frontend เก็บ token (localStorage หรือ sessionStorage)
    5. ทุก request แนบ token ใน Authorization header
    6. Backend middleware decode token → เก็บใน AsyncLocalStorage
    ```
- **Token Storage:**
    - Remember me ✓ → `localStorage`
    - Remember me ✗ → `sessionStorage`
    - `STORAGE_HINT_KEY` บอกว่าเก็บที่ไหน
- **Auto-verify:** เปิดแอปมา → ตรวจ token → verify กับ server

### Slide 24 — Backend Auth Pipeline

- **แผนภาพ Pipeline:**
    ```
    Request with JWT
    → contextMiddleware: decode token (unsafe) → AsyncLocalStorage
    → auditFields: inject userId/orgId เข้า body
    → TSOA @Security("jwt"): verify token signature
    → Controller: context.getStore().userId พร้อมใช้
    ```
- **2 วิธี Verify:**
    1. `verifyToken()` — ตรวจ signature (HS256) ← ใช้กับ @Security
    2. `decodeTokenUnsafe()` — decode อย่างเดียว (gateway-forwarded) ← ใช้กับ contextMiddleware
- **JWT Claims Normalization:** รองรับหลาย format (`nameid`/`userId`/`sub`, ฯลฯ)

### Slide 25 — Role-Based Access Control

- **Frontend:**
    - `UserRoleContext` อ่าน `user.UserType` จาก JWT
    - Helpers: `hasRole("admin")`, `hasAnyRole(["admin","manager"])`, `canAccess("feature")`
    - `<PrivateRoute roles={[...]}>` ป้องกันระดับ route
- **Dev Mode:**
    - `VITE_BYPASS_AUTH=true` → ข้าม auth ทั้งหมด ใช้ mock admin user
    - สะดวกตอน develop frontend โดยไม่ต้องมี backend

---

## บทที่ 6: Shared Layer & Type Safety (Slide 26-27)

### Slide 26 — Shared Types

- **แนวคิด:** Frontend + Backend ใช้ type เดียวกัน → ไม่ผิดพลาด
- **โครงสร้าง:**
    ```
    shared/
    ├── types/
    │   ├── index.ts      → DecodedUser, ApiResponse<T>, PaginatedResponse<T>
    │   ├── database.ts   → BaseRow, RecordStatus ("A" | "D")
    │   └── sample.ts     → Sample (camelCase) + SampleRow (SNAKE_CASE) + DTOs
    └── utils/
        └── index.ts      → formatDateTime(), generateId()
    ```
- **Pattern:** ทุก entity มี 2 type:
    - `SampleRow` — ตรงกับ DB column (UPPER_SNAKE_CASE)
    - `Sample` — ใช้ใน JS (camelCase)
    - `CreateSampleDto`, `UpdateSampleDto` — สำหรับ input
- **ApiResponse<T>:** format response มาตรฐาน `{ message, data }`
- **PaginatedResponse<T>:** `{ data, pagination: { page, limit, totalItems, totalPages } }`

### Slide 27 — Key Converter (Snake ↔ Camel)

- **ปัญหา:** Oracle คืน column เป็น `UPPER_SNAKE_CASE` แต่ JS ใช้ `camelCase`
- **วิธีแก้:** `convertSnakeToCamelCase()` / `convertCamelToSnakeCase()`
- **ใช้ที่ไหน:** Service layer แปลงก่อนส่งกลับ controller
- **ตัวอย่าง:**
    ```
    DB: { SAMPLE_ID: "1", SAMPLE_NAME: "Test", CREATED_AT: "..." }
         ↓ convertSnakeToCamelCase()
    JS: { sampleId: "1", sampleName: "Test", createdAt: "..." }
    ```

---

## บทที่ 7: Utilities & DevTools (Slide 28-29)

### Slide 28 — Context-Aware Logger

- **แนวคิด:** Log ทุกบรรทัดมี userId + requestId โดยไม่ต้องส่ง parameter
- **เทคนิค:** `AsyncLocalStorage` เก็บ context ตลอด async chain
- **Features:**
    - Log levels: ERROR, WARN, INFO, DEBUG
    - SQL logging แยก method
    - WebSocket forwarding → ดู log real-time บน browser
    - `trackingStatus === "F"` → ปิด log (ใช้กับ health check)
- **ตัวอย่าง:**
    ```typescript
    logger.info("สร้าง sample สำเร็จ", { sampleId: "123" });
    // Output: [2024-01-15 10:30:45] [INFO] [user:admin] [req:abc-123] สร้าง sample สำเร็จ {"sampleId":"123"}
    ```

### Slide 29 — Development Workflow & Tools

- **คำสั่งหลัก:**
  | คำสั่ง | ทำอะไร |
  |---|---|
  | `npm run dev` | รัน frontend + backend พร้อมกัน |
  | `npm run dev:frontend` | รัน frontend อย่างเดียว |
  | `npm run tsoa:gen` | สร้าง routes + swagger ใหม่ |
  | `npm run lint` | ตรวจ code ทั้ง project |
  | `npm run build` | build production |
- **Dev Proxy:** Vite proxy `/api` → `localhost:3000` (ไม่มี CORS issue)
- **Git Hooks (Husky):**
    - pre-commit → lint-staged (ESLint + Prettier เฉพาะไฟล์ที่แก้)
- **PM2:** production process manager (`ecosystem.config.cjs`)
- **HashiCorp Vault:** เก็บ secrets (fallback to `.env` ตอน dev)

---

## บทที่ 8: สรุป & Best Practices (Slide 30)

### Slide 30 — DOs & DON'Ts Cheat Sheet

**BACKEND — ทำ:**

- ใช้ bind parameters `:param` ทุกครั้ง
- สืบทอด BaseController / BaseRepository
- ใช้ asyncErrorWrapper() ครอบ async handlers
- ตรวจ schema cache ก่อนเขียน SQL
- ใช้ SQLTab สำหรับ query ที่ซับซ้อน

**BACKEND — ห้าม:**

- ห้ามแก้ไฟล์ `tsoa/routes.ts`, `tsoa/swagger.json`
- ห้ามใช้ `FETCH FIRST`, `OFFSET`, `JSON_TABLE`
- ห้าม string concat ใน SQL
- ห้ามข้ามชั้น (Controller เรียก Repository ตรง)

**FRONTEND — ทำ:**

- ใช้ shared components จาก `@/components/shared/`
- ใช้ Form pattern (React Hook Form + Zod)
- ใช้ TanStack Query สำหรับ data fetching
- ใช้ Tailwind classes + Glassmorphism theme

**FRONTEND — ห้าม:**

- ห้ามแก้ไฟล์ใน `components/ui/`
- ห้ามใช้ native `<form>` → ใช้ shared `<Form>`
- ห้ามใช้ `useEffect` + `fetch` → ใช้ TanStack Query
- ห้ามใช้ inline styles → ใช้ Tailwind
- ห้ามสร้าง component ซ้ำ → ใช้ shared

---

## หมายเหตุสำหรับผู้สร้างสไลด์

### สไตล์แนะนำ

- โทนสี: น้ำเงิน-คราม (สอดคล้องกับ Glassmorphism theme ของโปรเจกต์)
- Font: ใช้ monospace สำหรับ code snippets
- ทุกหน้าที่มี "แผนภาพ" ควรวาดเป็น diagram จริง ไม่ใช่ text
- Code examples ควรมี syntax highlighting

### ลำดับแนะนำ

1. สอนภาพรวมก่อน (บทที่ 1)
2. Backend → Database → Frontend (บทที่ 2-4)
3. Auth ตัดข้ามทั้ง stack (บทที่ 5)
4. Shared/Utils เป็นส่วนเสริม (บทที่ 6-7)
5. จบด้วย cheat sheet (บทที่ 8)
