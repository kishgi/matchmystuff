import Link from "next/link";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { Logo } from "@/components/Logo";

const footerLinks = [
  { href: "/privacy", label: COPY.footer.privacy },
  { href: "/terms", label: COPY.footer.terms },
  { href: "/contact", label: COPY.footer.contact },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-100 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo height={28} />
          <p className="text-sm" style={{ color: C.slate }}>
            {COPY.brand.tagline}
          </p>
        </div>
        <ul className="flex gap-6">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm hover:underline" style={{ color: C.slate }}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
