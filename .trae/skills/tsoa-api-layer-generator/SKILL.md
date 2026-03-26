---
name: "tsoa-api-layer-generator"
description: "Generates TSOA Controller + Service + Repository (Query/Command regions) for this project. Invoke when creating new APIs or endpoints."
---

# TSOA API Layer Generator (Controller/Service/Repository)

Skill นี้กำหนดมาตรฐานการสร้าง API ของโปรเจกต์นี้ให้เป็น Layered (Controller -> Service -> Repository) และแยกโค้ดเป็น 2 ส่วนชัดเจน:

- Query = SELECT/อ่านข้อมูล
- Command = INSERT/UPDATE/DELETE/งานที่แก้ข้อมูล + transaction

## โครงสร้างไฟล์ที่ใช้

- Controller: `src/controllers/<name>Controller.ts`
- Service: `src/services/<name>Service.ts`
- Repository: `src/repositories/<name>Repository.ts`
- SQLTab (Dev): `src/sqltabs/<APP_ID>_<SQL_NO>.sql`
- Schema Cache: `src/schema/<table>.md`

## Preconditions (บังคับ)

1. Oracle Version = 11g (อย่าใช้ `FETCH FIRST`, `OFFSET`, `JSON_TABLE`)
2. ก่อนเขียน SQL ให้ดู `src/schema/<table>.md`; ถ้าไม่มีให้ใช้ Oracle MCP ดึง schema แล้วสรุปเก็บไว้ (Skill `oracle-schema-cache`)
3. SQL แบบ Native ให้ใช้ SQLTab เป็นหลักผ่าน `queryFromSqlTab`/`commandFromSqlTab` (ดู Skill `oracle-sqltab-generator`)
4. Oracle bind params เท่านั้น (ห้าม concat string) และใช้ pool (ดู Skill `oracle-db-connector`)

## Step-by-step (สร้าง API ใหม่ 1 endpoint)

### Step 1) เตรียม schema cache

- ถ้ายังไม่มี: สร้าง `src/schema/<table>.md` แบบย่อ
- ต้องมีอย่างน้อย: column name, type/len, nullable, pk

### Step 2) เตรียม SQLTab (Dev-first)

- สร้างไฟล์ `src/sqltabs/<APP_ID>_<SQL_NO>.sql` (1 statement ต่อไฟล์)
- ชื่อไฟล์ตัวอย่าง: `99_1.sql`

ตัวอย่าง (Query):

```sql
SELECT USER_ID, USERNAME
FROM USERS
WHERE STATUS = :status
```

ตัวอย่าง (Command):

```sql
UPDATE USERS
SET STATUS = :status
WHERE USER_ID = :userId
```

### Step 3) Repository (แยก Query/Command regions)

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

ข้อกำหนด:

- SQL*NO (เริ่มที่ 1 และเพิ่มทีละ 1) ต้องตรงกับไฟล์ `src/sqltabs/<APP_ID>*<SQL_NO>.sql`ใน dev หรือข้อมูลใน`SQL_TAB_OPPN` ใน prod
- ถ้าต้องทำ Dynamic SQL ให้ใช้ `oracle.getSqlStmt(sqlNo)` แล้ว replace เฉพาะ placeholder (เช่น `/*where*/`) ก่อนส่งเข้า `oracle.query()`

### Step 4) Service (validate ด้วย Zod + map DTO)

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

ข้อกำหนด:

- เพิ่ม/แก้ controller แล้วต้อง `npm run tsoa:gen`
- ห้ามแก้ไฟล์ generated (`src/tsoa/routes.ts`, `src/tsoa/swagger.json`)

## Checklist ตอนจบ

- มี schema cache ใน `src/schema/` สำหรับทุกตารางที่ใช้
- มีไฟล์ sqltab ใน `src/sqltabs/` (Dev) และ/หรือมีแผน insert เข้า `SQL_TAB_OPPN` (Prod)
- Repository แยก `// #region Query` และ `// #region Command`
- Service ใช้ Zod validate input ก่อนเรียก repo
- Controller เป็น TSOA และหลังแก้รัน `npm run tsoa:gen`
