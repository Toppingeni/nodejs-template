# Trae Rules (OPPN)

- Run: dev `npm run dev`; lint `npm run lint`; build `npm run build` (tsoa auto)
- TSOA: ห้ามแก้ `src/tsoa/routes.ts`, `src/tsoa/swagger.json`; แก้ controller รัน `npm run tsoa:gen`
- Architecture: Controller->Service->Repo; ห้าม biz logic ใน Controller; DB ผ่าน Repo เท่านั้น; bootstrap อยู่ `src/bootstrap/`
- Coding: extend `BaseController` + `handleSuccess()`/`handleError()`; async wrap `asyncErrorWrapper()`; context `src/utils/context.ts`; ห้าม `console.log()` ใช้ `src/utils/logger.ts`; validate ด้วย Zod
- Oracle: bind params เท่านั้น; ใช้ connection pool; อ่าน Skill `oracle-db-connector`
- SQLTab: ใช้ `queryFromSqlTab`/`commandFromSqlTab`; Dynamic ใช้ `getSqlStmt` + replace placeholder (เช่น `/*where*/`) และส่งค่าผ่าน bind; อ่าน Skill `oracle-sqltab-generator`
- Dev `getSqlStmt`: อ่าน `src/sqltabs/<APP_ID>_<SQL_NO>.sql` ก่อน; override `SQLTAB_DIR`; เก็บ scripts ใน `src/sqltabs/`
- Sequelize: ระวัง N+1; ใช้ `limit`/`include` เท่าที่จำเป็น
