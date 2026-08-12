import Link from "next/link";
import type { ReactNode } from "react";

const FOOTER_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cookies", label: "Cookies" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
      <img src="/logo.png" alt="Predikt logo" className="h-8 w-8 rounded-lg" />
      Predikt
    </Link>
  );
}

export default function PublicPageShell({
  headerDark = false,
  children,
}: {
  headerDark?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1d]">
      <header
        className={`sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1d]/80 backdrop-blur ${
          headerDark ? "" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white sm:px-4"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Predikt</p>
        </div>
        <p className="pb-6 text-center text-xs text-slate-600">
          18+ only. Bet responsibly — predictions are insights, not guarantees.
        </p>
      </footer>
    </div>
  );
}
