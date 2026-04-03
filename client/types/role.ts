export type UserRole = "admin" | "manager" | "user" | "viewer";

export interface RoleInfo {
  roleCode: string;
  roleName: string;
}

export interface UserRoleData {
  userId: string;
  userRole: UserRole;
  allRoles: RoleInfo[];
}
