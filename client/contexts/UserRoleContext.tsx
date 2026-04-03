import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "../auth/context";

interface UserRoleContextValue {
  userRole: string;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  canAccess: (requiredRoles: string[]) => boolean;
}

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

interface UserRoleProviderProps {
  children: ReactNode;
}

export function UserRoleProvider({ children }: UserRoleProviderProps) {
  const { user } = useAuth();

  const value = useMemo<UserRoleContextValue>(() => {
    const userRole = user?.UserType ?? "admin";

    const hasRole = (role: string): boolean => userRole === role;

    const hasAnyRole = (roles: string[]): boolean => roles.includes(userRole);

    const canAccess = (requiredRoles: string[]): boolean => {
      if (requiredRoles.length === 0) return true;
      return requiredRoles.includes(userRole);
    };

    return { userRole, hasRole, hasAnyRole, canAccess };
  }, [user]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole(): UserRoleContextValue {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error("useUserRole ต้องใช้ภายใน UserRoleProvider");
  }
  return ctx;
}
