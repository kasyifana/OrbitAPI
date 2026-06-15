'use client';

import React, { useState } from 'react';
import { 
  Activity, Layers, FileCode, Clock, Play, Clipboard, 
  ChevronRight, ChevronDown, CheckCircle2, Globe, ArrowRight 
} from 'lucide-react';

interface ShareCollectionClientProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
  };
  endpoints: {
    id: string;
    name: string;
    method: string;
    path: string;
    description: string | null;
    responseSchema: any;
    snapshots: {
      id: string;
      version: number;
      statusCode: number;
      responseTime: number;
      responseSize: number;
      responseBody: string;
      createdAt: string;
    }[];
  }[];
}

function RenderSchemaNode({ name, node }: { name: string; node: any }) {
  if (!node) return null;
  const isObject = node.type === 'object' && node.properties;
  const isArray = node.type === 'array' && node.items;

  return (
    <div className="pl-4 border-l border-zinc-800 mt-1">
      <div className="flex items-center gap-2 text-xs py-1">
        <span className="font-mono text-zinc-300 font-semibold">{name}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-brand-400">
          {node.type}
        </span>
      </div>
      {isObject && (
        <div className="space-y-0.5 mt-0.5">
          {Object.entries(node.properties).map(([key, child]: any) => (
            <RenderSchemaNode key={key} name={key} node={child} />
          ))}
        </div>
      )}
      {isArray && (
        <div className="mt-0.5 pl-2">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block pl-2 mb-0.5">Array Items:</span>
          <RenderSchemaNode name="item" node={node.items} />
        </div>
      )}
    </div>
  );
}

export default function ShareCollectionClient({ collection, endpoints }: ShareCollectionClientProps) {
  // Expand/collapse state for each endpoint documentation
  const [expandedEps, setExpandedEps] = useState<Record<string, boolean>>(
    endpoints.reduce((acc, ep) => ({ ...acc, [ep.id]: true }), {})
  );

  // Active sub-tab inside each endpoint: 'docs', 'snapshots', 'snippets'
  const [subTabs, setSubTabs] = useState<Record<string, 'docs' | 'snapshots' | 'snippets'>>(
    endpoints.reduce((acc, ep) => ({ ...acc, [ep.id]: 'docs' }), {})
  );

  // Selected snapshot version for each endpoint
  const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>(
    endpoints.reduce((acc, ep) => ({ 
      ...acc, 
      [ep.id]: ep.snapshots[ep.snapshots.length - 1]?.version || 1 
    }), {})
  );

  // Code snippet language selection for each endpoint
  const [selectedLangs, setSelectedLangs] = useState<Record<string, 'curl' | 'javascript' | 'python'>>(
    endpoints.reduce((acc, ep) => ({ ...acc, [ep.id]: 'curl' }), {})
  );

  const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});

  const toggleEndpoint = (id: string) => {
    setExpandedEps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setSubTab = (epId: string, tab: 'docs' | 'snapshots' | 'snippets') => {
    setSubTabs(prev => ({ ...prev, [epId]: tab }));
  };

  const setSelectedVersion = (epId: string, version: number) => {
    setSelectedVersions(prev => ({ ...prev, [epId]: version }));
  };

  const setSelectedLang = (epId: string, lang: 'curl' | 'javascript' | 'python') => {
    setSelectedLangs(prev => ({ ...prev, [epId]: lang }));
  };

  const copyCode = (epId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodes(prev => ({ ...prev, [epId]: true }));
    setTimeout(() => {
      setCopiedCodes(prev => ({ ...prev, [epId]: false }));
    }, 2000);
  };

  const getPrettySnapshotBody = (epId: string, versionNum: number) => {
    const ep = endpoints.find(e => e.id === epId);
    const snap = ep?.snapshots.find(s => s.version === versionNum);
    if (!snap) return '';
    try {
      const parsed = JSON.parse(snap.responseBody);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return snap.responseBody;
    }
  };

  const generateSnippet = (ep: any, lang: string) => {
    const fullUrl = `https://api.example.com${ep.path}`;
    if (lang === 'curl') {
      return `curl -X ${ep.method} "${fullUrl}" \\\n  -H "Accept: application/json"`;
    }
    if (lang === 'javascript') {
      return `fetch("${fullUrl}", {\n  method: "${ep.method}",\n  headers: {\n    "Accept": "application/json"\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`;
    }
    if (lang === 'python') {
      return `import requests\n\nurl = "${fullUrl}"\nheaders = {"Accept": "application/json"}\n\nresponse = requests.${ep.method.toLowerCase()}(url, headers=headers)\nprint(response.json())`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-dark-950 text-zinc-300 flex flex-col font-sans select-text">
      {/* Public Header Bar */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 border-b border-zinc-900 px-6 py-4 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-white font-bold neon-glow">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Documentation Shared via</span>
            <span className="text-sm font-extrabold text-white">Orbit API</span>
          </div>
        </div>

        <a 
          href="/" 
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-1.5 text-xs font-bold hover:bg-zinc-900 hover:text-white transition-all"
        >
          <span>Create Your Own Docs</span>
          <ArrowRight className="h-3 w-3" />
        </a>
      </header>

      {/* Main content view */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-8 animate-fade-in">
        
        {/* Collection Metadata Card */}
        <div className="border-b border-zinc-900 pb-6 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
            <Layers className="h-4 w-4" />
            <span>API Collection Snapshot</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{collection.name}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {collection.description || 'This API collection contains endpoint specification lists, response version snapshots, and interactive sandbox helpers.'}
          </p>
        </div>

        {/* Endpoints Loop */}
        <div className="space-y-6">
          {endpoints.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-850 rounded-xl text-zinc-500">
              No registered endpoints found in this collection.
            </div>
          ) : (
            endpoints.map(ep => {
              const isExpanded = expandedEps[ep.id];
              const activeSubTab = subTabs[ep.id] || 'docs';
              const selectedVer = selectedVersions[ep.id] || 1;
              const selectedLang = selectedLangs[ep.id] || 'curl';
              const isCopied = copiedCodes[ep.id];

              const methodColors: Record<string, string> = {
                GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30',
                POST: 'text-brand-400 bg-brand-950/20 border-brand-500/30',
                PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/30',
                PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/20',
                DELETE: 'text-red-400 bg-red-950/20 border-red-500/30'
              };

              const activeSnapshot = ep.snapshots.find(s => s.version === selectedVer);

              return (
                <div key={ep.id} className="rounded-xl border border-zinc-900 bg-zinc-900/20 overflow-hidden shadow-sm">
                  {/* Endpoint Header Bar */}
                  <div 
                    onClick={() => toggleEndpoint(ep.id)}
                    className="flex items-center justify-between p-4 bg-zinc-900/30 border-b border-zinc-900 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 w-16 text-center ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-zinc-400 truncate shrink-0 max-w-xs">{ep.path}</span>
                      <span className="text-xs text-white truncate font-bold ml-2 hidden sm:inline">{ep.name}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4.5 w-4.5 text-zinc-500" /> : <ChevronRight className="h-4.5 w-4.5 text-zinc-500" />}
                  </div>

                  {/* Expanded documentation views */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 animate-scale-up">
                      
                      {/* Endpoint description */}
                      {ep.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-3">
                          {ep.description}
                        </p>
                      )}

                      {/* Sub-tab navigation panels */}
                      <div className="border-b border-zinc-850 flex items-center justify-between">
                        <div className="flex gap-4">
                          {[
                            { id: 'docs', label: 'Response Schema' },
                            { id: 'snapshots', label: `Version snapshots (${ep.snapshots.length})` },
                            { id: 'snippets', label: 'Client Snippets' }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSubTab(ep.id, t.id as any)}
                              className={`border-b-2 pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                activeSubTab === t.id
                                  ? 'border-brand-500 text-white'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SUB TAB: RESPONSE SCHEMA */}
                      {activeSubTab === 'docs' && (
                        <div className="space-y-3">
                          {ep.responseSchema ? (
                            <div className="rounded border border-zinc-850 bg-zinc-950 p-4 max-h-72 overflow-y-auto">
                              <RenderSchemaNode name="response" node={ep.responseSchema} />
                            </div>
                          ) : (
                            <div className="text-xs italic text-zinc-600 p-2.5">No schema captured for this endpoint.</div>
                          )}
                        </div>
                      )}

                      {/* SUB TAB: VERSION SNAPSHOTS */}
                      {activeSubTab === 'snapshots' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                          
                          {/* Versions selection buttons */}
                          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
                            {ep.snapshots.map(s => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedVersion(ep.id, s.version)}
                                className={`rounded px-3 py-1.5 text-xs text-left shrink-0 transition-all font-semibold flex items-center justify-between border ${
                                  selectedVer === s.version
                                    ? 'bg-zinc-900 border-zinc-800 text-white'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  v{s.version}
                                </span>
                                <span className="text-[9px] font-mono opacity-80">({s.statusCode})</span>
                              </button>
                            ))}
                          </div>

                          {/* Version preview content */}
                          <div className="md:col-span-3 space-y-3">
                            {activeSnapshot ? (
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-500 border-b border-zinc-900 pb-2">
                                  <span>STATUS: <span className={activeSnapshot.statusCode < 400 ? 'text-emerald-400' : 'text-red-400'}>{activeSnapshot.statusCode}</span></span>
                                  <span>TIME: <span className="text-zinc-400">{activeSnapshot.responseTime} ms</span></span>
                                  <span>SIZE: <span className="text-zinc-400">{activeSnapshot.responseSize} B</span></span>
                                  <span>SAVED: <span className="text-zinc-400">{new Date(activeSnapshot.createdAt).toLocaleDateString()}</span></span>
                                </div>
                                <div className="rounded border border-zinc-850 bg-zinc-950 p-4 overflow-auto max-h-64 font-mono text-[11px] text-zinc-300">
                                  <pre>{getPrettySnapshotBody(ep.id, selectedVer)}</pre>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-600 italic py-2">Select a version snapshot to preview response.</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SUB TAB: CLIENT SNIPPETS */}
                      {activeSubTab === 'snippets' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Format:</span>
                            <select
                              value={selectedLang}
                              onChange={(e) => setSelectedLang(ep.id, e.target.value as any)}
                              className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                            >
                              <option value="curl">cURL Request</option>
                              <option value="javascript">Javascript Fetch</option>
                              <option value="python">Python Requests</option>
                            </select>
                          </div>

                          <div className="relative">
                            <pre className="rounded border border-zinc-855 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-300 overflow-x-auto leading-relaxed max-h-40">
                              {generateSnippet(ep, selectedLang)}
                            </pre>
                            <button
                              onClick={() => copyCode(ep.id, generateSnippet(ep, selectedLang))}
                              className="absolute right-2.5 top-2.5 rounded p-1 bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
                              title="Copy code"
                            >
                              <Clipboard className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isCopied && <span className="block text-[10px] text-emerald-400 font-bold text-right">Snippet copied!</span>}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
        Powered by Orbit API © {new Date().getFullYear()}. Dynamic API snapshot and tracking system.
      </footer>
    </div>
  );
}
