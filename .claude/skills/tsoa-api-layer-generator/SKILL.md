---
name: "tsoa-api-layer-generator"
description: "Generates TSOA Controller + Service + Repository (Query/Command regions) for this project. Invoke when creating new APIs or endpoints."
---

# TSOA API Layer Generator (Controller/Service/Repository)

Defines the standard for creating layered APIs (Controller -> Service -> Repository), split into two clear regions:

- **Query** = SELECT / read operations
- **Command** = INSERT/UPDATE/DELETE / write operations + transaction

## File Structure

- Controller: `src/controllers/<name>Controller.ts`
- Service: `src/services/<name>Service.ts`
- Repository: `src/repositories/<name>Repository.ts`
- SQLTab (Dev): `src/sqltabs/<APP_ID>_<SQL_NO>.sql`
- Schema Cache: `src/schema/<table>.md`

## Preconditions (mandatory)

1. Oracle 11g — never use `FETCH FIRST`, `OFFSET`, `JSON_TABLE`
2. Before writing SQL, check `src/schema/<table>.md`; if missing, fetch via Oracle MCP and save (Skill `oracle-schema-cache`)
3. Use SQLTab for native SQL via `queryFromSqlTab`/`commandFromSqlTab` (Skill `oracle-sqltab-generator`)
4. Bind params only (never concat strings); use pool (Skill `oracle-db-connector`)

## Step-by-step (create 1 new endpoint)

### Step 0) Confirm APP_ID + Controller Glob

- Dev SQLTab reads from `<APP_ID>_<SQL_NO>.sql`; `APP_ID` comes from env (`config.APP_ID`)
- If `APP_ID` is unknown, ask the user immediately (never guess)
- If `SQL_NO` starting number is unknown, ask the user immediately (never guess)
- Ensure `tsoa.json` `controllerPathGlobs` matches controller filenames (e.g. `*controller.ts` or `*Controller.ts`)

### Step 1) Prepare schema cache

- If missing: create `src/schema/<table>.md` (compact format)
- Must include: column name, type/len, nullable, pk

### Step 2) Prepare SQLTab (Dev-first)

- Create `src/sqltabs/<APP_ID>_<SQL_NO>.sql` (1 statement per file)
- Example filename: `99_1.sql`
- Before assigning `<SQL_NO>`, check existing files in `src/sqltabs/` for the same `<APP_ID>` to avoid collisions (if unable to check, ask the user)

Query example:

```sql
SELECT USER_ID, USERNAME
FROM USERS
WHERE STATUS = :status
```

Command example:

```sql
UPDATE USERS
SET STATUS = :status
WHERE USER_ID = :userId
```

### Step 3) Repository (separate Query/Command regions)

Template:

```ts
import { getOracle } from "../libs/oracle";

export type UserRow = {
  USER_ID: number;
  USERNAME: string;
};

class UsersRepository {
  // #region Query
  async getUsersByStatus(status: string) {
    const oracle = getOracle();
    return oracle.queryFromSqlTab<UserRow>(1, { status });
  }
  // #endregion

  // #region Command
  async updateUserStatus(userId: number, status: string) {
    const oracle = getOracle();
    return oracle.commandFromSqlTab(2, { userId, status });
  }
  // #endregion
}

export default new UsersRepository();
```

Rules:

- SQL*NO (starts at 1, increments by 1) must match `src/sqltabs/<APP_ID>*<SQL_NO>.sql`in dev or`SQL_TAB_OPPN` in prod
- For dynamic SQL, use `oracle.getSqlStmt(sqlNo)` then replace only placeholders (e.g. `/*where*/`) before passing to `oracle.query()`

### Step 4) Service (validate with Zod + map DTO)

Template:

```ts
import { z } from "zod";
import usersRepository from "../repositories/usersRepository";

const GetUsersInputSchema = z.object({
  status: z.string().min(1),
});

export class UsersService {
  constructor(private readonly repo: typeof usersRepository) {}

  // #region Query
  async getUsers(input: unknown) {
    const { status } = GetUsersInputSchema.parse(input);
    const rows = await this.repo.getUsersByStatus(status);
    return rows;
  }
  // #endregion

  // #region Command
  async updateStatus(input: unknown) {
    const schema = z.object({
      userId: z.coerce.number().int().positive(),
      status: z.string().min(1),
    });
    const { userId, status } = schema.parse(input);
    const result = await this.repo.updateUserStatus(userId, status);
    return { rowsAffected: result.rowsAffected ?? 0 };
  }
  // #endregion
}

export default new UsersService(usersRepository);
```

### Step 5) Controller (TSOA)

Template:

```ts
import { Body, Controller, Get, Patch, Route, Tags } from "tsoa";
import usersService from "../services/usersService";

type GetUsersRequest = { status: string };
type UserDto = { userId: number; username: string };
type GetUsersResponse = { message: string; data: UserDto[] };

type UpdateStatusRequest = { userId: number; status: string };
type UpdateStatusResponse = { message: string; rowsAffected: number };

@Route("users")
@Tags("Users")
export class UsersController extends Controller {
  @Get("/")
  public async getUsers(): Promise<GetUsersResponse> {
    const rows = await usersService.getUsers({ status: "ACTIVE" });
    const data = rows.map((r) => ({
      userId: r.USER_ID,
      username: r.USERNAME,
    }));
    return { message: "Success", data };
  }

  @Patch("/status")
  public async updateStatus(
    @Body() body: UpdateStatusRequest,
  ): Promise<UpdateStatusResponse> {
    const result = await usersService.updateStatus(body);
    return { message: "Success", rowsAffected: result.rowsAffected };
  }
}
```

Rules:

- After adding/editing a controller, run `npm run tsoa:gen`
- Never edit generated files (`src/tsoa/routes.ts`, `src/tsoa/swagger.json`)

## Final Checklist

- Schema cache exists in `src/schema/` for all used tables
- SQLTab files exist in `src/sqltabs/` (Dev) and/or INSERT plan for `SQL_TAB_OPPN` (Prod)
- Repository uses `// #region Query` and `// #region Command`
- Service validates input with Zod before calling repo
- Controller is TSOA; ran `npm run tsoa:gen` after changes
