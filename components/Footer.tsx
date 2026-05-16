import Link from "next/link";
import { C } from "@/lib/colors";
import { COPY } from "@/lib/copy";
import { Logo } from "@/components/Logo";

const productLinks = [
  { href: "/", label: COPY.footer.home },
  { href: "/report/lost", label: COPY.footer.reportLost },
  { href: "/report/found", label: COPY.footer.reportFound },
  { href: "/matches", label: COPY.footer.matches },
  { href: "/conversations", label: COPY.footer.messages },
] as const;

const companyLinks = [
  { href: "/contact", label: COPY.footer.contact },
  { href: "/auth", label: COPY.footer.signIn },
] as const;

const legalLinks = [
  { href: "/privacy", label: COPY.footer.privacy },
  { href: "/terms", label: COPY.footer.terms },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: C.teal }}>
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm transition-colors hover:underline hover:underline-offset-4"
              style={{ color: C.slate }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-[#f8fbfc] px-4 py-14 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo height={44} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: C.slate }}>
              {COPY.footer.description}
            </p>
            <p className="mt-3 text-sm font-medium" style={{ color: C.teal }}>
              {COPY.footer.tagline}
            </p>
          </div>
          <FooterColumn title={COPY.footer.product} links={productLinks} />
          <FooterColumn title={COPY.footer.company} links={companyLinks} />
          <FooterColumn title={COPY.footer.legal} links={legalLinks} />
        </div>
        <div
          className="mt-12 border-t border-gray-200 pt-8 text-center text-sm md:text-left"
          style={{ color: C.slate, opacity: 0.75 }}
        >
          © {year} {COPY.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
