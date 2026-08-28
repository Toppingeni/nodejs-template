# Role-Based Access Control (RBAC)

## ภาพรวม

```
[Login] → JWT token (มี userId)
   ↓
[AuthProvider] → decode JWT → user object
   ↓
[UserRoleProvider] → fetch GET /api/roles/user/:userId → role data + allRoles
   ↓
[PrivateRoute] → hasAnyRole(requiredRoles) → allow / deny
[Sidebar] → filter menu items ตาม role
[Server] → roleService.isAdmin(userId) → 403 ถ้าไม่มีสิทธิ์
```

---

## 1. Role Types (`client/types/role.ts`)

```ts
// กำหนด roles ที่ใช้ในระบบ — ปรับตามโปรเจกต์
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';
// หรือใช้ dynamic: type UserRole = FixedUserRole | `custom${string}`;

// ข้อมูล role แต่ละตัว (จาก DB)
export interface RoleInfo {
  roleCode: string;
  roleName: string;
  roleDescription: string;
  priority: number;
}

// ข้อมูลผู้ใช้ + roles ที่ได้จาก API
export interface UserRoleData {
  userId: string;
  userName: string;
  department: string;
  section: string;
  unit: string;
  userRole: UserRole; // primary role (priority สูงสุด)
  roleName: string;
  roleDescription: string;
  allRoles: RoleInfo[]; // ทุก roles ที่มี
}

// Context type
export interface UserRoleContextType {
  userRole: UserRole;
  userData: UserRoleData | null;
  isLoading: boolean;
  error: string | null;
  refreshUserRole: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}
```

---

## 2. UserRoleContext (`client/contexts/UserRoleContext.tsx`)

Fetch role จาก API แล้วให้ทั้ง app ใช้ผ่าน `useUserRole()` hook

```tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRole as useUserRoleQuery } from '../tanstackQuery/useRoleApi';
import { useAuth } from '../auth/context';
import { UserRole, UserRoleData, UserRoleContextType } from '../types/role';

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [userData, setUserData] = useState<UserRoleData | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  // Fetch role จาก API ด้วย TanStack Query
  const userId = user?.nameid;
  const {
    data: userRoleData,
    isLoading: queryLoading,
    error: queryError,
    refetch: refreshUserRole,
  } = useUserRoleQuery(userId, {
    enabled: !authLoading && !!userId, // fetch เมื่อ auth เสร็จ + มี userId
  });

  useEffect(() => {
    if (userRoleData) {
      setUserData(userRoleData);
      setUserRole(userRoleData.userRole);
    }
  }, [userRoleData]);

  // ตรวจว่ามี role ตรง
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!userData) return false;
      if (userData.userRole === role) return true;
      return userData.allRoles.some((r) => r.roleCode === role);
    },
    [userData],
  );

  // ตรวจว่ามี role ใดๆ ใน array
  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!userData) return false;
      if (roles.includes(userData.userRole)) return true;
      return userData.allRoles.some((r) => roles.includes(r.roleCode as UserRole));
    },
    [userData],
  );

  const canAccess = useCallback((requiredRoles: UserRole[]) => hasAnyRole(requiredRoles), [hasAnyRole]);

  return (
    <UserRoleContext.Provider
      value={{
        userRole,
        userData,
        isLoading: authLoading || queryLoading,
        error: queryError?.message || null,
        refreshUserRole: async () => {
          await refreshUserRole();
        },
        hasRole,
        hasAnyRole,
        canAccess,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRole must be used within UserRoleProvider');
  return ctx;
};
```

---

## 3. PrivateRoute — Route-Level Guard

```tsx
// client/auth/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';
import { useUserRole, UserRole } from '../contexts/UserRoleContext';

export default function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAnyRole, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) return <div>Loading...</div>;

  // Dev bypass
  if (import.meta.env.VITE_BYPASS_AUTH === 'true') return children;

  // ยังไม่ login
  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  // ตรวจ role
  if (roles?.length && !hasAnyRole(roles as UserRole[])) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20vh' }}>
        <h1>Access Denied</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return children;
}
```

### ใช้งานใน Route Config

```tsx
// routes ที่ต้องมี role เฉพาะ
{
  path: "admin/settings",
  element: (
    <PrivateRoute roles={["admin"]}>
      <SettingsPage />
    </PrivateRoute>
  ),
}

// routes ที่ทุก role เข้าได้ (แค่ login)
{
  path: "dashboard",
  element: (
    <PrivateRoute>
      <DashboardPage />
    </PrivateRoute>
  ),
}
```

---

## 4. Sidebar — Menu Filtering ตาม Role

```tsx
// ใน Sidebar component
const { hasAnyRole } = useUserRole();

const menuItems = allMenuItems.filter((item) => {
  // ไม่ระบุ roles = ทุก role เข้าได้
  if (!item.roles || item.roles.length === 0) return true;
  return hasAnyRole(item.roles as UserRole[]);
});
```

---

## 5. Server-Side — Role Service

Role ถูกเก็บใน DB (Oracle) — ระบบดึงตาม priority: USER > UNIT > SECTION > DEPT

```ts
// server/services/roleService.ts
class RoleService {
  // ดึง role + org info ของ user
  async getUserRoleInfo(userId: string): Promise<UserRoleData> {
    const roles = await roleRepository.getUserRoles(userId, appId);
    const orgInfo = await roleRepository.getUserOrgInfo(userId);
    const primaryRole = roles[0]; // highest priority
    return { ...orgInfo, userRole: primaryRole.roleCode, allRoles: roles };
  }

  // ตรวจสอบ role
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const roles = await roleRepository.getUserRoles(userId, appId);
    return roles.some((r) => r.roleCode === roleCode);
  }

  async hasAnyRole(userId: string, roleCodes: string[]): Promise<boolean> {
    const roles = await roleRepository.getUserRoles(userId, appId);
    return roles.some((r) => roleCodes.includes(r.roleCode));
  }

  async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin');
  }

  // CRUD operations สำหรับ role assignments (admin only)
  async createRoleAssignment(data) {
    /* ... */
  }
  async deactivateRoleAssignment(id) {
    /* ... */
  }
}
```

---

## 6. Server-Side — Role API Routes

```ts
// server/routes/roleRoutes.ts
const router = Router();

// Public (ต้อง login แต่ทุก role เข้าได้)
router.get('/user/:userId', roleController.getUserRole);
router.get('/me', roleController.getMyRole);

// Admin only
router.post('/assign', addAuditFields, roleController.createRoleAssignment);
router.delete('/assignments/:id', addAuditFields, roleController.deactivateRoleAssignment);

export default router;
```

```ts
// server/controllers/roleController.ts
class RoleController {
  async getUserRole(req, res) {
    const data = await roleService.getUserRoleForFrontend(req.params.userId);
    res.json({ success: true, data });
  }

  async createRoleAssignment(req, res) {
    // ตรวจสิทธิ์ admin ก่อน
    const isAdmin = await roleService.isAdmin(req.body.userId);
    if (!isAdmin) return res.status(403).json({ message: 'Admin only' });

    const result = await roleService.createRoleAssignment(req.body);
    res.json({ success: true, data: result });
  }
}
```

---

## 7. Role Priority (DB Schema)

Role assignments เก็บใน table `USER_ROLES` — สามารถ assign ได้ 4 ระดับ:

| Priority   | Level   | ใช้เมื่อ                |
| ---------- | ------- | ----------------------- |
| 1 (สูงสุด) | USER_ID | assign ให้ user คนเดียว |
| 2          | UNIT_ID | assign ให้ทั้งหน่วย     |
| 3          | SECT_ID | assign ให้ทั้งแผนก      |
| 4 (ต่ำสุด) | DEPT_ID | assign ให้ทั้งฝ่าย      |

ถ้า user มีหลาย roles → ใช้ priority สูงสุดเป็น primary role, เก็บทั้งหมดใน `allRoles`

---

## Flow สรุป

```
Client:
  AuthProvider → decode JWT
  UserRoleProvider → GET /api/roles/user/:userId → cache 5 min
  useUserRole() → { hasRole, hasAnyRole, canAccess, userRole, userData }
  PrivateRoute → hasAnyRole(requiredRoles) → allow/deny page
  Sidebar → filter menu items ด้วย hasAnyRole

Server:
  contextMiddleware → extract userId จาก JWT → AsyncLocalStorage
  addAuditFields → extract userId → inject ลง req.body
  roleController → roleService.isAdmin() → 403 ถ้าไม่ใช่ admin
  roleService → roleRepository → Oracle DB (USER_ROLES table)
```

## Key Points

- **Client-side**: UX only (ซ่อน/แสดง), ไม่ใช่ security
- **Server-side**: authoritative — ตรวจ `isAdmin()` ก่อน data-modifying operations
- **Role ดึงจาก DB**: ไม่ได้ฝังใน JWT — เพราะ role เปลี่ยนได้โดยไม่ต้อง re-login
- **Cache 5 min**: ผ่าน TanStack Query staleTime, มี `refreshUserRole()` สำหรับ force refresh
