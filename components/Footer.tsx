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
    <footer className="border-t border-gray-100 px-4 py-12 md:px-6 md:py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <Logo height={44} />
          <p className="text-base" style={{ color: C.slate }}>
            {COPY.brand.tagline}
          </p>
        </div>
        <ul className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-base transition-colors hover:underline hover:underline-offset-4"
                style={{ color: C.slate }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
