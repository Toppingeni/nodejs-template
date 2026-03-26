# Trae Rules (OPPN)

- Run: dev `npm run dev`; lint `npm run lint`; build `npm run build` (tsoa auto)
- TSOA: ห้ามแก้ `src/tsoa/routes.ts`, `src/tsoa/swagger.json`; แก้ controller รัน `npm run tsoa:gen`
- Architecture: C->S->Repo; ห้าม biz logic ใน C; DB ผ่าน Repo; bootstrap `src/bootstrap/`
- Coding: extend `BaseController` + `handleSuccess()`/`handleError()`; async `asyncErrorWrapper()`; context `src/utils/context.ts`; ใช้ `src/utils/logger.ts`; validate ด้วย Zod
- Oracle 11g: ห้ามใช้ syntax ใหม่เกิน (เช่น `FETCH FIRST`, `OFFSET`, `JSON_TABLE`)
- Oracle: bind params เท่านั้น; ใช้ pool; อ่าน Skill `oracle-db-connector`
- SQLTab: ใช้ `queryFromSqlTab`/`commandFromSqlTab`; Dynamic ใช้ `getSqlStmt` + replace placeholder (เช่น `/*where*/`) และส่งค่าผ่าน bind; อ่าน Skill `oracle-sqltab-generator`
- Dev `getSqlStmt`: อ่าน `src/sqltabs/<APP_ID>_<SQL_NO>.sql` ก่อน; override `SQLTAB_DIR`
- Sequelize: ระวัง N+1; ใช้ `limit`/`include` เท่าที่จำเป็น
