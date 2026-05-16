"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/auth";
  const isChat = pathname.startsWith("/chat/");

  return (
    <>
      {!isAuth && <Navbar />}
      <main
        className={
          isAuth
            ? "flex h-dvh min-h-0 flex-col overflow-hidden"
            : isChat
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1"
        }
      >
        {children}
      </main>
      {!isAuth && !isChat && <Footer />}
    </>
  );
}
