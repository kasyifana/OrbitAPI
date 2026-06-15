import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Activity, Play, ArrowRight, Layers, FileCode2, Share2, Compass, CheckCircle2 } from 'lucide-react';

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white neon-glow">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Orbit API</span>
          </Link>
          
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
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/30 px-3 py-1 text-xs font-semibold text-brand-400 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Next-Gen API Evolution Testing
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Track your APIs&apos; evolution <br />
            <span className="gradient-text font-black">like never before</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            A beautiful, web-based Postman alternative that versions your API responses, auto-detects schemas, and visualizes differences over time.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer neon-glow"
            >
              {session ? 'Go to Dashboard' : 'Start Testing Free'}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 px-6 py-3 text-base font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Dynamic UI Preview Frame */}
        <div className="mx-auto mt-20 max-w-5xl rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 shadow-2xl shadow-brand-500/5">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-zinc-500 font-mono">orbit-api-client.json</div>
              <div className="w-12" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sidebar column */}
              <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-3 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Collections</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded bg-brand-600/10 border border-brand-500/20 px-2 py-1 text-xs text-brand-400">
                    <Layers className="h-3 w-3" />
                    <span>Authentication API</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-400">
                    <Layers className="h-3 w-3" />
                    <span>Product Catalog</span>
                  </div>
                </div>
              </div>

              {/* Tester main column */}
              <div className="md:col-span-2 rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-3 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">GET</span>
                  <div className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-mono text-zinc-300">
                    https://api.orbit.com/users/profile
                  </div>
                  <button className="flex items-center gap-1 rounded bg-brand-600 px-3 py-1 text-xs font-bold text-white hover:bg-brand-500">
                    <Play className="h-3 w-3 fill-current" />
                    Send
                  </button>
                </div>

                {/* Diff Viewer Demo */}
                <div className="rounded border border-zinc-800/80 bg-zinc-950 p-3 space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold border-b border-zinc-800 pb-1.5">
                    <span>SNAPSHOT VERSION DIFF</span>
                    <span className="text-brand-400">v1 ➔ v2 (2 differences)</span>
                  </div>
                  <pre className="text-xs font-mono text-zinc-400 leading-relaxed overflow-x-auto">
                    {`{
  "id": 102,
  "name": "Ali",`}
                    <span className="block bg-emerald-950/50 text-emerald-400">+  "email": "ali@example.com",</span>
                    <span className="block bg-red-950/30 text-red-400/80">-  "status": "pending",</span>
                    <span className="block bg-emerald-950/50 text-emerald-400">+  "status": "active"</span>
                    {`}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-zinc-900">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need for API development
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            A comprehensive tool suite designed to supercharge your API design, debugging, and verification loops.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400 mb-4">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Full-Featured Client</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Send GET, POST, PUT, DELETE with query parameters, headers, and multiple body payloads.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400 mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Response Versioning</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Save responses as snapshots. Record history automatically, compare schemas, and track changes.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400 mb-4">
              <FileCode2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Schema Detection</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Automatically detect response body types and structure schemas (string, boolean, number, objects).
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400 mb-4">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Swagger Documentation</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Export and share beautiful public collection pages, serving as automated, live-evolving Swagger docs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-white">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-white">Orbit API</span>
          </div>
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Orbit API. Created for modern engineering teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
