'use client';

import React, { useState } from 'react';
import { Layers, Play, Loader2 } from 'lucide-react';

export default function InteractivePreview() {
  const [activeCol, setActiveCol] = useState<'auth' | 'products'>('auth');
  const [isSending, setIsSending] = useState(false);
  const [showResponse, setShowResponse] = useState(true);

  const handleSend = () => {
    setIsSending(true);
    setShowResponse(false);
    setTimeout(() => {
      setIsSending(false);
      setShowResponse(true);
    }, 800);
  };

  return (
    <div className="mx-auto mt-16 max-w-5xl rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 shadow-2xl shadow-brand-500/5 animate-fade-in duration-700">
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4">
        {/* Window Bar Controls */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 select-none">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">orbit-api-client.json</div>
          <div className="w-12" />
        </div>

        {/* Mock columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Sidebar Selection */}
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-3 space-y-3.5 select-none">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Collections</div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveCol('auth');
                  setShowResponse(true);
                }}
                className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-left transition-all border ${
                  activeCol === 'auth'
                    ? 'bg-brand-600/15 border-brand-500/30 text-brand-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/25'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Authentication API</span>
              </button>

              <button
                onClick={() => {
                  setActiveCol('products');
                  setShowResponse(true);
                }}
                className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-left transition-all border ${
                  activeCol === 'products'
                    ? 'bg-brand-600/15 border-brand-500/30 text-brand-400 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/25'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Product Catalog API</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic request / response simulation */}
          <div className="md:col-span-2 rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-3 space-y-4">
            {/* Request Header Bar */}
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/10">
                GET
              </span>
              <div className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-300 truncate">
                {activeCol === 'auth'
                  ? 'https://api.orbit.com/users/profile'
                  : 'https://api.orbit.com/products/catalog'}
              </div>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center justify-center gap-1.5 rounded bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:scale-100 disabled:opacity-50 px-4 py-1.5 text-xs font-bold text-white transition-all min-w-[76px] cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 fill-current" />
                )}
                <span>Send</span>
              </button>
            </div>

            {/* Dynamic Response Box */}
            <div className="rounded border border-zinc-800/80 bg-zinc-950 p-4 space-y-3 min-h-[180px] flex flex-col justify-between">
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold border-b border-zinc-900 pb-1.5 select-none">
                <span>SNAPSHOT VERSION DIFF</span>
                <span className="text-brand-400 font-semibold uppercase tracking-wider">
                  v1 ➔ v2 ({activeCol === 'auth' ? '2 changes' : '3 changes'})
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center font-mono">
                {isSending && (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-550 space-y-2 select-none">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    <span className="text-[10px] tracking-widest uppercase font-bold animate-pulse">Running diff analysis...</span>
                  </div>
                )}

                {showResponse && !isSending && activeCol === 'auth' && (
                  <pre className="text-xs text-zinc-400 leading-relaxed overflow-x-auto animate-fade-in duration-300 select-text">
                    {`{
  "id": 102,
  "name": "Ali",`}
                    <span className="block bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 my-0.5 select-all">+  "email": "ali@example.com",</span>
                    <span className="block bg-red-950/20 text-red-400/80 border-l-2 border-red-500/30 pl-2 my-0.5 select-all">-  "status": "pending",</span>
                    <span className="block bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 my-0.5 select-all">+  "status": "active"</span>
                    {`}`}
                  </pre>
                )}

                {showResponse && !isSending && activeCol === 'products' && (
                  <pre className="text-xs text-zinc-400 leading-relaxed overflow-x-auto animate-fade-in duration-300 select-text">
                    {`{
  "id": 501,
  "title": "Orbit Pro Laptop",`}
                    <span className="block bg-red-950/20 text-red-400/80 border-l-2 border-red-500/30 pl-2 my-0.5 select-all">-  "price": 1499.00,</span>
                    <span className="block bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 my-0.5 select-all">+  "price": 1299.99,</span>
                    <span className="block bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 my-0.5 select-all">+  "stock": 42,</span>
                    <span className="block bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 my-0.5 select-all">+  "inStock": true</span>
                    {`}`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
