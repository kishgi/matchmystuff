"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvexAuth } from "@convex-dev/auth/react";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";

const navLinks = [
  { href: "/", label: COPY.nav.home, color: C.slate },
  { href: "/report/lost", label: COPY.nav.reportLost, color: C.coral },
  { href: "/report/found", label: COPY.nav.reportFound, color: C.sky },
] as const;

export function Navbar() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Logo height={32} />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: link.color }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          {!isLoading && !isAuthenticated && (
            <Link
              href="/auth"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-white md:inline-block"
              style={{ backgroundColor: C.teal }}
            >
              {COPY.nav.signIn}
            </Link>
          )}
          {!isLoading && isAuthenticated && <UserMenu />}
          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg className="h-6 w-6" style={{ color: C.slate }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium hover:underline"
                  style={{ color: link.color }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {!isLoading && !isAuthenticated && (
              <li>
                <Link
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="inline-block rounded-full px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: C.teal }}
                >
                  {COPY.nav.signIn}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
