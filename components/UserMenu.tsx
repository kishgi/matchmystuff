"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";

export function UserMenu() {
  const user = useQuery(api.users.getCurrentUser);
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (user === undefined) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />;
  }

  if (!user) return null;

  const displayName = user.name ?? user.email ?? "User";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50"
        style={{ color: C.teal }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: C.sky }}>
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate">{displayName}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-2 shadow-lg">
          <Link
            href="/my-posts"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-gray-50"
            style={{ color: C.slate }}
          >
            {COPY.nav.myPosts}
          </Link>
          <Link
            href="/matches"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-gray-50"
            style={{ color: C.slate }}
          >
            {COPY.nav.myMatches}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            style={{ color: C.coral }}
          >
            {COPY.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
