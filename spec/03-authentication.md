# Authentication (2 แบบ)

## ภาพรวม

ระบบมี auth 2 รูปแบบ ทั้งคู่ใช้ **JWT token** เป็นหลัก:

| แบบ            | วิธีการ                        | Use Case                     |
| -------------- | ------------------------------ | ---------------------------- |
| **Form Login** | User กรอก username/password    | เข้าระบบตรง                  |
| **Token URL**  | ได้รับ token ผ่าน query string | เข้าจากระบบภายนอก (SSO-like) |

## แบบที่ 1: Form Login (`/login`)

1. User กรอก userId + password ที่หน้า `LoginPage`
2. Client POST ไปที่ **Auth API** (`VITE_API_AUTH_URL`) ภายนอก
3. Auth API return JWT token กลับมา
4. Client เก็บ token ลง storage (localStorage หรือ sessionStorage ตาม "remember me")
5. Redirect ไปหน้าที่ต้องการ

### ข้อมูลใน JWT (DecodedUser)

```ts
// ปรับ fields ตาม external auth API ของแต่ละโปรเจกต์
{
  nameid: string;       // User ID
  UserName: string;     // ชื่อผู้ใช้
  UserType: string;     // ประเภท (Admin, User, etc.)
  exp?: number;         // Expiration timestamp
  // เพิ่ม fields อื่นตาม JWT ที่ได้จาก auth server
}
```

## แบบที่ 2: Token URL (`/token-login`)

1. ระบบภายนอกสร้าง URL: `/token-login?token=xxx&redirectTo=/path`
2. Component `TokenLogin` รับ token จาก query string
3. เรียก `loginWithToken()` เก็บ token + decode user
4. Redirect ไปหน้าที่ระบุ (มี sanitize URL ป้องกัน open redirect)

## Token Management (`client/auth/tokens.ts`)

- **Storage**: localStorage (remember=true) หรือ sessionStorage (remember=false)
- **Hint key**: เก็บว่าใช้ storage ไหน เพื่อดึง token ได้ถูกต้อง
- **Decode**: ใช้ `jwt-decode` library
- **Expiry check**: เทียบ `exp` claim กับ `Date.now()`

## Auth Context (`client/auth/context.tsx`)

```tsx
<AuthProvider>
  {' '}
  {/* Wrap ทั้ง app */}
  <PrivateRoute>
    {' '}
    {/* Wrap protected routes */}
    <App />
  </PrivateRoute>
</AuthProvider>
```

- `AuthProvider` จัดการ state: user, token, isLoading
- Mount → ตรวจ token เดิม → verify กับ server → set user
- Export: `useAuth()` hook → `{ user, token, loginWithToken, logout }`

## Dev Bypass

ตั้ง `VITE_BYPASS_AUTH=true` ใน .env → ข้าม auth ทั้งหมด ใช้ mock user

## API Security

- ทุก request แนบ `Authorization: Bearer <token>` header
- ถ้า API return 401 → auto clear token → redirect `/login`
- Server verify token ผ่าน middleware
