# Backend Development (OPPN)

## Commands

- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Build:** `npm run build` (tsoa auto-runs)
- **Generate TSOA:** `npm run tsoa:gen`

## Architecture

```
Controller → Service → Repository
```

- **Controller:** No business logic, just request/response handling
- **Service:** Business logic layer
- **Repository:** Database access layer
- **Bootstrap:** Application initialization in `src/bootstrap/`

## Controller Pattern

Extend `BaseController` and use provided utilities:

```typescript
import { BaseController } from "@/controllers/base.controller";
import { asyncErrorWrapper } from "@/utils/async-error-wrapper";

export class MyController extends BaseController {
  private myService = new MyService();

  @Post()
  @SuccessResponse("200", "Success")
  @Response("500", "Error")
  async createItem(
    @Body() body: CreateItemDto
  ): Promise<Response> {
    return asyncErrorWrapper(async () => {
      const result = await this.myService.create(body);
      return this.handleSuccess(result);
    }, this.handleError);
  }
}
```

### Key Methods

- `handleSuccess(data)` - Success response
- `handleError(error)` - Error response
- `asyncErrorWrapper(fn, errorFn)` - Async error handling

## Context & Logger

### Context (`src/utils/context.ts`)
- JWT context management
- Use for request-scoped data

### Logger (`src/utils/logger.ts`)
- Context-aware logging
- See skill: `logger-system` for full setup

## TSOA Rules

- **NEVER edit:** `src/tsoa/routes.ts`, `src/tsoa/swagger.json`
- **After editing controller:** Run `npm run tsoa:gen`
- See skill: `tsoa-api-layer-generator` for full patterns

## Oracle 11g

### Restrictions
- NEVER use `FETCH FIRST`
- NEVER use `OFFSET`
- NEVER use `JSON_TABLE`

### Best Practices
- ALWAYS use bind parameters
- Use connection pool
- See skills:
  - `oracle-db-connector` - Connection, queries, stored procedures
  - `oracle-schema-cache` - Table schemas and validation
  - `oracle-sqltab-generator` - SQLTab files and dynamic queries

### SQLTab Pattern

```typescript
import { queryFromSqlTab, commandFromSqlTab, getSqlStmt } from "@/utils/sqltab";

// Static query
const result = await queryFromSqlTab<Sample>("APP_001", {
  param1: value1,
});

// Dynamic query
const sql = getSqlStmt("APP_002", {
  "/*where*/": "AND status = :status",
});
const result = await queryFromSqlTab<Sample>(sql, {
  status: "A",
});
```

### Development with SQLTab
- `getSqlStmt` reads from `src/sqltabs/<APP_ID>_<SQL_NO>.sql`
- Override `SQLTAB_DIR` for custom paths
- Replace placeholders like `/*where*/` before binding

## Sequelize

### N+1 Warning
- Watch for N+1 queries
- Use `include` and `limit` carefully

```typescript
// BAD - N+1
for (const user of users) {
  const posts = await user.getPosts(); // N queries
}

// GOOD - Eager loading
const users = await User.findAll({
  include: [{ model: Post }],
});
```

## Validation

Use **Zod** for validation:

```typescript
import { z } from "zod";

const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

type CreateItemDto = z.infer<typeof createItemSchema>;
```

## Error Handling

```typescript
// Use asyncErrorWrapper for all async operations
return asyncErrorWrapper(async () => {
  // Business logic
  return result;
}, this.handleError);
```

## Common Patterns

### Repository Pattern

```typescript
export class SampleRepository {
  async findById(id: string): Promise<Sample | null> {
    return queryFromSqlTab<Sample>("APP_003", { id });
  }

  async create(data: CreateSampleDto): Promise<Sample> {
    return commandFromSqlTab("APP_004", data);
  }
}
```

### Service Pattern

```typescript
export class SampleService {
  constructor(private repository: SampleRepository) {}

  async create(data: CreateSampleDto): Promise<Sample> {
    // Business logic here
    return this.repository.create(data);
  }
}
```

## File Structure

```
src/
├── bootstrap/           # App initialization
├── controllers/         # TSOA controllers
├── services/            # Business logic
├── repositories/         # Database access
├── models/              # Sequelize models
├── utils/               # Context, logger, helpers
├── sqltabs/             # SQLTab .sql files
├── tsoa/                # Generated (don't edit)
└── schema/              # Table documentation
```
