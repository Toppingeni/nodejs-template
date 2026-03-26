---
name: "oracle-sqltab-generator"
description: "Generates sqltab .sql files and optional INSERT scripts for KPDBA.SQL_TAB_OPPN, and explains queryFromSqlTab/commandFromSqlTab/getSqlStmt. Invoke when generating queries or adding DB operations."
---

# Oracle SQL_TAB_OPPN Generator & Usage

**Description:** แนวทางการสร้างและจัดการ SQL Query โดยเก็บและเรียกใช้งานผ่านตาราง `KPDBA.SQL_TAB_OPPN`

โปรเจกต์นี้มีมาตรฐานในการเก็บ Raw SQL Statement ไว้ใน Database แทนที่จะ Hardcode ไว้ใน Source Code
โดยเราจะเรียกใช้งานผ่านฟังก์ชันที่มีเตรียมไว้ให้ใน `src/libs/oracle/index.ts`

---

## 1. โครงสร้างตาราง SQL_TAB_OPPN

เมื่อคุณสร้าง Query ใหม่ คุณจะต้องสร้างไฟล์ `.sql` ไปเก็บไว้ในโฟลเดอร์ `src/sqltabs/` โครงสร้างตารางมีดังนี้:

```sql
CREATE TABLE KPDBA.SQL_TAB_OPPN
(
  APP_ID         NUMBER(5)                      NOT NULL,
  SQL_NO         NUMBER(5)                      NOT NULL,
  SQL_TYPE       NUMBER(5)                      NOT NULL,
  SQL_DESC       VARCHAR2(1000 BYTE),
  SQL_STMT       CLOB,
  DB_CONNECTION  VARCHAR2(50 BYTE)              DEFAULT 'OPP',
  REVISION       NUMBER                         DEFAULT 0                     NOT NULL
)
```

**คำอธิบายคอลัมน์สำคัญ:**

- `APP_ID`: หมายเลขแอปพลิเคชัน (ดูได้จากตัวแปรแวดล้อม `.env`)
- `SQL_NO`: ลำดับของ SQL (AI ต้องช่วยรันลำดับหรือให้ผู้ใช้ระบุ)
- `SQL_TYPE`: ประเภทคำสั่ง SQL
    - `1` = SELECT
    - `2` = UPDATE
    - `3` = INSERT
    - `4` = DELETE
- `SQL_STMT`: คำสั่ง SQL ของจริงที่สามารถมี Bind Parameter (`:param`)

### 1.1 Development: เก็บ SQL Statement เป็นไฟล์ (เร็ว ไม่ต้องรออัปเดต DB)

ชื่อไฟล์: `<APP_ID>_<SQL_NO>.sql` เช่น `99_1.sql`

เนื้อหาไฟล์เป็น SQL statement เพียงอย่างเดียว (รองรับ bind `:param`) แนะนำให้ใส่ 1 statement ต่อ 1 ไฟล์

```sql
SELECT *
FROM USERS
WHERE STATUS = :status
```

ข้อกำหนดการใช้งาน:

- โค้ดฝั่ง Node.js จะเรียก `getSqlStmt(sqlNo)` ตามเดิม แต่ใน dev จะอ่านจากไฟล์ถ้ามี
- สามารถ override path ได้ด้วย env `SQLTAB_DIR` (ถ้าตั้งไว้)
- ถ้าไฟล์ลงท้ายด้วย `;` ระบบจะตัด `;` ทิ้งให้อัตโนมัติ

### 1.2 Production/Staging: สร้างสคริปต์ INSERT ลง `SQL_TAB_OPPN`

```sql
INSERT INTO KPDBA.SQL_TAB_OPPN (APP_ID, SQL_NO, SQL_TYPE, SQL_DESC, SQL_STMT, DB_CONNECTION, REVISION)
VALUES (
  99, -- สมมติ APP_ID คือ 99
  1, -- ลำดับ SQL_NO
  1, -- 1 = SELECT
  'Get active users by role',
  'SELECT * FROM USERS WHERE STATUS = ''ACTIVE'' AND ROLE_ID = :roleId',
  'OPP',
  0
);
COMMIT;
```

---

## 2. การเรียกใช้งานใน Source Code (TypeScript)

### 2.1 การเรียกใช้งานแบบตรงตัว (ไม่ต้องแก้ String)

หาก Query ของคุณเขียนเงื่อนไขไว้ครบถ้วนและต้องการเพียงส่ง Bind Parameter สามารถใช้ `queryFromSqlTab` หรือ `commandFromSqlTab` ได้เลย

```typescript
import { oracle } from "../../libs/oracle";

// กรณีดึงข้อมูล (SELECT)
export const getUsersByRole = async (roleId: number) => {
    // 1 คือ SQL_NO
    const result = await oracle.queryFromSqlTab<any>(1, { roleId });
    return result;
};

// กรณีแก้ไข/เพิ่มข้อมูล (UPDATE/INSERT/DELETE)
export const deleteUser = async (userId: number) => {
    // 2 คือ SQL_NO สำหรับคำสั่ง DELETE
    const result = await oracle.commandFromSqlTab(2, { userId });
    return result.rowsAffected;
};
```

### 2.2 การเรียกใช้งานแบบแก้ไขโครงสร้าง Query (Dynamic Query)

หากจำเป็นต้องปรับเปลี่ยนโครงสร้าง Query ก่อนรัน (เช่น เติมเงื่อนไข `WHERE` หรือ `ORDER BY` แบบไดนามิก) ให้ใช้ `getSqlStmt` เพื่อดึง Query ออกมาเป็น String (CLOB จะถูกแปลงให้) ทำการ Replace String แล้วค่อยส่งให้ฟังก์ชัน `.query()` หรือ `.command()` รันตามปกติ

ตัวอย่างสคริปต์ SQL ในตาราง:

```sql
-- SQL_STMT:
-- SELECT * FROM USERS /*where*/ ORDER BY CREATED_AT DESC
```

ตัวอย่างโค้ด:

```typescript
import { oracle } from "../../libs/oracle";

export const getUsersDynamic = async (status?: string) => {
    // 1. ดึง SQL Template ออกมาจาก SQL_TAB_OPPN
    let sql = await oracle.getSqlStmt(3);

    const params: any = {};
    let whereClause = "";

    // 2. จัดการเงื่อนไขแบบไดนามิก
    if (status) {
        whereClause = "WHERE STATUS = :status";
        params.status = status;
    }

    // 3. Replace String (เอา /*where*/ ออกแล้วใส่เงื่อนไขแทน)
    sql = sql.replace("/*where*/", whereClause);

    // 4. รัน Query ปกติ
    const result = await oracle.query<any>(sql, params);
    return result;
};
```

---

## 💡 สิ่งที่ AI ต้องทำเสมอเมื่อถูกสั่งให้สร้าง Query

1. ตรวจ `src/schema/<table>.md` ก่อนเสมอ ถ้าไม่มีให้ใช้ Oracle MCP ดึง schema แล้วสรุปเก็บไว้ (ดู Skill `oracle-schema-cache`)
2. ระบุ `APP_ID` และ `SQL_NO` ให้ชัดเจนก่อนสร้างไฟล์ sqltab (ห้ามเดา)
    - หา `APP_ID` ตามลำดับนี้:
        - ดูจาก config (`config.APP_ID`) และไฟล์ env ของโปรเจกต์ (เช่น `.env`, `.env.<NODE_ENV>`, `.env.sample`)
        - ถ้ายังไม่เจอ/ไม่มั่นใจ ให้ถามผู้ใช้ทันทีว่า `APP_ID` คืออะไร
    - หา `SQL_NO` ตามลำดับนี้:
        - ถ้ามีไฟล์ใน `src/sqltabs/` ของ `APP_ID` เดียวกัน ให้เลือกเลขถัดไปที่ “ยังไม่ถูกใช้” (เช่นดูจากชื่อไฟล์ `<APP_ID>_<SQL_NO>.sql`)
        - ถ้าเชื่อม DB ได้ ให้ใช้ Oracle MCP query หา `MAX(SQL_NO)` ของ `KPDBA.SQL_TAB_OPPN` ตาม `APP_ID` แล้วเลือกเลขถัดไป (max + 1)
            - ตัวอย่าง SQL:
                ```sql
                SELECT NVL(MAX(sql_no), 0) AS MAX_SQL_NO
                FROM KPDBA.SQL_TAB_OPPN
                WHERE app_id = :appId
                ```
        - โปรเจกต์นี้กำหนดให้ `SQL_NO` เริ่มที่ `1` และเพิ่มทีละ `1` (ต่อ `APP_ID`)
        - ถ้ายังไม่มั่นใจ ให้ถามผู้ใช้ทันทีว่า “SQL_NO ของงานนี้ให้ใช้เลขไหน” (ห้ามเดา)
    - ชุดคำถามที่ต้องถามเมื่อข้อมูลไม่พอ:
        - `APP_ID ของระบบนี้คืออะไร?`
        - `SQL_NO ของงานนี้ให้ใช้เลขไหน?`
3. สร้างไฟล์ SQL สำหรับ Dev ที่ `src/sqltabs/<APP_ID>_<SQL_NO>.sql` โดยใส่ “SQL statement” (ไม่ต้องมี INSERT/COMMIT)
4. ถ้าผู้ใช้ต้องการนำไปอัปเดต DB (Prod/Staging) ให้สร้างไฟล์ “สคริปต์ INSERT” เพิ่มอีกไฟล์ (เช่น `src/sqltabs/<APP_ID>_<SQL_NO>__insert.sql`) ที่มี `INSERT INTO KPDBA.SQL_TAB_OPPN ...; COMMIT;`
5. เขียนโค้ดใน Repository/Service ฝั่ง Node.js โดยเรียกใช้งาน `oracle.queryFromSqlTab`, `oracle.commandFromSqlTab` หรือ `oracle.getSqlStmt` อย่างถูกต้อง
6. ห้ามต่อ String SQL ตรงๆ ในโค้ด ให้ Replace เฉพาะโครงสร้าง (เช่น `/*where*/`) แต่ Data ต้องส่งผ่าน Bind Parameters เสมอ
7. ถ้าเป็น Query แบบ Dynamic ให้ใส่ placeholder ใน SQL เช่น `/*where*/`, `/*orderBy*/` แล้วให้โค้ด TypeScript เป็นคน replace
