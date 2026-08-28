# PROMPT.md - คู่มือสั่งงาน AI สำหรับโปรเจกต์ OPPN

คู่มือนี้รวบรวมตัวอย่าง prompt สำหรับสั่งงาน Claude Code ในโปรเจกต์นี้
เรามี **skills** และ **subagents** หลายตัว — ไม่ต้องจำชื่อ agent, แค่สั่งด้วยภาษาธรรมชาติก็ได้ Claude จะเลือก skill/agent ให้เอง

---

## สารบัญ

1. [เข้าใจระบบ Agent/Skill ก่อน](#1-เข้าใจระบบ)
2. [Backend อย่างเดียว](#2-backend-อย่างเดียว)
3. [งานเล็กๆ (bug fix, แก้ไขนิดหน่อย)](#3-งานเล็กๆ)
4. [Database / Schema](#4-database--schema)
5. [Refactoring](#5-refactoring)
6. [Tips & Tricks](#6-tips--tricks)

---

## 1. เข้าใจระบบ

### Skills (เรียกด้วย `/skill-name`)

| Skill                       | ทำอะไร                                           |
| --------------------------- | ------------------------------------------------ |
| `/backend-development`      | Orchestrate สร้าง API ครบ loop                   |
| `/oracle-schema-cache`      | เช็ค/สร้าง schema cache ก่อนเขียน SQL            |
| `/oracle-sqltab-generator`  | สร้างไฟล์ SQLTab                                 |
| `/tsoa-api-layer-generator` | Step-by-step สร้าง Controller+Service+Repository |
| `/oracle-db-connector`      | Pattern การเชื่อม Oracle DB                      |
| `/create-table`             | สร้าง CREATE TABLE + GRANT + SYNONYM             |
| `/refactor`                 | Refactor code ตามหลัก Martin Fowler              |

### Subagents (Claude เรียกเอง ไม่ต้องสั่งตรง)

| Agent                  | บทบาท                                              |
| ---------------------- | -------------------------------------------------- |
| `erp-manufacturing-pm` | **PM / หัวหน้าทีม** — วางแผน, แบ่งงาน, เลือก agent |
| `backend-builder`      | เขียน Controller + Service + Repository + SQLTab   |
| `code-reviewer`        | Review code อัตโนมัติหลัง build เสร็จ              |

### Flow ทั่วไป

```
คุณสั่ง prompt
    ↓
Claude เลือก skill/agent ที่เหมาะสม
    ↓
Agent ทำงาน → ส่งผลกลับ → Claude สรุปให้คุณ
    ↓
ถ้ามี code-reviewer จะ review อัตโนมัติ
```

---

## 2. Backend อย่างเดียว

### สร้าง API ใหม่

```
สร้าง API สำหรับดึงข้อมูลพนักงาน จากตาราง EMPLOYEE
- GET /api/employees — รายการ (filter ชื่อ, แผนก)
- GET /api/employees/:id — ตัวเดียว
- POST /api/employees — เพิ่มใหม่
```

### เพิ่ม endpoint ใน controller ที่มีอยู่

```
เพิ่ม endpoint DELETE /api/employees/:id ใน employeeController
soft delete โดยเปลี่ยน STATUS เป็น 'D'
```

### สร้าง stored procedure call

```
สร้าง API ที่เรียก stored procedure SP_CALC_PRODUCTION
รับ parameter: PROD_DATE, LINE_NO
return ผลลัพธ์เป็น JSON
```

---

## 3. งานเล็กๆ

### Bug fix

```
หน้า /sample กดปุ่ม "บันทึก" แล้ว form ไม่ submit
ช่วยดูหน่อย
```

---

## 4. Database / Schema

### สร้างตารางใหม่

```
/create-table

สร้างตาราง MACHINE_DOWNTIME:
- DOWNTIME_ID NUMBER PK
- MACHINE_NO VARCHAR2(20)
- START_TIME DATE
- END_TIME DATE
- REASON VARCHAR2(200)
- STATUS VARCHAR2(1) DEFAULT 'A'
- CREATED_BY VARCHAR2(50)
- CREATED_DATE DATE DEFAULT SYSDATE
```

### เช็ค schema ตารางที่มีอยู่

```
/oracle-schema-cache

เช็ค schema ตาราง EMPLOYEE ให้หน่อย ต้องใช้เขียน query
```

### สร้าง SQLTab

```
/oracle-sqltab-generator

สร้าง SQLTab สำหรับ query:
- SELECT ข้อมูลจาก MACHINE_DOWNTIME filter ด้วย MACHINE_NO และช่วงวันที่
- INSERT บันทึก downtime ใหม่
```

---

## 5. Refactoring

```
/refactor

refactor ไฟล์ server/services/employeeService.ts
- method processEmployee ยาวเกิน 100 บรรทัด
- มี duplicate logic ในการ validate
```

---

## 6. Tips & Tricks

### Tip 1: ยิ่งให้ context เยอะ ยิ่งได้ผลดี

```
# แบบนี้ — ได้ผลทั่วไป
สร้าง API CRUD

# แบบนี้ — ได้ผลตรงใจกว่า
สร้าง API "จัดการรายการสินค้า" CRUD:
- ตาราง: PRODUCT (PRODUCT_CODE, PRODUCT_NAME, UNIT, PRICE, STATUS)
- GET ต้องมี search, filter status, pagination
- DELETE เป็น soft delete (STATUS='D')
```

### Tip 2: บอกขอบเขตชัดเจน

```
# ต้องการแค่ backend
สร้าง API สำหรับ ... เฉพาะ Repository ยังไม่ต้องทำ Controller

# ต้องการแค่แผน
วางแผนฟีเจอร์ ... ยังไม่ต้องเริ่มเขียน
```

### Tip 3: อ้างอิงไฟล์ที่มีอยู่

```
ดูไฟล์ server/controllers/sampleController.ts แล้วสร้าง employeeController
ตาม pattern เดียวกัน
```

### Tip 4: ให้ review ก่อน commit

```
review code ที่เพิ่งสร้างมาทั้งหมด ก่อน commit
```

### Tip 5: ใช้ภาษาไทยได้เลย

Claude เข้าใจทั้งไทยและอังกฤษ สั่งภาษาไทยได้เลย:

```
สร้างหน้าจัดการพนักงานให้หน่อย มีตาราง มี form เพิ่ม/แก้ไข
เชื่อม API GET/POST /api/employees
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    คุณพิมพ์ prompt                     │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Claude วิเคราะห์ว่า    │
          │   ต้องทำอะไร            │
          └────────────┬────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
  ┌─────────┐   ┌───────────┐   ┌─────────┐
  │ งานเล็ก  │   │ งานกลาง   │   │ งานใหญ่  │
  │ ทำเอง   │   │ เรียก     │   │ เรียก PM │
  │         │   │ skill     │   │ agent    │
  └────┬────┘   └─────┬─────┘   └────┬────┘
       │              │              │
       │         เรียก agent    วางแผน + แบ่งงาน
       │         ที่เหมาะสม         │
       │              │             ▼
       │              │          backend
       │              │          builder
       │              │             │
       │              │        code-reviewer
       │              │             │
       ▼              ▼             ▼
  ┌─────────────────────────────────────────┐
  │          สรุปผลให้คุณ                     │
  └─────────────────────────────────────────┘
```

---

## ตัวอย่าง Prompt พร้อมใช้ (Copy & Paste)

### ตัวอย่าง: รายงานสรุป

```
สร้าง API สำหรับรายงานสรุปการผลิตรายเดือน:
- GET /api/reports/monthly-production
- query parameter: month (YYYY-MM), line_no (optional)
- ดึงจากตาราง PROD_RECORD group by PRODUCT_CODE
- return: productCode, productName, totalQty, avgQty, days
```
