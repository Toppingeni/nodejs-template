# PROMPT.md - คู่มือสั่งงาน AI สำหรับโปรเจกต์ OPPN

คู่มือนี้รวบรวมตัวอย่าง prompt สำหรับสั่งงาน Claude Code ในโปรเจกต์นี้
เรามี **skills** และ **subagents** หลายตัว — ไม่ต้องจำชื่อ agent, แค่สั่งด้วยภาษาธรรมชาติก็ได้ Claude จะเลือก skill/agent ให้เอง

---

## สารบัญ

1. [เข้าใจระบบ Agent/Skill ก่อน](#1-เข้าใจระบบ)
2. [Full-Stack Loop (PM สั่งงานทั้ง frontend + backend)](#2-full-stack-loop)
3. [Backend อย่างเดียว](#3-backend-อย่างเดียว)
4. [Frontend อย่างเดียว](#4-frontend-อย่างเดียว)
5. [งานเล็กๆ (bug fix, แก้ไขนิดหน่อย)](#5-งานเล็กๆ)
6. [Database / Schema](#6-database--schema)
7. [Refactoring](#7-refactoring)
8. [Tips & Tricks](#8-tips--tricks)

---

## 1. เข้าใจระบบ

### Skills (เรียกด้วย `/skill-name`)

| Skill                       | ทำอะไร                                              |
| --------------------------- | --------------------------------------------------- |
| `/backend-development`      | Orchestrate สร้าง API ครบ loop                      |
| `/frontend-development`     | Orchestrate สร้าง UI ครบ loop                       |
| `/design-system`            | ดึง design identity ของโปรเจกต์ (สี, font, spacing) |
| `/oracle-schema-cache`      | เช็ค/สร้าง schema cache ก่อนเขียน SQL               |
| `/oracle-sqltab-generator`  | สร้างไฟล์ SQLTab                                    |
| `/tsoa-api-layer-generator` | Step-by-step สร้าง Controller+Service+Repository    |
| `/oracle-db-connector`      | Pattern การเชื่อม Oracle DB                         |
| `/create-table`             | สร้าง CREATE TABLE + GRANT + SYNONYM                |
| `/refactor`                 | Refactor code ตามหลัก Martin Fowler                 |

### Subagents (Claude เรียกเอง ไม่ต้องสั่งตรง)

| Agent                  | บทบาท                                              |
| ---------------------- | -------------------------------------------------- |
| `erp-manufacturing-pm` | **PM / หัวหน้าทีม** — วางแผน, แบ่งงาน, เลือก agent |
| `frontend-design-spec` | ออกแบบ UI spec ก่อน code (ถามคำถาม UX)             |
| `frontend-builder`     | เขียน React/TypeScript ตาม design spec             |
| `backend-builder`      | เขียน Controller + Service + Repository + SQLTab   |
| `code-reviewer`        | Review code อัตโนมัติหลัง build เสร็จ              |
| `nextjs-builder`       | สำหรับ Next.js + Vuexy (ไม่ใช้ในโปรเจกต์นี้)       |

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

## 2. Full-Stack Loop

**เป้าหมาย**: ให้ AI ทำทั้ง backend + frontend ครบ loop เหมือนมี PM คอยสั่งงาน

### Prompt แบบ 1: สั่งรวมทีเดียว (แนะนำ)

```
สร้างฟีเจอร์ "จัดการคลังสินค้า" แบบ full-stack:
- ตาราง Oracle: INVENTORY (รหัส, ชื่อ, จำนวน, หน่วย, สถานะ)
- API: CRUD endpoints สำหรับ inventory
- หน้าเว็บ: ตาราง + ฟอร์มเพิ่ม/แก้ไข + ค้นหา
```

> Claude จะใช้ `erp-manufacturing-pm` agent วางแผน → สั่ง `backend-builder` ทำ API → สั่ง `frontend-design-spec` ออกแบบ → สั่ง `frontend-builder` เขียน code → `code-reviewer` review

### Prompt แบบ 2: สั่งทีละ phase

```
# Phase 1 - วางแผน
วางแผนฟีเจอร์ "จัดการใบสั่งซื้อ" ให้หน่อย
ต้องมี API อะไรบ้าง, หน้าจออะไรบ้าง, ใช้ตารางไหน

# Phase 2 - Backend (หลังอนุมัติแผน)
เริ่มทำ backend ตามแผนที่วางไว้เลย

# Phase 3 - Frontend (หลัง backend เสร็จ)
เริ่มทำ frontend ตามแผนเลย

# Phase 4 - Review
review code ทั้งหมดที่สร้างมา
```

### Prompt แบบ 3: ระบุรายละเอียดเชิงลึก

```
สร้างระบบ "บันทึกการผลิต" (Production Record):

## Database
- ตาราง: PROD_RECORD
  - RECORD_ID (NUMBER), PRODUCT_CODE (VARCHAR2), QTY (NUMBER),
    SHIFT (VARCHAR2), MACHINE_NO (VARCHAR2), RECORD_DATE (DATE),
    STATUS (VARCHAR2), CREATED_BY (VARCHAR2), CREATED_DATE (DATE)

## API Endpoints
- GET /api/production-records — รายการทั้งหมด (มี filter วันที่, กะ, เครื่องจักร)
- GET /api/production-records/:id — ดึงตัวเดียว
- POST /api/production-records — สร้างใหม่
- PATCH /api/production-records/:id — แก้ไข

## หน้าเว็บ
- ตาราง: แสดงรายการ มี pagination, ค้นหา, filter กะ/เครื่อง
- ฟอร์ม: Dialog สำหรับเพิ่ม/แก้ไข ใช้ React Hook Form + Zod
- สถานะ: A=ใช้งาน, D=ลบแล้ว ใช้ StatusBadge

ทำ full-stack เลย ทั้ง backend และ frontend
```

---

## 3. Backend อย่างเดียว

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

## 4. Frontend อย่างเดียว

### สร้างหน้าใหม่

```
สร้างหน้า "รายงานการผลิตรายวัน"
- มี date picker สำหรับเลือกวันที่
- ตารางแสดงข้อมูลจาก GET /api/daily-reports
- มี export เป็น Excel
- ใช้ design system ของโปรเจกต์ (glassmorphism)
```

### แก้ UI ที่มีอยู่

```
แก้หน้า /sample ให้เพิ่ม filter dropdown สำหรับ status
ใช้ Select จาก shadcn/ui, ค่า: ทั้งหมด / ใช้งาน / ลบแล้ว
```

### สร้าง component ใหม่

```
สร้าง shared component "ConfirmDialog"
- รับ props: title, description, onConfirm, onCancel
- ใช้ AlertDialog จาก shadcn/ui
- ปุ่มยืนยันสีแดง (destructive), ปุ่มยกเลิก outline
```

---

## 5. งานเล็กๆ

### Bug fix

```
หน้า /sample กดปุ่ม "บันทึก" แล้ว form ไม่ submit
ช่วยดูหน่อย
```

### เพิ่ม hook / เชื่อม API

```
หน้า EmployeePage มี UI แล้ว แต่ยังไม่ได้เชื่อม API
ช่วยเพิ่ม React Query hook เรียก GET /api/employees
```

### แก้ style

```
ปุ่ม "เพิ่มใหม่" ในหน้า /sample ยังไม่มี gradient
ช่วยแก้ให้ตรง design system ของโปรเจกต์
```

---

## 6. Database / Schema

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

## 7. Refactoring

```
/refactor

refactor ไฟล์ src/services/employeeService.ts
- method processEmployee ยาวเกิน 100 บรรทัด
- มี duplicate logic ในการ validate
```

---

## 8. Tips & Tricks

### Tip 1: ยิ่งให้ context เยอะ ยิ่งได้ผลดี

```
# แบบนี้ — ได้ผลทั่วไป
สร้างหน้า CRUD

# แบบนี้ — ได้ผลตรงใจกว่า
สร้างหน้า "จัดการรายการสินค้า" CRUD:
- ตาราง: PRODUCT (PRODUCT_CODE, PRODUCT_NAME, UNIT, PRICE, STATUS)
- ต้องมี search, filter status, pagination
- ฟอร์มเพิ่ม/แก้ใช้ Dialog
- ปุ่มลบเป็น soft delete (STATUS='D')
```

### Tip 2: บอกขอบเขตชัดเจน

```
# ต้องการแค่ backend
สร้าง API สำหรับ ... (ไม่ต้องทำ frontend)

# ต้องการแค่ design
ออกแบบหน้าจอ ... (ยังไม่ต้อง code)

# ต้องการแค่แผน
วางแผนฟีเจอร์ ... ยังไม่ต้องเริ่มเขียน
```

### Tip 3: อ้างอิงไฟล์ที่มีอยู่

```
ดูไฟล์ src/controllers/sampleController.ts แล้วสร้าง employeeController
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
       │              │    ┌────────┼────────┐
       │              │    ▼        ▼        ▼
       │              │  backend  design   frontend
       │              │  builder   spec    builder
       │              │    │        │        │
       │              │    ▼        ▼        ▼
       │              │    └────────┴────────┘
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

### Full-Stack CRUD

```
สร้างฟีเจอร์ "จัดการแผนก" (Department Management) แบบ full-stack:

Database: ตาราง DEPARTMENT
- DEPT_CODE VARCHAR2(10) PK
- DEPT_NAME VARCHAR2(100)
- DEPT_HEAD VARCHAR2(50)
- STATUS VARCHAR2(1) DEFAULT 'A'
- CREATED_BY VARCHAR2(50)
- CREATED_DATE DATE DEFAULT SYSDATE
- UPDATED_BY VARCHAR2(50)
- UPDATED_DATE DATE

API:
- GET /api/departments (filter: search, status)
- GET /api/departments/:code
- POST /api/departments
- PATCH /api/departments/:code
- DELETE /api/departments/:code (soft delete)

Frontend:
- หน้า /departments ตาราง + ค้นหา + filter status + pagination
- ฟอร์มเพิ่ม/แก้ไขใน Dialog
- ปุ่มลบมี confirm dialog

ทำ full-stack ครบทั้ง backend + frontend เลย
```

### Backend Only

```
สร้าง API สำหรับรายงานสรุปการผลิตรายเดือน:
- GET /api/reports/monthly-production
- query parameter: month (YYYY-MM), line_no (optional)
- ดึงจากตาราง PROD_RECORD group by PRODUCT_CODE
- return: productCode, productName, totalQty, avgQty, days

ทำแค่ backend ไม่ต้องทำ frontend
```

### Frontend Only

```
สร้างหน้า Dashboard แสดง KPI การผลิต:
- 4 cards: ผลผลิตวันนี้, เป้าหมาย, % ความสำเร็จ, downtime
- กราฟแท่ง: ผลผลิต 7 วันย้อนหลัง
- ตาราง: top 5 สินค้าที่ผลิตมากสุด
- ดึงข้อมูลจาก GET /api/dashboard/production-kpi

ทำแค่ frontend, API มีอยู่แล้ว
```
