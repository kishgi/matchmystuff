import { useAdminSession } from "@/components/admin/AdminSessionProvider";

export function useAdminArgs() {
  const { token, ready } = useAdminSession();
  if (!ready || !token) return "skip" as const;
  return { adminToken: token } as const;
}
