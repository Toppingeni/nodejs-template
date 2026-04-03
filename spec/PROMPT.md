# Prompt: สร้าง Fullstack Template

## คำสั่ง

สร้าง fullstack monorepo template ที่พร้อม clone มาใช้งานได้ทันที โดยมี **1 CRUD ตัวอย่าง (Sample entity)** ครบ flow ตั้งแต่ UI → API → Database

อ่าน spec ทั้งหมดในโฟลเดอร์ `spec/` เพื่อเข้าใจ architecture, patterns, และ code ที่ต้องใช้ แต่ละไฟล์มีรายละเอียดดังนี้:

- `00-overview.md` — โครงสร้าง monorepo, tech stack, dev commands
- `01-frontend-ui.md` — UI libraries (shadcn/ui + MUI DateTimePicker), forms, routing
- `02-api-connection.md` — Axios client, TanStack Query pattern
- `03-authentication.md` — Auth 2 แบบ (Form Login + Token URL), JWT
- `04-backend-structure.md` — Express layered pattern (Route → Controller → Service → Repository)
- `05-shared-types.md` — Shared types ระหว่าง client/server
- `06-env-and-deploy.md` — Environment, build pipeline, PM2 deploy, server entry points
- `07-app-bootstrap.md` — App.tsx provider stack, PrivateRoute, route config
- `08-tanstack-query-pattern.md` — TanStack Query v5 patterns (queryOptions, hooks, cache)
- `09-oracle-lib.md` — Oracle DB library (connection, query, command, transaction)
- `10-server-middlewares.md` — Middlewares (context, audit, error, upload, validate)
- `11-layout-sidebar-navbar.md` — Layout system (MainLayout, Header, Sidebar, LayoutContext)
- `12-role-based-access.md` — RBAC ทั้ง client + server

---

## Tech Stack

| Layer    | Technology                                                                       |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite (SWC)                                               |
| UI       | **shadcn/ui** (Radix + Tailwind CSS) + **MUI DateTimePicker** เฉพาะเลือกวัน-เวลา |
| State    | TanStack Query v5 (server state)                                                 |
| Forms    | React Hook Form + Zod                                                            |
| Routing  | React Router DOM v6                                                              |
| Backend  | Express.js + TypeScript                                                          |
| Database | Oracle 11g (oracledb, raw SQL — ไม่ใช้ ORM)                                      |
| Auth     | JWT (2 แบบ: Form Login + Token URL)                                              |
| Build    | Vite (client + server)                                                           |
| Deploy   | PM2                                                                              |

---

## UI / Design Direction

ออกแบบ UI ให้ทันสมัยตามเทรนด์ 2025-2026:

### Visual Style

- **Glassmorphism**: `bg-white/70 backdrop-blur-xl` สำหรับ Header, Sidebar, Cards
- **Subtle gradients**: ไม่ใช่สีจัด ใช้ gradient อ่อนๆ เช่น `from-slate-50 via-slate-100 to-slate-200`
- **Ambient glow**: blur circles เบาๆ เป็น background decoration
- **Soft shadows**: `shadow-sm`, `shadow-lg shadow-blue-500/30` สำหรับ active states
- **Rounded corners**: `rounded-xl` ถึง `rounded-2xl` ทุกที่

### Layout Pattern

- **Sidebar + Header layout** (ไม่ใช่ top-nav only)
- Sidebar: collapsible (w-64 ↔ w-16), icon + tooltip mode, persist state
- Header: sticky, glassmorphic, user dropdown
- Mobile: sidebar เป็น Sheet overlay จากซ้าย
- Content area: `h-[calc(100dvh-4rem)]` ใช้ dvh รองรับ mobile browser

### Component Patterns

- **Data Table**: ใช้ `@tanstack/react-table` + shadcn table — sortable columns, pagination, search filter
- **Forms**: React Hook Form + Zod — inline validation, error messages
- **Dialogs**: shadcn Dialog สำหรับ create/edit forms
- **Toast**: sonner + shadcn toast สำหรับ success/error notifications
- **Loading states**: skeleton loaders หรือ spinner ที่เหมาะสม
- **Empty states**: แสดง illustration + message เมื่อไม่มีข้อมูล

### Typography & Spacing

- Font: system font stack (ไม่ต้อง import font ภายนอก)
- ใช้ Tailwind spacing scale อย่างสม่ำเสมอ (p-4, p-6, gap-4, space-y-4)
- Text hierarchy ชัดเจน: `text-2xl font-bold` สำหรับ page title, `text-sm text-muted-foreground` สำหรับ secondary

### Color System

- Primary: Blue/Indigo gradient (`from-blue-600 to-indigo-600`)
- Background: Slate tones (`slate-50` → `slate-200`)
- Active/Selected: Blue gradient + glow shadow
- Destructive: Red (`text-red-600`, `bg-red-50`)
- Muted: `text-muted-foreground` (Tailwind default)
- Support dark mode ผ่าน `next-themes` (ThemeProvider)

---

## สิ่งที่ต้องสร้าง

### 1. Sample CRUD Page — ตัวอย่างครบ flow

สร้าง "Sample" entity ที่มี fields: `id`, `name`, `description`, `status`, `createdAt`, `createdBy`

**หน้า SamplePage ต้องมี:**

- Search/filter bar ด้านบน
- Data table แสดงรายการ (sortable, pagination)
- ปุ่ม "สร้างใหม่" → เปิด Dialog form
- แต่ละ row มีปุ่ม Edit / Delete
- Edit → เปิด Dialog form เดียวกัน (pre-filled)
- Delete → confirm dialog → soft delete
- Toast notification ทุก action

**Flow เต็ม:**

```
SamplePage.tsx
  → useSamples() hook (TanStack Query)
    → sampleApi.getAll() (Axios)
      → GET /api/sample
        → sampleController.getAll()
          → sampleService.getAll()
            → sampleRepository.findAll()
              → Oracle SQL: SELECT * FROM {SCHEMA}.SAMPLE_TABLE
```

### 2. โครงสร้างไฟล์ที่ต้องมี

```
root/
├── client/
│   ├── App.tsx                          # Provider stack + router
│   ├── global.css                       # Tailwind imports
│   ├── auth/
│   │   ├── context.tsx                  # AuthProvider + useAuth
│   │   ├── tokens.ts                    # JWT save/load/decode/expire
│   │   ├── api.ts                       # Auth Axios instance
│   │   ├── LoginPage.tsx                # Form login
│   │   ├── TokenLogin.tsx               # URL token login
│   │   ├── PrivateRoute.tsx             # Auth + role guard
│   │   └── index.ts                     # Re-exports
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx           # Header + Sidebar + Content
│   │   │   ├── Header.tsx               # Navbar
│   │   │   └── Sidebar.tsx              # Collapsible sidebar
│   │   └── ui/                          # shadcn/ui components
│   ├── contexts/
│   │   ├── LayoutContext.tsx             # Sidebar collapse state
│   │   └── UserRoleContext.tsx           # Role state + helpers
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   └── utils.ts                     # cn() helper
│   ├── pages/
│   │   ├── index/                       # Home page
│   │   ├── sample/                      # CRUD ตัวอย่าง
│   │   │   ├── SamplePage.tsx           # Main page (table + dialogs)
│   │   │   └── components/
│   │   │       ├── SampleTable.tsx      # Data table
│   │   │       ├── SampleForm.tsx       # Create/Edit form
│   │   │       └── SampleFilters.tsx    # Search/filter bar
│   │   └── notFound/
│   ├── router/
│   │   └── routes.tsx                   # Route config
│   ├── tanstackQuery/
│   │   ├── queryClient.ts              # QueryClient config
│   │   ├── api.ts                       # Axios instance + sample API functions
│   │   ├── useSampleApi.ts             # queryOptions + hooks
│   │   ├── useRoleApi.ts               # Role hooks
│   │   ├── useApi.ts                    # Logout hook
│   │   └── index.ts
│   ├── theme/
│   │   └── index.tsx                    # ThemeProvider (light/dark)
│   └── types/
│       └── role.ts                      # Role types
│
├── server/
│   ├── index.ts                         # createServer()
│   ├── start.ts                         # Dev entry
│   ├── node-build.ts                    # Production entry + bootstrap
│   ├── routes/
│   │   ├── index.ts                     # Route registry
│   │   └── sampleRoutes.ts
│   ├── controllers/
│   │   └── sampleController.ts
│   ├── services/
│   │   └── sampleService.ts
│   ├── repositories/
│   │   └── sampleRepository.ts
│   ├── libs/
│   │   └── oracle/                      # Oracle connection + Oracle class
│   ├── middlewares/
│   │   ├── contextMiddleware.ts
│   │   ├── auditFields.ts
│   │   ├── errorHandler.ts
│   │   ├── uploadMiddleware.ts
│   │   ├── validate.ts
│   │   ├── logging.ts
│   │   └── requestLogger.ts
│   ├── utils/
│   │   ├── context.ts                   # AsyncLocalStorage
│   │   └── keyConverter.ts              # snake_case → camelCase
│   └── types/
│
├── shared/
│   ├── types/
│   │   ├── index.ts                     # User, AuthResponse, ApiError
│   │   ├── database.ts                  # Base DB row types
│   │   └── sample.ts                    # Sample entity types + DTOs
│   ├── constants/
│   │   └── index.ts                     # HTTP_STATUS, ERROR_CODES
│   └── utils/
│       └── index.ts                     # formatDateTime, etc.
│
├── vite.config.ts                       # Client build + proxy
├── vite.config.server.ts                # Server build (single ESM)
├── tailwind.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── components.json                      # shadcn/ui config
├── ecosystem.config.cjs                 # PM2 config
├── index.html
├── .env.example
├── package.json
└── README.md
```

### 3. Backend — ยึดจาก server/ ปัจจุบัน

**`server/` ที่มีอยู่แล้วในโปรเจกต์นี้คือ template ของ backend** ให้ใช้เป็นฐานโดยตรง:

- **ห้ามเขียน server ขึ้นมาใหม่** — ให้อ่าน code จาก `server/` ที่มีอยู่แล้ว
- โครงหลักที่ต้อง**คง**ไว้เหมือนเดิม:
  - `server/index.ts` — createServer() + middleware stack
  - `server/start.ts` — dev entry point
  - `server/node-build.ts` — production entry + bootstrap + SPA serve + graceful shutdown
  - `server/libs/oracle/` — Oracle class ทั้ง folder (config, oracledb, index)
  - `server/middlewares/` — ทั้งหมด (context, audit, error, upload, validate, logging)
  - `server/utils/` — context (AsyncLocalStorage), keyConverter, databaseHelper, logger
  - `server/types/` — oracleType, etc.
- สิ่งที่ต้อง**เปลี่ยน**:
  - `server/routes/` — ลบ routes เฉพาะโปรเจกต์ เหลือ `index.ts` (health + ping) + `sampleRoutes.ts` ตัวอย่าง
  - `server/controllers/` — ลบทั้งหมด สร้าง `sampleController.ts` ตัวอย่าง
  - `server/services/` — ลบทั้งหมด สร้าง `sampleService.ts` ตัวอย่าง (เก็บ `roleService.ts` ไว้ถ้าต้องการ)
  - `server/repositories/` — ลบทั้งหมด สร้าง `sampleRepository.ts` ตัวอย่าง
- **Pattern ที่ต้องทำตาม** (ดูจาก code เดิม):
  - Route → Controller → Service → Repository → `oracle.query()` / `oracle.command()`
  - ใช้ `addAuditFields` middleware สำหรับ POST/PUT routes
  - ใช้ `convertSnakeToCamelCase()` แปลง Oracle column names
  - Error handling ผ่าน try/catch → throw Error → errorHandler middleware จัดการ

### 4. กฎสำคัญ

- **ห้าม** ใส่ business logic เฉพาะโปรเจกต์ — มีแค่ Sample entity ตัวอย่าง
- **ห้าม** ใส่ชื่อบริษัท, ชื่อระบบ, หรือข้อมูลเฉพาะองค์กร
- **ต้อง** มี `.env.example` ครบทุก variable ที่ใช้
- **ต้อง** มี code จริงที่ทำงานได้ ไม่ใช่ placeholder/TODO
- **ต้อง** ใช้ `queryOptions()` pattern ของ TanStack Query v5 (ไม่ใช่ key factory แยก)
- **ต้อง** ใช้ Axios เป็น HTTP client ตัวเดียว (ไม่ต้องมี fetch wrapper)
- **ต้อง** retry config อยู่ที่ `queryClient.ts` ที่เดียว
- Oracle schema ใช้ `{SCHEMA}` เป็น placeholder
- ทุก page ต้อง wrap ด้วย `<MainLayout>`
- ทุก text ภาษาไทย (UI labels, toast messages, comments)
