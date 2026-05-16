"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSessionProvider } from "@/components/admin/AdminSessionProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  return (
    <AdminSessionProvider>
      {isLogin ? children : <AdminGuard>{children}</AdminGuard>}
    </AdminSessionProvider>
  );
}
