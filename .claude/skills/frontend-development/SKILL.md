# Frontend Development (OPPN)

## Commands

- **Dev:** `npm run dev:frontend`
- **Lint:** `npm run lint:client`
- **Build:** `npm run build:client`

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI (shadcn/ui)
- React Router DOM
- React Query
- React Hook Form
- Zod

## Component Architecture

```
client/components/
├── ui/           # shadcn/ui primitives - NEVER modify
├── layout/       # Header, Sidebar, MainLayout
├── shared/       # Reusable components - USE EVERYWHERE
└── pages/        # Page-specific components
```

## Styling Conventions

### Glassmorphism Theme
- Backgrounds: `bg-white/70` with `backdrop-blur-xl`
- Borders: `border-slate-200/60` (subtle)
- Shadows: `shadow-lg shadow-blue-500/30` (colored)
- Radius: `rounded-xl` or `rounded-2xl`

### Common Patterns
- Spacing: `p-4 md:p-6`, `gap-3`
- Buttons: `rounded-xl` with gradient `from-blue-600 to-indigo-600`
- Tables: `rounded-2xl bg-white/70 shadow-sm backdrop-blur-xl`

## Shared Components (MUST USE)

```typescript
// Forms
import { Form, FormField, FormFieldItem, FormLabel, FormControl, FormMessage } from "@/components/shared/form";

// Search
import { SearchInput } from "@/components/shared/search";

// Badges
import { StatusBadge } from "@/components/shared/badge";

// Table
import { TablePagination, EmptyState } from "@/components/shared/table";

// Loading
import { PageLoader } from "@/components/shared/loading";
```

## Form Pattern (React Hook Form + FormProvider)

ALL forms MUST use this pattern:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormFieldItem, FormLabel, FormControl, FormMessage } from "@/components/shared/form";

const schema = z.object({
  name: z.string().min(1, "Required message"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function MyForm({ initialData, onSubmit, onCancel }: FormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialData?.name ?? "", description: initialData?.description ?? "" },
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormFieldItem>
            <FormLabel required>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter name" {...field} />
            </FormControl>
            <FormMessage />
          </FormFieldItem>
        )}
      />
    </Form>
  );
}
```

### Form Rules

- NEVER use native `<form>` tag - always use `<Form>` component
- NEVER use raw `register()` - always use `<FormField>` with `render` prop
- Validation: Zod schema with `zodResolver`
- Error handling: `<FormMessage />` shows validation errors automatically

## Status Badges

```typescript
import { StatusBadge } from "@/components/shared/badge";

// Uses STATUS_CONFIG from constants/status.ts
<StatusBadge status="A" />  // ใช้งาน
<StatusBadge status="D" />  // ลบแล้ว
<StatusBadge status="X" customLabel="Custom" />  // Custom label
```

## Tables

### Pagination

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

### Empty State

```typescript
import { EmptyState } from "@/components/shared/table";

<EmptyState
  title="No data found"
  description="Try adjusting filters"
  action={<Button onClick={onCreate}>Create</Button>}
/>
```

## Search & Filters

```typescript
import { SearchInput } from "@/components/shared/search";
import { useDebounce } from "@/hooks";

function MyFilters({ filters, onChange }: FiltersProps) {
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value || undefined });
  };

  // Optional: Debounce for large datasets/API calls
  const debouncedSearch = useDebounce(filters.search, 300);

  return (
    <SearchInput
      value={filters.search ?? ""}
      onChange={handleSearchChange}
      placeholder="Search..."
      className="flex-1"
    />
  );
}
```

## Constants

```typescript
// client/constants/status.ts
export const STATUS_CONFIG = {
  A: { label: "ใช้งาน", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  D: { label: "ลบแล้ว", className: "bg-red-50 text-red-700 ring-red-600/20" },
  // Add more statuses here
};

// ALWAYS use getStatusConfig() for new statuses
import { getStatusConfig } from "@/constants/status";
```

## Custom Hooks

```typescript
import { useDebounce, useLocalStorage, useIsMobile } from "@/hooks";

// Debounce search/filter values
const debouncedSearch = useDebounce(searchValue, 300);

// Local storage with type safety
const [theme, setTheme] = useLocalStorage("theme", "light");

// Mobile detection
const isMobile = useIsMobile();
```

## Page Structure

```typescript
// pages/sample/SamplePage.tsx
export function SamplePage() {
  const [filters, setFilters] = useState<Filters>({});
  const [editItem, setEditItem] = useState<Sample | null>(null);

  const { data, isLoading } = useSamples(filters);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Title</h1>
          <p className="text-sm text-muted-foreground">Description</p>
        </div>
        <ActionButtons />
      </div>

      {/* Filters */}
      <Filters filters={filters} onChange={setFilters} />

      {/* Content */}
      {isLoading ? <PageLoader /> : <Content />}
    </div>
  );
}
```

## DOs

- Use shared components from `@/components/shared/`
- Follow form pattern with FormProvider
- Use Zod for validation
- Use React Query for data fetching
- Use Radix UI primitives (Dialog, Sheet, Dropdown, etc.)
- Use Lucide React for icons
- Use Tailwind classes, never inline styles

## DON'Ts

- DON'T create duplicate components - use shared ones
- DON'T use native `<form>` - use `<Form>` component
- DON'T write custom search inputs - use `<SearchInput>`
- DON'T write custom badges - use `<StatusBadge>`
- DON'T write custom pagination - use `<TablePagination>`
- DON'T write custom loading states - use `<PageLoader>`
- DON'T modify shadcn/ui components in `components/ui/`
- DON'T use inline styles - use Tailwind classes
