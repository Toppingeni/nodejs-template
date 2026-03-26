---
name: "oracle-schema-cache"
description: "Caches compact Oracle table schemas locally to reduce token and MCP calls. Invoke when generating SQL, verifying column names/types, or onboarding a new table."
---

# Oracle Schema Cache

เก็บ schema ของตารางแบบ “สรุปสั้น” ไว้ใน repo เพื่อประหยัด token และลดการเรียก Oracle MCP ซ้ำ ๆ เวลาคิด/เขียน query

## โฟลเดอร์ที่ใช้

- เก็บไฟล์ schema ไว้ที่ `src/schema/`
- 1 ตาราง = 1 ไฟล์
- ชื่อไฟล์แนะนำ: `<table>.md` (ตัวพิมพ์เล็ก) เช่น `users.md`

## Format (เน้นประหยัด token)

ให้ใช้รูปแบบ “บรรทัดเดียวต่อคอลัมน์” และสรุปเฉพาะที่จำเป็น:

```text
columns:
- COL_NAME DATA_TYPE(LEN|PREC,SCALE) [PK] [NN] [NULL]
```

ตัวอย่าง:

```text
columns:
- USER_ID NUMBER(10) PK NN
- USERNAME VARCHAR2(50) NN
- STATUS VARCHAR2(10) NN
- CREATED_AT DATE NULL
```

คำย่อที่ใช้:

- `PK` = primary key
- `NN` = not null
- `NULL` = nullable

## Workflow เวลาสร้าง/เขียน Query (บังคับใช้)

1. ก่อนคิด SQL ให้ตรวจ `src/schema/<table>.md` ก่อนเสมอ
2. ถ้าไม่มีไฟล์ schema หรือข้อมูลไม่ครบ ให้ดึง schema ด้วย Oracle MCP แล้ว “สรุป” ลงไฟล์ schema ตาม format ข้างบน
3. ตอนเขียน SQL:
    - ตรวจชื่อคอลัมน์/ตารางให้ตรง schema 100%
    - ตรวจชนิด/ความยาวข้อมูล (เช่น VARCHAR2(50)) เพื่อกันใส่ค่าที่เกิน/ผิด type
    - Bind params เสมอ ห้าม concat string
4. ถ้ามีการเพิ่ม/แก้คอลัมน์ใน DB ให้รีเฟรชไฟล์ schema ของตารางนั้นทันที

## เชื่อมกับ SQLTab (แนะนำ)

ถ้ากำลังสร้าง SQLTab:

- เช็ค schema ก่อน
- แล้วค่อยสร้างไฟล์ `src/sqltabs/<APP_ID>_<SQL_NO>.sql` หรือสคริปต์ insert ตาม skill `oracle-sqltab-generator`
