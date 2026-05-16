"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatListPanel } from "@/components/chat/ChatListPanel";
import { ChatThreadPanel } from "@/components/chat/ChatThreadPanel";
import { useChatWidget } from "@/components/chat/ChatWidgetContext";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const unreadCount = useQuery(
    api.conversations.getUnreadMessageCount,
    isAuthenticated ? {} : "skip",
  );
  const { isOpen, activeConversationId, openList, close } = useChatWidget();

  const hideOnRoute =
    pathname === "/auth" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/chat/") ||
    pathname === "/conversations";

  if (isLoading || !isAuthenticated || hideOnRoute) {
    return null;
  }

  const count = unreadCount ?? 0;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => (isOpen ? close() : openList())}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-shadow hover:shadow-xl md:bottom-6 md:right-6"
        style={{ backgroundColor: C.teal }}
        aria-label={COPY.chat.title}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChatIcon className="h-7 w-7" />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
            style={{ backgroundColor: C.coral }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-50 bg-black/20 md:bg-transparent"
              aria-label={COPY.chat.close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              role="dialog"
              aria-label={COPY.chat.title}
              className="fixed bottom-24 right-4 z-50 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl md:bottom-24 md:right-6"
              style={{ height: "min(520px, calc(100dvh - 7rem))" }}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-3 py-2.5">
                <p className="text-sm font-semibold" style={{ color: C.teal }}>
                  {activeConversationId ? COPY.chat.online : COPY.chat.title}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
                  aria-label={COPY.chat.close}
                >
                  <svg className="h-5 w-5" style={{ color: C.slate }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="min-h-0 flex-1">
                {activeConversationId ? (
                  <ChatThreadPanel conversationId={activeConversationId} />
                ) : (
                  <ChatListPanel />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
