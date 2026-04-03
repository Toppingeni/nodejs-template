import { useQuery } from "@tanstack/react-query";
import type { UserRoleData } from "@/types/role";

export const useUserRole = (
  userId?: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<UserRoleData>({
    queryKey: ["roles", "user", userId] as const,
    queryFn: async (): Promise<UserRoleData> => ({
      userId: userId ?? "",
      userRole: "admin",
      allRoles: [{ roleCode: "admin", roleName: "ผู้ดูแลระบบ" }],
    }),
    enabled: options?.enabled ?? !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
