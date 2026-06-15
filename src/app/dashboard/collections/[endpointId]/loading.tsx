import React from 'react';
import { Layers, ChevronRight } from 'lucide-react';

export default function EndpointLoadingSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-pulse max-w-6xl">
      {/* Header bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div className="space-y-2.5 flex-1 min-w-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-650">
            <Layers className="h-3.5 w-3.5 text-zinc-700" />
            <span>Collections</span>
            <ChevronRight className="h-3 w-3 text-zinc-700" />
            <div className="h-3.5 w-24 bg-zinc-800/80 rounded" />
          </div>

          {/* Title & Method */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-6 w-14 bg-zinc-800/80 rounded-lg" />
            <div className="h-8 w-48 bg-zinc-800/80 rounded-lg" />
          </div>
          
          {/* Path */}
          <div className="h-4.5 w-64 bg-zinc-800/40 rounded font-mono" />
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-zinc-800/85 rounded-lg" />
          <div className="h-8 w-36 bg-zinc-800/40 rounded-lg" />
        </div>
      </div>

      {/* Tabs list skeleton */}
      <div className="pb-2">
        <div className="flex gap-6 pb-2">
          <div className="h-4.5 w-28 bg-zinc-800/80 rounded" />
          <div className="h-4.5 w-24 bg-zinc-800/40 rounded" />
          <div className="h-4.5 w-28 bg-zinc-800/40 rounded" />
          <div className="h-4.5 w-24 bg-zinc-800/40 rounded" />
          <div className="h-4.5 w-20 bg-zinc-800/40 rounded" />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Main documentation) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview / Description */}
          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-3">
            <div className="h-4 w-24 bg-zinc-800/85 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-zinc-800/40 rounded" />
              <div className="h-3 w-5/6 bg-zinc-800/40 rounded" />
              <div className="h-3 w-4/6 bg-zinc-800/40 rounded" />
            </div>
          </div>

          {/* Request Parameters Skeleton */}
          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-4">
            <div className="h-4.5 w-32 bg-zinc-800/85 rounded" />
            <div className="space-y-3">
              <div className="flex gap-4 items-center">
                <div className="h-4 w-16 bg-zinc-800/80 rounded" />
                <div className="h-4 w-32 bg-zinc-800/40 rounded" />
                <div className="h-4 w-12 bg-zinc-800/20 rounded ml-auto" />
              </div>
              <div className="flex gap-4 items-center">
                <div className="h-4 w-20 bg-zinc-800/80 rounded" />
                <div className="h-4 w-44 bg-zinc-800/40 rounded" />
                <div className="h-4 w-12 bg-zinc-800/20 rounded ml-auto" />
              </div>
            </div>
          </div>

          {/* Schema Selector */}
          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="h-4 w-36 bg-zinc-800/85 rounded" />
              <div className="h-4.5 w-24 bg-zinc-800/60 rounded" />
            </div>
            <div className="h-36 bg-zinc-900/10 rounded-lg p-4 space-y-2">
              <div className="h-3.5 w-1/3 bg-zinc-800/60 rounded" />
              <div className="h-3.5 w-2/3 bg-zinc-800/40 rounded ml-4" />
              <div className="h-3.5 w-1/2 bg-zinc-800/40 rounded ml-4" />
              <div className="h-3.5 w-3/4 bg-zinc-800/40 rounded ml-4" />
            </div>
          </div>
        </div>

        {/* Right Column (Side preview panel) */}
        <div className="space-y-6">
          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-4">
            <div className="h-4.5 w-28 bg-zinc-800/85 rounded" />
            <div className="h-28 bg-zinc-900/10 rounded-lg p-3 space-y-3">
              <div className="flex justify-between text-xs">
                <div className="h-3.5 w-12 bg-zinc-800/50 rounded" />
                <div className="h-3.5 w-16 bg-zinc-800/80 rounded" />
              </div>
              <div className="flex justify-between text-xs">
                <div className="h-3.5 w-10 bg-zinc-800/50 rounded" />
                <div className="h-3.5 w-12 bg-zinc-800/80 rounded" />
              </div>
              <div className="flex justify-between text-xs">
                <div className="h-3.5 w-16 bg-zinc-800/50 rounded" />
                <div className="h-3.5 w-24 bg-zinc-800/80 rounded" />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-900/20 p-5 space-y-3">
            <div className="h-4 w-36 bg-zinc-800/85 rounded" />
            <div className="space-y-2.5 pt-1">
              <div className="h-8 bg-zinc-900/10 rounded flex items-center px-3 justify-between">
                <div className="h-3.5 w-20 bg-zinc-800/60 rounded" />
                <div className="h-3.5 w-16 bg-zinc-800/40 rounded" />
              </div>
              <div className="h-8 bg-zinc-900/10 rounded flex items-center px-3 justify-between">
                <div className="h-3.5 w-24 bg-zinc-800/60 rounded" />
                <div className="h-3.5 w-12 bg-zinc-800/40 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
