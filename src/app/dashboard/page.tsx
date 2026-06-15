import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  Play, Layers, Globe, History, Activity, TrendingUp, CheckCircle, 
  ArrowRight, FileText, Share2, ShieldAlert
} from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { data } = await auth.getSession();
  if (!data || !data.user) {
    redirect('/login');
  }

  const userId = data.user.id;

  // Query usage statistics for dashboard display
  const [totalRequests, collectionsCount, publicColCount, envCount, recentHistory] = await Promise.all([
    db.historyItem.count({ where: { userId } }),
    db.collection.count({ where: { userId } }),
    db.collection.count({ where: { userId, visibility: 'public' } }),
    db.environment.count({ where: { userId } }),
    db.historyItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Hello, <span className="gradient-text">{data.user.name}</span>!
        </h1>
        <p className="text-sm text-zinc-400">
          Welcome back to Orbit API. Here is a snapshot of your current workspaces.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric Card: Requests */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Requests</span>
            <div className="rounded bg-brand-600/10 p-1.5 text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{totalRequests}</span>
            <span className="block mt-1 text-xs text-zinc-500">All-time executed requests</span>
          </div>
        </div>

        {/* Metric Card: Collections */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Collections</span>
            <div className="rounded bg-brand-600/10 p-1.5 text-brand-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{collectionsCount}</span>
            <span className="block mt-1 text-xs text-zinc-500">API collections managed</span>
          </div>
        </div>

        {/* Metric Card: Shared Collections */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shared Docs</span>
            <div className="rounded bg-brand-600/10 p-1.5 text-brand-400">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{publicColCount}</span>
            <span className="block mt-1 text-xs text-zinc-500">Public shareable links active</span>
          </div>
        </div>

        {/* Metric Card: Environments */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Environments</span>
            <div className="rounded bg-brand-600/10 p-1.5 text-brand-400">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">{envCount}</span>
            <span className="block mt-1 text-xs text-zinc-500">Testing configurations defined</span>
          </div>
        </div>
      </div>

      {/* Main split grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Activity Logs */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-brand-400" />
            <span>Recent Testing Activity</span>
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden divide-y divide-zinc-800/80">
            {recentHistory.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 space-y-2">
                <ShieldAlert className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-medium">No request history found</p>
                <p className="text-xs text-zinc-600">Start sending requests from the API Tester to record your history.</p>
              </div>
            ) : (
              recentHistory.map((item) => {
                const isSuccess = item.responseStatus && item.responseStatus < 400;
                const methodColors: Record<string, string> = {
                  GET: 'text-emerald-400 bg-emerald-950/20',
                  POST: 'text-brand-400 bg-brand-950/20',
                  PUT: 'text-amber-400 bg-amber-950/20',
                  PATCH: 'text-yellow-500 bg-yellow-950/10',
                  DELETE: 'text-red-400 bg-red-950/20'
                };

                return (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-3 truncate">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 w-14 text-center ${methodColors[item.method] || 'text-zinc-400 bg-zinc-800'}`}>
                        {item.method}
                      </span>
                      <span className="truncate font-mono text-xs text-zinc-300">{item.url}</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {item.responseStatus ? (
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isSuccess ? 'text-emerald-400 bg-emerald-950/20' : 'text-red-400 bg-red-950/20'}`}>
                          {item.responseStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">ERR</span>
                      )}

                      <span className="text-[10px] text-zinc-500 font-medium">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Quick Launch Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-400" />
            <span>Quick Launch</span>
          </h2>

          <div className="space-y-4">
            {/* Launch Client action */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">API Sandbox Client</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Test URLs and capture API responses immediately without configuring collections. Bypasses browser CORS constraints automatically.
              </p>
              <Link
                href="/dashboard/tester"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors w-full cursor-pointer"
              >
                <span>Launch Request Tester</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Quick documentation tips */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">How to Snapshot?</h3>
              <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-1.5">
                <li>Run request in Tester.</li>
                <li>Ensure the request works.</li>
                <li>Click <strong>&quot;Save Snapshot&quot;</strong>.</li>
                <li>Assign it to a collection.</li>
                <li>View version diffs automatically!</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
