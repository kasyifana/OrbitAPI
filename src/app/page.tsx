import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  ArrowRight,
  Layers,
  FileCode2,
  Share2,
  Compass,
  Shield,
  Zap,
  Users,
  Terminal,
  GitCompare,
  Globe,
  Lock,
  CheckCircle2,
  Copy,
  Server,
  Eye,
  Code2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import InteractivePreview from '@/components/InteractivePreview';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const { data } = await auth.getSession();
  const session = data?.user;

  return (
    <div className="flex min-h-screen flex-col bg-dark-950 text-white selection:bg-brand-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-zinc-800/80 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/OrbitAPI.png" alt="Orbit API Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">Orbit API</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#quickstart" className="text-sm text-zinc-400 hover:text-white transition-colors">Quick Start</a>
            <a href="#comparison" className="text-sm text-zinc-400 hover:text-white transition-colors">Why Orbit</a>
          </nav>

          <nav className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-500 transition-colors"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-500 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-60px)] flex flex-col justify-center py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/30 px-3 py-1 text-xs font-semibold text-brand-400 mb-6 animate-fade-in-up [animation-fill-mode:backwards]"> */}
          {/* <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Free &amp; Open Source — Self-Hosted API Platform
          </div> */}

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white animate-fade-in-up [animation-fill-mode:backwards] [animation-delay:150ms]">
            Track your APIs&apos; evolution <br />
            <span className="gradient-text font-black">like never before</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 animate-fade-in-up [animation-fill-mode:backwards] [animation-delay:300ms]">
            A beautiful, web-based Postman alternative that versions your API responses, auto-detects schemas, and visualizes differences over time. Run it locally for your team — zero cost, total control.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 animate-fade-in-up [animation-fill-mode:backwards] [animation-delay:450ms]">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer neon-glow"
            >
              {session ? 'Go to Dashboard' : 'Start Testing Free'}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#quickstart"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 px-6 py-3 text-base font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
            >
              <Terminal className="h-4 w-4" />
              Quick Start
            </a>
          </div>
        </div>

        {/* Dynamic UI Preview Frame */}
        <div className="mt-12 animate-fade-in-up [animation-fill-mode:backwards] [animation-delay:600ms]">
          <InteractivePreview />
        </div>
      </section>

      {/* ─── Value Propositions ─── */}
      <section className="relative px-4 py-28 sm:px-6 lg:px-8 border-t border-zinc-800/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.04),transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Why Orbit API</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Built for teams who ship fast
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 leading-relaxed">
              Bridge the gap between your frontend and backend teams with real-time API documentation that writes itself.
            </p>
          </div>

          {/* Row 1 — Self-Hosted */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-16">
            <div className="flex items-start gap-5 flex-1">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 border border-brand-500/10">
                <Shield className="h-7 w-7 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">100% Self-Hosted &amp; Private</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Deploy on your own infrastructure using Docker. All API keys, tokens, and response snapshots stay within your private network. Zero vendor lock-in, full data sovereignty.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-600/8 border border-brand-500/15 px-3 py-1 text-[11px] font-semibold text-brand-400">Docker Ready</span>
                  <span className="rounded-full bg-brand-600/8 border border-brand-500/15 px-3 py-1 text-[11px] font-semibold text-brand-400">On-Premise</span>
                  <span className="rounded-full bg-brand-600/8 border border-brand-500/15 px-3 py-1 text-[11px] font-semibold text-brand-400">Air-Gapped</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Zero-Config */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-16">
            <div className="flex items-start gap-5 flex-1">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                <Zap className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Zero-Config Local Development</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Connect directly to local APIs — Laravel, Express, Spring Boot, Django — without CORS workarounds or proxy hacks. Works on localhost out of the box.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/8 border border-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">No CORS</span>
                  <span className="rounded-full bg-emerald-500/8 border border-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">Localhost</span>
                  <span className="rounded-full bg-emerald-500/8 border border-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">Any Framework</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3 — Team Sync */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex items-start gap-5 flex-1">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/10">
                <Users className="h-7 w-7 text-sky-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Team-First Documentation</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Share API collections as live documentation. Your backend engineers define contracts, your frontend engineers consume them — everyone stays on the same page, always.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-500/8 border border-sky-500/15 px-3 py-1 text-[11px] font-semibold text-sky-400">Share Links</span>
                  <span className="rounded-full bg-sky-500/8 border border-sky-500/15 px-3 py-1 text-[11px] font-semibold text-sky-400">Live Docs</span>
                  <span className="rounded-full bg-sky-500/8 border border-sky-500/15 px-3 py-1 text-[11px] font-semibold text-sky-400">Auto-Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="px-4 py-28 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Core Features</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Everything you need for API development
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400">
              A comprehensive toolkit designed to supercharge your API design, testing, and documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/30 rounded-3xl border border-zinc-800/60 overflow-hidden">
            {[
              {
                icon: <Compass className="h-6 w-6" />,
                color: 'brand',
                title: 'Full-Featured API Client',
                desc: 'Send GET, POST, PUT, DELETE requests with custom headers, query parameters, and JSON/form body types.',
                extra: (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                      <span key={m} className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold text-zinc-500 tracking-wider">{m}</span>
                    ))}
                  </div>
                ),
              },
              {
                icon: <Layers className="h-6 w-6" />,
                color: 'emerald',
                title: 'Response Versioning',
                desc: 'Auto-save every response as a snapshot. Track schema history and pinpoint exactly what changed between API versions.',
              },
              {
                icon: <FileCode2 className="h-6 w-6" />,
                color: 'sky',
                title: 'Smart Schema Detection',
                desc: 'Automatically detect response types — strings, booleans, numbers, nested objects, arrays — and generate type definitions.',
              },
              {
                icon: <GitCompare className="h-6 w-6" />,
                color: 'amber',
                title: 'Visual Diff Engine',
                desc: 'See field-level additions, removals, and type changes with color-coded visual diffs between response versions.',
              },
              {
                icon: <Share2 className="h-6 w-6" />,
                color: 'rose',
                title: 'Shareable Documentation',
                desc: 'Export collections as beautiful public pages — auto-generated, live-evolving API documentation anyone can view.',
              },
              {
                icon: <Globe className="h-6 w-6" />,
                color: 'brand',
                title: 'Collection Management',
                desc: 'Organize endpoints into collections, share via public links, and keep your entire engineering team aligned.',
              },
            ].map((feat, i) => {
              const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                brand: { bg: 'bg-brand-600/10', text: 'text-brand-400', border: 'border-brand-500/20' },
                emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
                amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
              };
              const c = colorMap[feat.color] || colorMap.brand;
              return (
                <div key={i} className="group bg-zinc-950/60 p-8 hover:bg-zinc-900/40 transition-all duration-300">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.text} border ${c.border} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feat.desc}</p>
                  {feat.extra}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Quick Start / Installation ─── */}
      <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Getting Started</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Up and running in 3 minutes
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Clone, configure, and launch. That&apos;s it — no complicated setup.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8">
                <div className="absolute -top-3.5 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-black text-white tracking-wider">
                  STEP 1
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-400 mb-5 mt-2">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Clone &amp; Install</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Clone the repository and install dependencies using your preferred package manager.
                </p>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 overflow-x-auto">
                  <code className="text-xs font-mono text-zinc-300 whitespace-pre">
                    <span className="text-zinc-500">$</span> git clone https://github.com/
                    {'\n'}  your-org/orbit-api.git
                    {'\n'}<span className="text-zinc-500">$</span> cd orbit-api
                    {'\n'}<span className="text-zinc-500">$</span> npm install
                  </code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8">
                <div className="absolute -top-3.5 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-black text-white tracking-wider">
                  STEP 2
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-5 mt-2">
                  <Code2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Configure Environment</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Copy the example environment file and set your database URL and auth secrets.
                </p>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 overflow-x-auto">
                  <code className="text-xs font-mono text-zinc-300 whitespace-pre">
                    <span className="text-zinc-500">$</span> cp .env.example .env
                    {'\n'}<span className="text-zinc-500"># Edit .env with your</span>
                    {'\n'}<span className="text-zinc-500"># database credentials</span>
                    {'\n'}<span className="text-zinc-500">$</span> npx prisma db push
                  </code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8">
                <div className="absolute -top-3.5 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-black text-white tracking-wider">
                  STEP 3
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-5 mt-2">
                  <Server className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Launch &amp; Share</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Start the development server and share it across your team on your local network.
                </p>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-3 overflow-x-auto">
                  <code className="text-xs font-mono text-zinc-300 whitespace-pre">
                    <span className="text-zinc-500">$</span> npm run dev
                    {'\n'}
                    {'\n'}<span className="text-emerald-400">✓ Ready on</span>
                    {'\n'}  http://localhost:3000
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Comparison Section ─── */}
      <section id="comparison" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Comparison</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              How Orbit API compares
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              A transparent look at what you get compared to other tools.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
                  <th className="px-6 py-4 text-sm font-bold text-zinc-400">Feature</th>
                  <th className="px-6 py-4 text-sm font-bold text-brand-400 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <img src="/OrbitAPI.png" alt="" className="h-4 w-4" />
                      Orbit API
                    </div>
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-zinc-500 text-center">Postman</th>
                  <th className="px-6 py-4 text-sm font-bold text-zinc-500 text-center">Insomnia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {[
                  { feature: 'Self-Hosted / On-Premise', orbit: true, postman: false, insomnia: false },
                  { feature: 'Response Versioning', orbit: true, postman: false, insomnia: false },
                  { feature: 'Visual Schema Diff', orbit: true, postman: false, insomnia: false },
                  { feature: 'Auto Schema Detection', orbit: true, postman: false, insomnia: false },
                  { feature: 'Public Share Pages', orbit: true, postman: true, insomnia: false },
                  { feature: 'Collection Management', orbit: true, postman: true, insomnia: true },
                  { feature: 'Free & Open Source', orbit: true, postman: false, insomnia: false },
                  { feature: 'No Account Required (Self-Host)', orbit: true, postman: false, insomnia: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-zinc-300">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      {row.orbit ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.postman ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-zinc-500 mx-auto" />
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.insomnia ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-zinc-500 mx-auto" />
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Workflow Section (Vertical Timeline) ─── */}
      <section className="px-4 py-28 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">Team Workflow</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Designed for how teams actually work
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400">
              From endpoint creation to breaking-change detection — a seamless flow.
            </p>
          </div>

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-brand-500/40 via-brand-500/20 to-emerald-500/40" />

            {/* Step 1 */}
            <div className="relative flex items-start gap-6 pb-12">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-black shadow-lg shadow-brand-600/20">
                1
              </div>
              <div className="pt-1.5">
                <h3 className="text-lg font-bold text-white mb-2">Backend defines the endpoint</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Your backend engineer creates the API endpoint, tests it in Orbit API, and saves the response as a versioned snapshot with auto-detected schema.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-6 pb-12">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-black shadow-lg shadow-brand-600/20">
                2
              </div>
              <div className="pt-1.5">
                <h3 className="text-lg font-bold text-white mb-2">Share the collection link</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  With one click, generate a public share link. Drop it in your team&apos;s Slack, Discord, or project management tool — no sign-up required to view.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-6 pb-12">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-black shadow-lg shadow-brand-600/20">
                3
              </div>
              <div className="pt-1.5">
                <h3 className="text-lg font-bold text-white mb-2">Frontend consumes the contract</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Frontend developers browse the shared collection, see exact response shapes, types, and example payloads — all auto-generated, always up to date.
                </p>
              </div>
            </div>

            {/* Step 4 — Done */}
            <div className="relative flex items-start gap-6">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="pt-1.5">
                <h3 className="text-lg font-bold text-white mb-2">Detect breaking changes early</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  When the API response changes, Orbit API instantly shows a visual diff. Catch type changes, added or removed fields before they hit production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 via-brand-950/20 to-zinc-900/60 px-8 py-16 sm:px-16">
            <div className="flex justify-center mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ready to level up your API workflow?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-400">
              Deploy Orbit API on your local network today. Free forever, no usage limits, no strings attached.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={session ? "/dashboard" : "/register"}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-8 py-3 text-base font-semibold text-white hover:bg-brand-500 hover:scale-[1.02] active:scale-[0.98] transition-all neon-glow"
              >
                {session ? 'Open Dashboard' : 'Get Started — It\'s Free'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/30 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
              >
                View on GitHub
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-zinc-800/50 bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/OrbitAPI.png" alt="Orbit API Logo" className="h-7 w-7 object-contain" />
              <span className="text-base font-bold text-white">Orbit API</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
              <a href="#quickstart" className="hover:text-zinc-300 transition-colors">Quick Start</a>
              <a href="#comparison" className="hover:text-zinc-300 transition-colors">Comparison</a>
            </div>

            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} Orbit API. Free &amp; open source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
