"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { timeAgo } from "@/lib/time";
import { toastError, toastSuccess } from "@/lib/toast";

export function NotificationBell() {
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const notifications = useQuery(api.notifications.getNotifications);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = unreadCount ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2.5 transition-colors hover:bg-gray-100"
        aria-label={COPY.notifications.title}
      >
        <svg className="h-6 w-6" style={{ color: C.slate }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
            style={{ backgroundColor: C.coral }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold" style={{ color: C.teal }}>
                {COPY.notifications.title}
              </span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    void markAllRead()
                      .then(() => toastSuccess(COPY.toast.markAllReadSuccess))
                      .catch(() => toastError(COPY.toast.markAllReadError));
                  }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: C.sky }}
                >
                  {COPY.notifications.markAllRead}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications === undefined ? (
                <div className="space-y-2 p-4">
                  <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-center text-sm" style={{ color: C.slate }}>
                  {COPY.notifications.empty}
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n._id}
                    href={`/matches/${n.matchId}`}
                    onClick={() => setOpen(false)}
                    className="block border-b border-gray-50 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <p className="text-sm" style={{ color: C.slate }}>
                      {COPY.notifications.matchFound}{" "}
                      <span className="font-medium" style={{ color: C.teal }}>
                        {n.postTitle}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
