"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "@convex-dev/auth/react";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";

const navLinks = [
  { href: "/", label: COPY.nav.home, color: C.slate, match: (p: string) => p === "/" },
  { href: "/report/lost", label: COPY.nav.reportLost, color: C.coral, match: (p: string) => p.startsWith("/report/lost") },
  { href: "/report/found", label: COPY.nav.reportFound, color: C.sky, match: (p: string) => p.startsWith("/report/found") },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-2 py-4 md:px-6">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-85">
          <span className="text-3xl font-bold text-[#1B5E78]">Match</span>
          <span className="text-3xl font-bold text-black">MyStuff</span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => {
            const active = link.match(pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative text-base transition-all ${active ? "font-bold underline underline-offset-4" : "font-medium hover:underline hover:underline-offset-4"}`}
                  style={{ color: link.color }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          {isAuthenticated && <NotificationBell />}
          {!isLoading && !isAuthenticated && (
            <Link
              href="/auth"
              className="btn-primary hidden !px-6 !py-2.5 md:inline-flex"
              style={{ backgroundColor: C.teal }}
            >
              {COPY.nav.signIn}
            </Link>
          )}
          {!isLoading && isAuthenticated && <UserMenu />}
          <button
            type="button"
            className="rounded-xl p-2.5 transition-colors hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg className="h-7 w-7" style={{ color: C.slate }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
        <div className="border-t border-gray-100 px-4 py-5 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const active = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block text-base ${active ? "font-bold underline underline-offset-4" : "font-medium"}`}
                    style={{ color: link.color }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            {!isLoading && !isAuthenticated && (
              <li>
                <Link
                  href="/auth"
                  className="btn-primary inline-flex !px-6 !py-2.5"
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
