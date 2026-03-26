---
name: "oracle-db-connector"
description: "Provides guidelines and examples for Oracle DB connections, queries, and stored procedures in this project. Invoke when working with Oracle Database, creating repositories, or writing SQL."
---

# Oracle DB Connector

**Description:** แนวทางและตัวอย่างการใช้งาน Oracle Database สำหรับโปรเจกต์นี้

## โครงสร้างและไฟล์ที่เกี่ยวข้อง

- `src/libs/oracle/config.ts` - อ่านค่าและแปลง connection string จาก `tnsnames.ora`
- `src/libs/oracle/oracledb.ts` - จัดการ Oracle Connection Pool
- `src/libs/oracle/index.ts` - `Oracle` Utility Class (รวมคำสั่ง `query`, `command`, `commandSp` ฯลฯ)
- `src/types/oracleType.ts` - Types สำหรับ Oracle DB

---

## 💡 แนวทางการใช้งาน (Best Practices)

1. **ห้ามสร้าง Connection เองพร่ำเพรื่อ**: โปรเจกต์นี้มีการใช้ Connection Pool แล้วใน `src/libs/oracle/oracledb.ts`
2. **ห้ามต่อ String SQL**: ให้ใช้ Bind Parameters (`:paramName`) เสมอเพื่อป้องกัน SQL Injection
3. **ใช้ Singleton Instance**: เรียกใช้ `oracle` instance ที่ export มาจาก `src/libs/oracle/index.ts` (หรือ `src/libs/oracle` ได้เลย)
4. **กำหนด Type เสมอ**: เมื่อทำคำสั่ง `.query<T>()` ให้กำหนด Interface หรือ Type ของผลลัพธ์ด้วย

---

## 📝 ตัวอย่างการเรียกใช้งาน

### 1. การ SELECT ข้อมูล (Query)

```typescript
import { oracle } from "../../libs/oracle";

// กำหนด Interface ของผลลัพธ์
interface IUserRow {
    USER_ID: number;
    USERNAME: string;
}

export const getActiveUsers = async () => {
    const sql = `
    SELECT USER_ID, USERNAME 
    FROM USERS 
    WHERE STATUS = :status
  `;

    // เรียกใช้ .query พร้อมส่ง Bind Parameter
    const users = await oracle.query<IUserRow>(sql, { status: "ACTIVE" });
    return users;
};
```

### 2. การ INSERT/UPDATE/DELETE (Command)

```typescript
import { oracle } from "../../libs/oracle";

export const updateUserStatus = async (userId: number, status: string) => {
    const sql = `
    UPDATE USERS 
    SET STATUS = :status 
    WHERE USER_ID = :userId
  `;

    const result = await oracle.command(sql, {
        status,
        userId,
    });

    return result.rowsAffected;
};
```

### 3. การเรียกใช้ Stored Procedure

```typescript
import { oracle } from "../../libs/oracle";
import oracledb from "oracledb";

export const callUserProcedure = async (userId: number) => {
    const result = await oracle.commandSp({
        spName: "PKG_USER.GET_USER_INFO",
        input: {
            p_user_id: { type: oracledb.NUMBER, value: userId },
        },
        output: {
            p_result_cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
            p_error_code: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        },
    });

    return result.output;
};
```

### 4. การรันหลายคำสั่งพร้อมกันใน Transaction เดียว (Commands)

```typescript
import { oracle } from "../../libs/oracle";

export const processMultipleCommands = async () => {
    const commands = [
        {
            sql: `INSERT INTO LOGS (MSG) VALUES (:msg)`,
            params: { msg: "Step 1" },
        },
        {
            sql: `UPDATE USERS SET LAST_LOGIN = SYSDATE WHERE USER_ID = :id`,
            params: { id: 1 },
        },
    ];

    // ระบบจะทำการ Commit ให้ถ้าสำเร็จ หรือ Rollback ถ้าเกิด Error ในคำสั่งใดคำสั่งหนึ่ง
    await oracle.commands(commands);
};
```
