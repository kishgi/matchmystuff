"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { useAdminSession } from "@/components/admin/AdminSessionProvider";
import { C } from "@/lib/colors";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/posts", label: "Posts", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/matches", label: "Matches", exact: false },
] as const;

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, clearToken } = useAdminSession();
  const logout = useMutation(api.adminAuth.logout);

  const handleLogout = async () => {
    if (token) {
      try {
        await logout({ adminToken: token });
      } catch {
        /* session may already be invalid */
      }
    }
    clearToken();
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-dvh bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-gray-200 bg-white md:flex lg:w-60">
        <div className="border-b border-gray-100 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="MatchMyStuff"
              width={120}
              height={52}
              className=" w-auto"
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? `${C.teal}12` : "transparent",
                  color: active ? C.teal : C.slate,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-sm transition-colors hover:bg-gray-50"
            style={{ color: C.slate }}
          >
            ← Back to app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            style={{ color: C.coral }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-56 lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-5.75 md:px-8">
            <h1 className="text-xl font-bold md:text-2xl" style={{ color: C.teal }}>
              {title}
            </h1>
            <Link href="/" className="text-sm md:hidden" style={{ color: C.slate }}>
              App
            </Link>
            <p
            className="text-xs font-medium uppercase tracking-wider border border-gray-100 rounded-full px-2 py-1 bg-gray-100"
            style={{ color: C.teal }}
          >
            Admin Panel
          </p>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-2 py-2 md:hidden">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: active ? `${C.teal}12` : "transparent",
                    color: active ? C.teal : C.slate,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
