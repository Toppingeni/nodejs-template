# Shared Components Reference

All reusable components in `client/components/shared/`. **MUST use these — never recreate.**

## Component Architecture

```
client/components/
├── ui/           # shadcn/ui primitives — NEVER modify
├── layout/       # Header, Sidebar, MainLayout
├── shared/       # Reusable components — USE EVERYWHERE
└── pages/        # Page-specific components
```

---

## Forms

```typescript
import {
    Form,
    FormField,
    FormFieldItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/shared/form";
```

### Rules

- NEVER use native `<form>` tag — always use `<Form>` component
- NEVER use raw `register()` — always use `<FormField>` with `render` prop
- Validation: Zod schema with `zodResolver`
- Error handling: `<FormMessage />` shows validation errors automatically

---

## Search

```typescript
import { SearchInput } from "@/components/shared/search";

<SearchInput
  value={filters.search ?? ""}
  onChange={handleSearchChange}
  placeholder="Search..."
  className="flex-1"
/>
```

---

## Status Badges

```typescript
import { StatusBadge } from "@/components/shared/badge";

// Uses STATUS_CONFIG from constants/status.ts
<StatusBadge status="A" />       // ใช้งาน
<StatusBadge status="D" />       // ลบแล้ว
<StatusBadge status="X" customLabel="Custom" />
```

### Constants

```typescript
// client/constants/status.ts
export const STATUS_CONFIG = {
    A: { label: "ใช้งาน", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    D: { label: "ลบแล้ว", className: "bg-red-50 text-red-700 ring-red-600/20" },
};

// ALWAYS use getStatusConfig() for new statuses
import { getStatusConfig } from "@/constants/status";
```

---

## Table Pagination

```typescript
import { TablePagination } from "@/components/shared/table";

<TablePagination
  currentPage={pageIndex}
  totalPages={totalPages}
  totalItems={data.length}
  pageSize={pageSize}
  onPageChange={setPage}
/>
```

---

## Empty State

```typescript
import { EmptyState } from "@/components/shared/table";

<EmptyState
  title="No data found"
  description="Try adjusting filters"
  action={<Button onClick={onCreate}>Create</Button>}
/>
```

---

## Loading

```typescript
import { PageLoader } from "@/components/shared/loading";

{isLoading ? <PageLoader /> : <Content />}
```

---

## Custom Hooks

```typescript
import { useDebounce, useLocalStorage, useIsMobile } from "@/hooks";

const debouncedSearch = useDebounce(searchValue, 300);
const [theme, setTheme] = useLocalStorage("theme", "light");
const isMobile = useIsMobile();
```
