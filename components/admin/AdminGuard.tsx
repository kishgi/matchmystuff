"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { C } from "@/lib/colors";
import { useAdminSession } from "./AdminSessionProvider";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, ready } = useAdminSession();
  const isValid = useQuery(
    api.adminAuth.validateSession,
    ready && token ? { adminToken: token } : "skip",
  );

  useEffect(() => {
    if (!ready) return;
    if (pathname === "/admin/login") return;
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (isValid === false) {
      router.replace("/admin/login");
    }
  }, [ready, token, isValid, pathname, router]);

  if (!ready || (token && isValid === undefined)) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4"
          style={{ borderColor: `${C.teal}30`, borderTopColor: C.teal }}
          aria-hidden
        />
      </div>
    );
  }

  if (!token || !isValid) {
    return null;
  }

  return <>{children}</>;
}
