"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ChatWidgetProvider } from "@/components/chat/ChatWidgetContext";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/auth";
  const isAdmin = pathname.startsWith("/admin");
  const isChat = pathname.startsWith("/chat/");

  return (
    <ChatWidgetProvider>
      {!isAuth && !isAdmin && <Navbar />}
      <main
        className={
          isAuth
            ? "flex h-dvh min-h-0 flex-col overflow-hidden"
            : isAdmin
              ? "flex min-h-0 flex-1 flex-col"
              : isChat
                ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                : "flex-1"
        }
      >
        {children}
      </main>
      {!isAuth && !isChat && !isAdmin && <Footer />}
      <ChatWidget />
    </ChatWidgetProvider>
  );
}
