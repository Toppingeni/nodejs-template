# CLAUDE.md (OPPN)

## Backend (Server)

### Tech Stack
- Node.js, TypeScript
- TSOA (OpenAPI + Controllers)
- Oracle 11g Database
- Sequelize ORM
- Zod Validation

### Architecture
**Controller → Service → Repository**
- Controller: Request/response handling, no business logic
- Service: Business logic layer
- Repository: Database access via SQLTab

### Key Patterns
- Extend `BaseController` with `handleSuccess()`/`handleError()`
- Use `asyncErrorWrapper()` for error handling
- Context-aware logger via AsyncLocalStorage
- Oracle DB with bind parameters, never use `FETCH FIRST`/`OFFSET`/`JSON_TABLE`
- SQLTab for query management: `queryFromSqlTab`, `commandFromSqlTab`, `getSqlStmt`

### Commands
- `npm run dev` - Start dev server
- `npm run lint` - Lint code
- `npm run build` - Build (auto-runs TSOA)
- `npm run tsoa:gen` - Regenerate TSOA routes after controller changes

### Important Rules
- NEVER edit generated TSOA files (`src/tsoa/routes.ts`, `src/tsoa/swagger.json`)
- Always use bind parameters for Oracle queries
- Check table schemas in `src/schema/*.md` before writing SQL

### Skills for Details
- `oracle-db-connector` - Oracle connections, queries, stored procedures
- `oracle-schema-cache` - Table schemas and column validation
- `oracle-sqltab-generator` - SQLTab file generation and dynamic queries
- `tsoa-api-layer-generator` - Full API layer patterns
- `logger-system` - Context-aware logging setup

---

## Frontend (Client)

### Tech Stack
- React 18, TypeScript
- Vite
- Tailwind CSS (glassmorphism theme)
- Radix UI (shadcn/ui components)
- React Router DOM
- React Query (data fetching)
- React Hook Form + Zod (forms)
- Lucide React (icons)

### Component Structure
```
client/components/
├── ui/          # shadcn/ui primitives - NEVER modify
├── layout/      # Header, Sidebar, MainLayout
├── shared/      # Reusable components - USE EVERYWHERE
└── pages/       # Page-specific components
```

### Key Patterns
- **Forms**: Always use shared `<Form>` component with React Hook Form + Zod
- **Data**: React Query for fetching, no manual useEffect
- **Validation**: Zod schemas for all forms
- **Styling**: Glassmorphism theme with `backdrop-blur-xl`, gradients, subtle shadows

### Shared Components (Required)
- `Form` - Form wrapper with validation
- `SearchInput` - Search with optional debounce
- `StatusBadge` - Status indicators with config
- `TablePagination` - Pagination for tables
- `EmptyState` - No data state
- `PageLoader` - Loading indicator

### Form Pattern
```typescript
// MUST use this pattern for all forms
import { Form, FormField, FormFieldItem, FormLabel, FormControl, FormMessage } from "@/components/shared/form";

// NEVER use native <form> or raw register()
```

### Styling Conventions
- Backgrounds: `bg-white/70` with `backdrop-blur-xl`
- Borders: `border-slate-200/60`
- Shadows: `shadow-lg shadow-blue-500/30`
- Radius: `rounded-xl` or `rounded-2xl`
- Spacing: `p-4 md:p-6`, `gap-3`
- Buttons: Gradient `from-blue-600 to-indigo-600`

### Commands
- `npm run dev:frontend` - Start frontend dev server
- `npm run lint:client` - Lint client code
- `npm run build:client` - Build client

### DOs & DON'Ts
**DO:**
- Use shared components from `@/components/shared/`
- Follow form pattern with Zod validation
- Use React Query for data fetching
- Use Radix UI primitives
- Use Tailwind classes, no inline styles

**DON'T:**
- DON'T modify shadcn/ui components in `components/ui/`
- DON'T use native `<form>` - use shared `<Form>`
- DON'T create duplicate components - use shared ones
- DON'T use inline styles - use Tailwind
