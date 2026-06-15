'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { 
  Activity, Layers, History, Globe, LogOut, Plus, ChevronRight, 
  ChevronDown, Settings, Play, Database, FileText, X, AlertCircle, Loader2
} from 'lucide-react';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  collections: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    endpoints: {
      id: string;
      name: string;
      method: string;
      path: string;
    }[];
  }[];
  environments: {
    id: string;
    name: string;
    variables: any;
  }[];
  history: {
    id: string;
    method: string;
    url: string;
    createdAt: Date | string;
  }[];
}

export default function DashboardSidebar({ user, collections, environments, history }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Dialog visibility states
  const [showColModal, setShowColModal] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colVis, setColVis] = useState('private');
  
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envName, setEnvName] = useState('');
  const [envVars, setEnvVars] = useState('{\n  "BASE_URL": "https://api.example.com"\n}');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importVis, setImportVis] = useState('private');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hydration safety: Defer rendering time formatting until client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Expand/collapse states for collections
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});

  const toggleCollection = (id: string) => {
    setExpandedCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  // Submit Collection
  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: colName, description: colDesc, visibility: colVis }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create collection');
      }

      setColName('');
      setColDesc('');
      setColVis('private');
      setShowColModal(false);
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Submit Postman Collection Import
  const handleImportCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    let parsed;
    try {
      parsed = JSON.parse(importJson);
    } catch (err) {
      setError('Invalid JSON content. Please paste a valid Postman Collection JSON.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importData: parsed, visibility: importVis }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to import collection');
      }

      setImportJson('');
      setShowImportModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  // Submit Environment
  const createEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envName.trim()) return;

    // Validate JSON variables
    try {
      JSON.parse(envVars);
    } catch (err) {
      setError('Variables must be a valid JSON object');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: envName, variables: JSON.parse(envVars) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create environment');
      }

      setEnvName('');
      setEnvVars('{\n  "BASE_URL": "https://api.example.com"\n}');
      setShowEnvModal(false);
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300 select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-900 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-white font-bold">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-md font-bold tracking-tight text-white">Orbit API Dashboard</span>
        </Link>
      </div>

      {/* Main Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Quick Access links */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              pathname === '/dashboard' 
                ? 'bg-zinc-900 text-white border-l-2 border-brand-500' 
                : 'hover:bg-zinc-900/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-zinc-400" />
              <span>Metrics Overview</span>
            </div>
          </Link>

          <Link
            href="/dashboard/tester"
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              pathname === '/dashboard/tester' 
                ? 'bg-zinc-900 text-white border-l-2 border-brand-500' 
                : 'hover:bg-zinc-900/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Play className="h-4 w-4 text-emerald-400" />
              <span>API Request Tester</span>
            </div>
          </Link>
        </div>

        {/* Collections */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span>Collections</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => { setError(''); setImportJson(''); setShowImportModal(true); }}
                className="rounded px-1.5 py-0.5 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-[9px] uppercase font-bold border border-zinc-800 bg-zinc-900/20"
                title="Import Postman Collection"
              >
                Import
              </button>
              <button 
                onClick={() => { setError(''); setShowColModal(true); }}
                className="rounded p-0.5 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                title="Create Collection"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {collections.length === 0 ? (
              <div className="px-3 py-2 text-xs italic text-zinc-600">No collections created yet.</div>
            ) : (
              collections.map(col => (
                <div key={col.id} className="space-y-0.5">
                  <div 
                    onClick={() => toggleCollection(col.id)}
                    className="group flex items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-zinc-900/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {expandedCols[col.id] ? (
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      )}
                      <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate text-zinc-300 group-hover:text-white font-medium">{col.name}</span>
                    </div>
                    <span className="text-[10px] rounded bg-zinc-800 px-1 py-0.5 text-zinc-500 capitalize shrink-0">
                      {col.visibility}
                    </span>
                  </div>

                  {expandedCols[col.id] && (
                    <div className="pl-6 border-l border-zinc-900 ml-5 space-y-0.5 mt-0.5 mb-1 animate-scale-up">
                      {col.endpoints.length === 0 ? (
                        <div className="px-3 py-1 text-xs italic text-zinc-600">No endpoints.</div>
                      ) : (
                        col.endpoints.map(ep => {
                          const isEpActive = pathname === `/dashboard/collections/${ep.id}`;
                          const methodColors: Record<string, string> = {
                            GET: 'text-emerald-400 bg-emerald-950/20',
                            POST: 'text-brand-400 bg-brand-950/20',
                            PUT: 'text-amber-400 bg-amber-950/20',
                            PATCH: 'text-yellow-500 bg-yellow-950/10',
                            DELETE: 'text-red-400 bg-red-950/20'
                          };

                          return (
                            <Link
                              key={ep.id}
                              href={`/dashboard/collections/${ep.id}`}
                              className={`flex items-center gap-2 rounded px-2 py-1 text-xs truncate transition-colors ${
                                isEpActive 
                                  ? 'bg-zinc-900 text-white font-semibold' 
                                  : 'hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <span className={`text-[9px] font-black px-1 rounded scale-90 shrink-0 w-10 text-center ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                                {ep.method}
                              </span>
                              <span className="truncate">{ep.name}</span>
                            </Link>
                          );
                        })
                      )}
                      <Link
                        href={{ pathname: '/dashboard/tester', query: { colId: col.id } }}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-zinc-500 hover:text-brand-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Register Endpoint</span>
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Environments */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span>Environments</span>
            <button 
              onClick={() => { setError(''); setShowEnvModal(true); }}
              className="rounded p-0.5 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            {environments.length === 0 ? (
              <div className="px-3 py-1.5 text-xs italic text-zinc-600">No environments config.</div>
            ) : (
              environments.map(env => (
                <div key={env.id} className="flex items-center justify-between rounded px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900/30">
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate text-zinc-300 font-medium">{env.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {Object.keys(env.variables || {}).length} vars
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-1.5">
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            <span>Recent History</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {history.length === 0 ? (
              <div className="px-3 py-1.5 text-xs italic text-zinc-600">No request history.</div>
            ) : (
              history.map(item => {
                const methodColors: Record<string, string> = {
                  GET: 'text-emerald-400',
                  POST: 'text-brand-400',
                  PUT: 'text-amber-400',
                  PATCH: 'text-yellow-500',
                  DELETE: 'text-red-400'
                };
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Redirect to tester page and pass historyId
                      router.push(`/dashboard/tester?historyId=${item.id}`);
                    }}
                    className="flex flex-col gap-0.5 rounded p-2 text-xs hover:bg-zinc-900/50 cursor-pointer transition-colors border border-zinc-900/50 hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`font-extrabold text-[9px] ${methodColors[item.method] || 'text-zinc-500'}`}>
                        {item.method}
                      </span>
                      <span className="truncate font-mono text-[10px] text-zinc-300">{item.url}</span>
                    </div>
                    <span className="text-[9px] text-zinc-600 self-end">
                      {mounted 
                        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                        : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* User Footer Settings & Logout */}
      <div className="border-t border-zinc-900 bg-zinc-950/80 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white uppercase border border-zinc-700">
            {user.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.name}</div>
            <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-red-950/20 hover:text-red-400 transition-all border border-zinc-900 hover:border-red-500/20 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* MODAL: CREATE COLLECTION */}
      {showColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-400" />
                <span>Create Collection</span>
              </h3>
              <button 
                onClick={() => setShowColModal(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={createCollection} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Name</label>
                <input 
                  type="text" 
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="Authentication API"
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Description</label>
                <textarea 
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder="Endpoints for signup, signin, session checks..."
                  rows={2}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Visibility</label>
                <select 
                  value={colVis}
                  onChange={(e) => setColVis(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="private">Private (Only You)</option>
                  <option value="unlisted">Unlisted (Anyone with link)</option>
                  <option value="public">Public (Visible in public list)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowColModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ENVIRONMENT */}
      {showEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-400" />
                <span>Create Environment</span>
              </h3>
              <button 
                onClick={() => setShowEnvModal(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={createEnvironment} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Environment Name</label>
                <input 
                  type="text" 
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  placeholder="Development"
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Variables (JSON format)</label>
                <textarea 
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  rows={6}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-brand-500 focus:outline-none resize-y"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEnvModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT POSTMAN COLLECTION */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-400" />
                <span>Import Postman Collection</span>
              </h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleImportCollection} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Paste Collection JSON
                </label>
                <textarea 
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='Paste the full Postman v2.1.0 Collection JSON here...'
                  rows={8}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white placeholder-zinc-700 focus:border-brand-500 focus:outline-none resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Visibility</label>
                <select 
                  value={importVis}
                  onChange={(e) => setImportVis(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="private">Private (Only You)</option>
                  <option value="unlisted">Unlisted (Anyone with link)</option>
                  <option value="public">Public (Visible in public list)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowImportModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !importJson.trim()}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
