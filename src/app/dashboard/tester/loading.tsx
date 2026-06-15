import React from 'react';

export default function TesterLoadingSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-pulse max-w-6xl">
      {/* Title */}
      <div className="flex items-center justify-between pb-5">
        <div className="space-y-1">
          <div className="h-7 w-48 bg-zinc-800/80 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-800/40 rounded" />
        </div>
      </div>

      {/* URL input bar skeleton */}
      <div className="flex gap-2 bg-zinc-900/40 p-2 rounded-xl">
        <div className="h-9 w-24 bg-zinc-800/85 rounded-lg" />
        <div className="h-9 flex-1 bg-zinc-800/40 rounded-lg" />
        <div className="h-9 w-24 bg-brand-600/60 rounded-lg" />
      </div>

      {/* Two columns: Request Builder and Response Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Request Panel */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2">
            <div className="h-4.5 w-32 bg-zinc-800/80 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-zinc-800/40 rounded" />
              <div className="h-6 w-16 bg-zinc-800/40 rounded" />
            </div>
          </div>
          
          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-4">
            <div className="flex gap-4 pb-2">
              <div className="h-4 w-16 bg-zinc-800/80 rounded" />
              <div className="h-4 w-20 bg-zinc-800/40 rounded" />
              <div className="h-4 w-12 bg-zinc-800/40 rounded" />
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-4 items-center">
                <div className="h-8 w-1/3 bg-zinc-800/40 rounded" />
                <div className="h-8 w-2/3 bg-zinc-800/40 rounded" />
              </div>
              <div className="flex gap-4 items-center">
                <div className="h-8 w-1/3 bg-zinc-800/40 rounded" />
                <div className="h-8 w-2/3 bg-zinc-800/40 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Response Panel */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2">
            <div className="h-4.5 w-24 bg-zinc-800/80 rounded" />
            <div className="h-4.5 w-32 bg-zinc-800/40 rounded" />
          </div>

          <div className="rounded-xl bg-zinc-900/10 h-72 flex flex-col justify-center items-center text-zinc-600 p-6 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-zinc-800 animate-spin" />
            <div className="h-3 w-40 bg-zinc-800/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
