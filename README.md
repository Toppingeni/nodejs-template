# NodeJS API

A REST API for comparing invoice data between Oracle and other systems using both native OracleDB and Sequelize ORM.

## Features

- Dual database access (OracleDB + Sequelize)
- TNS configuration support
- Structured error handling
- TypeScript support
- ESLint for code quality

## Prerequisites

- Node.js 18+
- Oracle Client libraries
- Oracle Database access
- TNS configuration file

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo.git
cd your-repo
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# install igs-vault
npm i @ingeni/igs-vault -g

# login to igs-vault
igs-vault setup-script http://192.168.55.25:8200 username password

# load global env
# 1. load app env
igs-vault write stag/data/xxxx .env;
# 2. load app env
## MAC
igs-vault append global/data/dev/mac .env;
## LINUX
igs-vault append global/data/dev/linux .env
## Windows
igs-vault append global/data/dev/windows .env

```

## Running the API

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## AI Prompt Guide (SQLTab / Inline SQL)

> Oracle 11g; Dev อ่าน `src/sqltabs/<APP_ID>_<SQL_NO>.sql` ก่อน (SQL_NO เริ่ม 1)

### 1) วิธีสั่งให้ AI เขียนผ่าน SQLTab (แนะนำ)

```text
ทำ API TSOA (C->S->Repo) ใช้ SQLTab เท่านั้น (ห้าม inline)
APP_ID=<id>; SQL_NO=<auto next>; table=<TABLE>; เช็ค schema ใน src/schema (ถ้าไม่มีให้ใช้ Oracle MCP แล้วสร้างไฟล์)
ขอให้สร้าง src/sqltabs/<APP_ID>_<SQL_NO>.sql + repo(queryFromSqlTab/commandFromSqlTab) + service(Zod) + controller + บอกให้รัน npm run tsoa:gen
```

### 2) วิธีสั่งให้ AI เขียน SQL ตรงๆ (Inline SQL)

```text
ทำ endpoint แบบ inline SQL ได้ (ไม่ใช้ SQLTab) แต่ต้อง bind params และต้อง Oracle 11g
เช็ค schema ใน src/schema (ถ้าไม่มีใช้ Oracle MCP แล้วสร้างไฟล์); แก้เฉพาะ Repo/Service/Controller; ไม่ต้องสร้าง src/sqltabs
```

### 3) วิธีสั่งให้ AI สร้าง INSERT SQLTab (สำหรับอัปเดต DB)

```text
สร้าง SQLTab + สคริปต์ INSERT ลง KPDBA.SQL_TAB_OPPN
APP_ID=<id>; SQL_NO=<no>; SQL_TYPE=<1|2|3|4>; SQL_DESC=<desc>; DB_CONNECTION=OPP
สร้าง 2 ไฟล์: src/sqltabs/<APP_ID>_<SQL_NO>.sql และ src/sqltabs/<APP_ID>_<SQL_NO>__insert.sql (INSERT+COMMIT)
```

## AI Skill Prompt Guide

```text
ใช้ skill หัวหน้าทีม-วางแผนเขียนโค้ด (Team Lead): ขอแผน feature + endpoints/DTO + แยก C/S/Repo(Q/C) + รายการ SQLTab + schema ที่ต้องมี
```

```text
ใช้ skill นักพัฒนา Fullstack (Developer): ขอ implement ตามแผน (C/S/Repo + sqltabs + schema) และรัน npm run lint + npm run build
```

```text
ใช้ skill oracle-db-master: ขอเช็ค config/pool/tnsnames/oracle client + env ที่ต้องมี + แนวทางแก้ปัญหาเชื่อมต่อ
```
