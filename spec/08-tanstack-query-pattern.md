# TanStack Query — API Connection Pattern

## ภาพรวม Architecture

```
Page Component
  └─ useXxxApi hook (TanStack Query)
       └─ API function (api.ts)
            └─ Axios instance (apiClient)
                 └─ Interceptors (auth token, 401 redirect)
                      └─ Express Server (/api/*)
```

---

## Layer 1: Axios Instance (`tanstackQuery/api.ts`)

API client กลางที่ทุก hook ใช้ร่วมกัน

```ts
import axios from 'axios';
import { getToken, clearToken } from '@/auth/tokens';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 300000, // 5 นาที (หรือตั้งผ่าน VITE_API_TIMEOUT_MS)
  headers: { 'Content-Type': 'application/json' },
});

// แนบ JWT token ทุก request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → ลบ token → redirect /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.replace(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
    }
    return Promise.reject(error);
  },
);
```

### API Functions — จัดเป็น object ตาม entity

```ts
export const sampleApi = {
  getAll: async (filters?) => (await apiClient.get('/sample', { params: filters })).data,
  getById: async (id) => (await apiClient.get(`/sample/${id}`)).data,
  create: async (data) => (await apiClient.post('/sample', data)).data,
  update: async (id, data) => (await apiClient.put(`/sample/${id}`, data)).data,
  delete: async (id) => (await apiClient.delete(`/sample/${id}`)).data,
};
```

### Error Helper

```ts
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    if (axiosError.response?.data?.message) return axiosError.response.data.message;
  }
  if (error && typeof error === 'object' && 'message' in error) return (error as { message: string }).message;
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};
```

---

## Layer 2: Query Client (`tanstackQuery/queryClient.ts`)

Config กลางของ TanStack Query ทั้ง app

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 นาที — ไม่ refetch ถ้ายังไม่ stale
      gcTime: 10 * 60 * 1000, // 10 นาที — เก็บ cache ไว้ใน memory
      retry: (failureCount, error) => {
        // 4xx (client error) → ไม่ retry
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        // อื่นๆ → retry 1 ครั้ง
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## Layer 3: Query Key Factory

ทุก entity มี key factory เป็นของตัวเอง เพื่อจัดการ cache invalidation

```ts
export const sampleQueryKeys = {
  all: ['samples'] as const,
  lists: () => [...sampleQueryKeys.all, 'list'] as const,
  list: (filters?) => [...sampleQueryKeys.lists(), filters] as const,
  details: () => [...sampleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...sampleQueryKeys.details(), id] as const,
};
```

### หลักการ Key

```
['samples']                          ← invalidate ทั้ง entity
['samples', 'list']                  ← invalidate ทุก list (ทุก filters)
['samples', 'list', { status: 'A' }]← cache เฉพาะ filter นี้
['samples', 'detail', '123']         ← cache เฉพาะ item นี้
```

---

## Layer 4: Custom Hooks (`tanstackQuery/useSampleApi.ts`)

### Pattern: Query Hook (GET)

```ts
export const useSamples = (filters?: SampleFilters, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: sampleQueryKeys.list(filters),
    queryFn: () => sampleApi.getAll(filters),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSampleById = (id: string) => {
  return useQuery({
    queryKey: sampleQueryKeys.detail(id),
    queryFn: () => sampleApi.getById(id),
    enabled: !!id, // ไม่ fetch ถ้าไม่มี id
  });
};
```

### Pattern: Mutation Hook (POST/PUT/DELETE)

```ts
export const useCreateSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSampleDto) => sampleApi.create(data),
    onSuccess: (newItem) => {
      // 1. Invalidate list → refetch อัตโนมัติ
      queryClient.invalidateQueries({
        queryKey: sampleQueryKeys.lists(),
      });

      // 2. (Optional) เขียนลง cache ตรง → UI อัปเดตทันทีไม่ต้องรอ refetch
      queryClient.setQueryData(sampleQueryKeys.detail(newItem.id), newItem);

      // 3. Toast notification
      toast.success('สร้างข้อมูลสำเร็จ');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
};

export const useUpdateSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSampleDto }) => sampleApi.update(id, data),
    onSuccess: (updated, { id }) => {
      // อัปเดต cache ตรง
      queryClient.setQueryData(sampleQueryKeys.detail(id), updated);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: sampleQueryKeys.lists() });
      toast.success('อัปเดตข้อมูลสำเร็จ');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
};

export const useDeleteSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sampleApi.delete(id),
    onSuccess: (_, id) => {
      // ลบออกจาก cache
      queryClient.removeQueries({ queryKey: sampleQueryKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: sampleQueryKeys.lists() });
      toast.success('ลบข้อมูลสำเร็จ');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
};
```

---

## Layer 5: ใช้งานใน Page Component

```tsx
function SamplePage() {
  const [filters, setFilters] = useState<SampleFilters>({});

  // Query — ดึงข้อมูล
  const { data, isLoading, error, refetch } = useSamples(filters, { enabled: true });

  // Mutation — สร้าง/แก้ไข/ลบ
  const createMutation = useCreateSample();
  const updateMutation = useUpdateSample();
  const deleteMutation = useDeleteSample();

  const handleCreate = (formData: CreateSampleDto) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (id: string, formData: UpdateSampleDto) => {
    updateMutation.mutate({ id, data: formData });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <SampleTable data={data} onDelete={handleDelete} />
      <SampleForm onSubmit={handleCreate} isPending={createMutation.isPending} />
    </div>
  );
}
```

---

## File Upload Pattern

กรณี upload file ใช้ FormData แทน JSON:

```ts
// API function
create: async (data: CreateDto | FormData) => {
  const config = data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  return (await apiClient.post('/sample', data, config)).data;
},

// ฝั่ง component
const formData = new FormData();
formData.append('name', values.name);
formData.append('file', values.file[0]);
createMutation.mutate(formData);
```

---

## Cache Invalidation Strategy

| สถานการณ์        | วิธีจัดการ                                           |
| ---------------- | ---------------------------------------------------- |
| สร้างใหม่        | `invalidateQueries(lists)` + `setQueryData(detail)`  |
| แก้ไข            | `setQueryData(detail)` + `invalidateQueries(lists)`  |
| ลบ               | `removeQueries(detail)` + `invalidateQueries(lists)` |
| กระทบหลาย entity | invalidate ทุก entity ที่เกี่ยวข้อง                  |
| Manual refetch   | ปิด `enabled: false` → กด button เรียก `refetch()`   |

---

## Folder Structure สรุป

```
client/tanstackQuery/
├── queryClient.ts         # QueryClient config (staleTime, retry, etc.)
├── api.ts                 # Axios instance + API functions ทุก entity
├── index.ts               # Re-exports ทั้งหมด
├── useApi.ts              # Hooks กลาง (useLogout)
└── use{Entity}Api.ts      # Hooks แต่ละ entity
    ├── query keys factory
    ├── useQuery hooks (GET)
    └── useMutation hooks (POST/PUT/DELETE)
```

## หมายเหตุสำคัญ

- **HTTP client มี 2 ตัว** — Axios ใน `tanstackQuery/api.ts` ใช้สำหรับ business API, Axios อีกตัวใน `client/auth/api.ts` ใช้สำหรับ auth API (คนละ base URL)
- **fetchJson (`client/lib/fetchJson.ts`)** เป็น fetch wrapper อีกตัวที่มีอยู่แต่ hooks ส่วนใหญ่ใช้ Axios ผ่าน `api.ts` — สำหรับ template ควร**เลือกใช้ตัวเดียว** (แนะนำ Axios เพราะ hooks ทั้งหมดใช้อยู่แล้ว)
- **apiMiddleware (`client/lib/apiMiddleware.ts`)** มี logging, retry, timeout สำหรับ fetch — ถ้าใช้ Axios ตัวเดียวสามารถตัดออกได้

---

## สิ่งที่ควรเปลี่ยนสำหรับ Template (v5 Best Practices)

### 1. ใช้ `queryOptions()` helper แทน key factory แยก

โปรเจกต์ปัจจุบันแยก query key factory กับ hook ออกจากกัน → ต้อง sync เอง
v5 มี `queryOptions()` helper ที่รวม key + fn + options ไว้ด้วยกัน **type-safe** ตลอด

```ts
// ❌ ตอนนี้ — key factory แยก, ต้อง match กันเอง
export const sampleQueryKeys = {
  detail: (id: string) => ['samples', 'detail', id] as const,
};
export const useSampleById = (id: string) =>
  useQuery({
    queryKey: sampleQueryKeys.detail(id),
    queryFn: () => sampleApi.getById(id),
  });

// ✅ แนะนำ — queryOptions() รวมทุกอย่าง, reuse ได้ทั้ง hook + prefetch + setQueryData
import { queryOptions } from '@tanstack/react-query';

export const sampleOptions = {
  detail: (id: string) =>
    queryOptions({
      queryKey: ['samples', 'detail', id],
      queryFn: () => sampleApi.getById(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    }),
  list: (filters?: SampleFilters) =>
    queryOptions({
      queryKey: ['samples', 'list', filters],
      queryFn: () => sampleApi.getAll(filters),
      staleTime: 5 * 60 * 1000,
    }),
};

// ใช้ใน hook
export const useSampleById = (id: string) => useQuery(sampleOptions.detail(id));

// ใช้ prefetch (loader / server)
queryClient.prefetchQuery(sampleOptions.detail('123'));

// ใช้ setQueryData — key ตรงกัน 100% เพราะมาจากที่เดียว
queryClient.setQueryData(sampleOptions.detail('123').queryKey, newData);
```

### 2. Optimistic Update แบบง่าย — ใช้ `variables` จาก useMutation

โปรเจกต์ปัจจุบันเขียน `setQueryData` / `setQueriesData` ใน onSuccess เยอะมาก
v5 มีท่าง่ายกว่า — แสดงผล optimistic จาก `mutation.variables` ตรงๆ

```tsx
// ❌ ตอนนี้ — เขียน cache ตรงใน onSuccess (ซับซ้อน, ต้อง merge เอง)
onSuccess: (newItem) => {
  queryClient.setQueriesData({ queryKey: ['samples', 'list'] }, (old) => (old ? [newItem, ...old] : [newItem]));
};

// ✅ แนะนำ — ใช้ variables แสดง optimistic UI ได้เลย
const addMutation = useCreateSample();

return (
  <ul>
    {data?.map((item) => (
      <li key={item.id}>{item.name}</li>
    ))}
    {addMutation.isPending && <li style={{ opacity: 0.5 }}>{addMutation.variables.name}</li>}
  </ul>
);
```

### 3. ตัด HTTP client ให้เหลือตัวเดียว

| ตอนนี้                                                      | Template ควรเป็น                                   |
| ----------------------------------------------------------- | -------------------------------------------------- |
| `tanstackQuery/api.ts` — Axios instance #1 (business API)   | **เก็บไว้** เป็น client หลัก                       |
| `client/auth/api.ts` — Axios instance #2 (auth API)         | **เก็บไว้** เพราะคนละ base URL                     |
| `client/lib/fetchJson.ts` — native fetch wrapper            | **ตัดออก** ซ้ำซ้อน                                 |
| `client/lib/apiMiddleware.ts` — fetch logging/retry/timeout | **ตัดออก** Axios + TanStack Query จัดการ retry เอง |

### 4. retry config ควรอยู่ที่เดียว

retry config ควรกำหนดที่ `queryClient.ts` ที่เดียว, hook ไม่ต้อง override ยกเว้นกรณีพิเศษ

### 5. สรุป Folder Structure หลังปรับ

```
client/tanstackQuery/
├── queryClient.ts         # QueryClient config (retry, staleTime — ที่เดียว)
├── api.ts                 # Axios instance + API functions ทุก entity
├── index.ts               # Re-exports
├── useApi.ts              # Hooks กลาง (useLogout)
└── use{Entity}Api.ts      # แต่ละ entity:
    ├── queryOptions()     # รวม key + fn + options (แทน key factory แยก)
    ├── useQuery hooks     # ใช้ queryOptions() ตรง
    └── useMutation hooks  # invalidate ผ่าน queryOptions().queryKey
```

```
ตัดออก:
├── client/lib/fetchJson.ts       # ซ้ำกับ Axios
├── client/lib/apiMiddleware.ts   # ซ้ำกับ TanStack retry
├── client/lib/logger.ts          # dependency ของ apiMiddleware
```
