import Link from "next/link";

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1d]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1d]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <img src="/logo.png" alt="Predikt logo" className="h-8 w-8 rounded-lg" />
            Predikt
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="mx-auto max-w-6xl px-5 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            ⚡ Live data-driven football tips
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
            Win more with{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              smarter football predictions
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
            Expert tips across the world&apos;s top leagues. Start free, then unlock
            premium VIP picks with high-confidence odds. Pay securely with Paystack.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              View predictions
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon="📊" title="Data-backed tips" desc="Every prediction comes with confidence scores, odds and analysis." />
          <Feature icon="🔒" title="Premium VIP picks" desc="Unlock high-confidence premium tips reserved for subscribers." />
          <Feature icon="💳" title="Paystack checkout" desc="Upgrade in seconds with secure card payments via Paystack." />
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">Simple pricing</h2>
        <p className="mb-10 text-center text-slate-400">Start free. Upgrade when you&apos;re ready.</p>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mt-2 text-4xl font-black text-white">KES 0</p>
            <p className="text-sm text-slate-400">forever</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>✅ Access free daily tips</li>
              <li>✅ Win-rate &amp; stats dashboard</li>
              <li>✅ Create your own predictions</li>
              <li className="text-slate-500">🚫 Premium VIP picks</li>
            </ul>
            <Link href="/register" className="mt-8 block rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-white hover:bg-white/5">
              Get started
            </Link>
          </div>
          <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8">
            <span className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-[#0a0f1d]">POPULAR</span>
            <h3 className="text-lg font-semibold text-white">Premium · 24h pass</h3>
            <p className="mt-2 text-4xl font-black text-white">
              KES 100<span className="text-base font-normal text-slate-400"> / 24 hrs</span>
            </p>
            <p className="text-sm text-emerald-300">buy again anytime to stack +24h</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li>✅ Everything in Free</li>
              <li>✅ All premium VIP picks unlocked for 24 hours</li>
              <li>✅ Higher-confidence selections</li>
              <li>✅ Priority access to top tips</li>
            </ul>
            <Link href="/register" className="mt-8 block rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400">
              Get 24h Premium — KES 100
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 sm:flex-row sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <img src="/logo.png" alt="Predikt logo" className="h-5 w-5 rounded" />
            Predikt · Secured by Paystack
          </p>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
            <Link href="/about" className="hover:text-white">About us</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
          </nav>
          <p className="text-xs text-slate-600">18+ · Bet responsibly</p>
        </div>
      </footer>
    </div>
  );
}
