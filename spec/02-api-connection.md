# API Connection Pattern

## HTTP Clients (Client มี 2 ตัว)

### 1. Business API (`tanstackQuery/api.ts`)

- ใช้ **Axios** instance
- Base URL: `VITE_API_URL` (Express server)
- แนบ JWT token ผ่าน request interceptor
- Response interceptor: ถ้าได้ 401 → ลบ token → redirect ไป `/login`
- ใช้สำหรับ business API ทั่วไป (`/api/{entity}`)

### 2. Auth API (`client/auth/api.ts`)

- ใช้ **Axios** instance อีกตัว
- Base URL: `VITE_API_AUTH_URL` (external auth service — คนละ server)
- แนบ JWT token ผ่าน interceptor
- Response interceptor: เหมือนตัวแรก
- ใช้สำหรับ auth operations (login, verify token, logout)

## TanStack Query Pattern

```
client/tanstackQuery/
├── queryClient.ts       # Query client config
├── api.ts               # Axios instance + API functions
├── index.ts             # Re-exports
├── useApi.ts            # Hooks กลาง (useLogout)
└── use{Entity}Api.ts    # Hooks แต่ละ entity
```

### Query Key Factory Pattern (แนะนำใช้ `queryOptions()` v5)

```ts
export const sampleOptions = {
  list: (filters?) =>
    queryOptions({
      queryKey: ['samples', 'list', filters],
      queryFn: () => sampleApi.getAll(filters),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['samples', 'detail', id],
      queryFn: () => sampleApi.getById(id),
      enabled: !!id,
    }),
};
```

### Hook Pattern

- **Query**: `useQuery` สำหรับ GET → return `{ data, isLoading, error }`
- **Mutation**: `useMutation` สำหรับ POST/PUT/DELETE → return `{ mutate, isPending }`
- Mutation สำเร็จ → invalidate related queries → toast notification
- Default: `staleTime: 5 min`, `gcTime: 10 min`, `retry: 2`

## Server API Structure

```
server/
├── routes/           # Express Router definitions
├── controllers/      # Request handling + validation
├── services/         # Business logic
├── repositories/     # Database queries (raw SQL)
└── libs/oracle/      # Oracle DB connection pool
```

### Layered Pattern

```
Route → Controller → Service → Repository → Oracle DB
```

- **Routes**: กำหนด HTTP method + path, เรียก controller
- **Controllers**: รับ req/res, validate input, เรียก service
- **Services**: Business logic, orchestrate repositories
- **Repositories**: Raw SQL queries ผ่าน `oracledb`, return typed results
- Types ดึงจาก `shared/types/` ให้ตรงกันทั้ง client/server
