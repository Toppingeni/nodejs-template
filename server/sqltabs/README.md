# SQL Scripts สำหรับ SQL_TAB_OPPN

โฟลเดอร์นี้ใช้สำหรับจัดเก็บ SQL ที่เกี่ยวกับ `KPDBA.SQL_TAB_OPPN`

รูปแบบที่แนะนำ:
- Development: เก็บ “SQL Statement” เป็นไฟล์ชื่อ `<APP_ID>_<SQL_NO>.sql` เพื่อให้ `getSqlStmt()` อ่านไปใช้งานได้ทันทีโดยไม่ต้องรอให้ user อัปเดต DB ก่อน
- Production/Staging: เก็บ SQL จริงในตาราง `KPDBA.SQL_TAB_OPPN` ตามมาตรฐานเดิม

## โครงสร้างตาราง

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

## SQL_TYPE
- `1` = SELECT
- `2` = UPDATE
- `3` = INSERT
- `4` = DELETE

## ตัวอย่างไฟล์ (Development)

ไฟล์: `99_1.sql`

```sql
SELECT USER_ID, USERNAME
FROM USERS
WHERE STATUS = :status
```
