'use client';

import React, { useState } from 'react';
import { 
  Activity, Layers, FileCode, Clock, Play, Clipboard, 
  ChevronRight, ChevronDown, CheckCircle2, Globe, ArrowRight,
  Folder, Home, Search, Menu, X
} from 'lucide-react';

interface ShareCollectionClientProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    defaultEnvId?: string | null;
  };
  endpoints: {
    id: string;
    name: string;
    method: string;
    path: string;
    description: string | null;
    folder?: string | null;
    headers?: any;
    queryParams?: any;
    bodyType?: string;
    bodyContent?: string | null;
    responseSchema: any;
    snapshots: {
      id: string;
      version: number;
      statusCode: number;
      responseTime: number;
      responseSize: number;
      responseBody: string;
      requestHeaders?: any;
      requestBody?: string | null;
      requestParams?: any;
      responseHeaders?: any;
      createdAt: string;
    }[];
  }[];
  environments?: {
    id: string;
    name: string;
    variables: Record<string, string>;
  }[];
}

function parseList(val: any) {
  if (!val) return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(parsed)) {
      return parsed.filter((item: any) => item.key);
    }
  } catch (e) {}
  return [];
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

interface SidebarEndpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  folder?: string | null;
}

interface FolderNode {
  name: string;
  fullPath: string;
  subfolders: Record<string, FolderNode>;
  endpoints: SidebarEndpoint[];
}

const buildFolderTree = (endpoints: SidebarEndpoint[]) => {
  const root: FolderNode = { name: '', fullPath: '', subfolders: {}, endpoints: [] };

  for (const ep of endpoints) {
    if (!ep.folder) {
      root.endpoints.push(ep);
    } else {
      const parts = ep.folder.split('/');
      let current = root;
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!current.subfolders[part]) {
          current.subfolders[part] = {
            name: part,
            fullPath: currentPath,
            subfolders: {},
            endpoints: []
          };
        }
        current = current.subfolders[part];
      }
      current.endpoints.push(ep);
    }
  }
  return root;
};

export default function ShareCollectionClient({ collection, endpoints, environments = [] }: ShareCollectionClientProps) {
  // Expand/collapse state for each endpoint documentation
  const [expandedEps, setExpandedEps] = useState<Record<string, boolean>>(
    endpoints.reduce((acc, ep) => ({ ...acc, [ep.id]: true }), {})
  );

  // Active environment state
  const [selectedEnvId, setSelectedEnvId] = useState<string>(() => {
    if (collection.defaultEnvId && environments.some(e => e.id === collection.defaultEnvId)) {
      return collection.defaultEnvId;
    }
    // Default select first environment if available
    return environments.length > 0 ? environments[0].id : 'none';
  });

  const activeVariables = React.useMemo(() => {
    if (selectedEnvId === 'none') return {};
    const env = environments.find(e => e.id === selectedEnvId);
    return env ? env.variables : {};
  }, [selectedEnvId, environments]);

  // Resolves double-curly variables
  const resolve = (text: string): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim();
      return activeVariables[trimmed] !== undefined ? activeVariables[trimmed] : match;
    });
  };

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

  // Active sub-tab inside the snapshot preview per endpoint: 'body' | 'headers' | 'request'
  const [snapSubTabs, setSnapSubTabs] = useState<Record<string, 'body' | 'headers' | 'request'>>(
    endpoints.reduce((acc, ep) => ({ ...acc, [ep.id]: 'body' }), {})
  );

  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleEndpoint = (id: string) => {
    setExpandedEps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
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
    const resolvedPath = resolve(ep.path);
    let fullUrl = resolvedPath;
    if (!resolvedPath.startsWith('http://') && !resolvedPath.startsWith('https://')) {
      fullUrl = `https://api.example.com${resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath}`;
    }

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

  const filteredEndpoints = React.useMemo(() => {
    if (!searchQuery.trim()) return endpoints;
    const q = searchQuery.toLowerCase();
    return endpoints.filter(ep => 
      ep.name.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q)
    );
  }, [endpoints, searchQuery]);

  const folderTree = React.useMemo(() => {
    return buildFolderTree(endpoints);
  }, [endpoints]);

  const selectedEndpoint = React.useMemo(() => {
    if (!selectedEndpointId) return null;
    return endpoints.find(e => e.id === selectedEndpointId) || null;
  }, [endpoints, selectedEndpointId]);

  const totalSnapshotsCount = React.useMemo(() => {
    return endpoints.reduce((acc, ep) => acc + ep.snapshots.length, 0);
  }, [endpoints]);

  return (
    <div className="min-h-screen bg-dark-950 text-zinc-300 flex flex-col md:flex-row font-sans select-text">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-zinc-950/80 border-b border-zinc-900 px-4 py-3 backdrop-blur-md flex items-center justify-between shrink-0 w-full">
        <div className="flex items-center gap-2.5">
          <img src="/OrbitAPI.png" alt="Orbit API Logo" className="h-6 w-6 object-contain" />
          <span className="text-sm font-extrabold text-white truncate max-w-[180px]">
            {collection.name}
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Sidebar backdrop overlay on mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 border-r border-zinc-900 bg-zinc-950 flex flex-col select-none transition-transform duration-300 ease-in-out shrink-0 h-screen
        md:relative md:translate-x-0 md:z-30
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-900 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/OrbitAPI.png" alt="Orbit API Logo" className="h-6 w-6 object-contain animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wide leading-none">Shared via</span>
              <span className="text-xs font-extrabold tracking-tight text-white leading-none mt-1">Orbit API Docs</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Elements */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Collection Overview / Home selection */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedEndpointId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                selectedEndpointId === null
                  ? 'bg-zinc-900 text-white border-l-2 border-brand-500'
                  : 'hover:bg-zinc-900/50 hover:text-white text-zinc-455'
              }`}
            >
              <Home className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="truncate text-left">Collection Overview</span>
            </button>
          </div>

          {/* Environment Selector */}
          {environments.length > 0 && (
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-550 uppercase tracking-wider">
                <Globe className="h-3.5 w-3.5 text-zinc-405" />
                <span>Environment</span>
              </div>
              <select
                value={selectedEnvId}
                onChange={(e) => setSelectedEnvId(e.target.value)}
                className="w-full rounded border border-zinc-900 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-500"
              >
                <option value="none">No Environment</option>
                {environments.map(env => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>

              {/* Show variables if selected */}
              {selectedEnvId !== 'none' && (
                <div className="mt-1.5 border-t border-zinc-900 pt-2 space-y-1">
                  <span className="block text-[9px] font-bold text-zinc-550 uppercase">Variables:</span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 border border-zinc-900 rounded bg-zinc-950/40 p-1.5">
                    {Object.entries(activeVariables).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[10px] font-mono gap-2">
                        <span className="text-amber-400 font-semibold truncate shrink-0 max-w-[90px]">{k}</span>
                        <span className="text-zinc-400 truncate max-w-[140px]" title={v}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="space-y-1.5 px-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Filter endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-zinc-900 bg-zinc-950 pl-8 pr-2.5 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Endpoints Directory */}
          <div className="space-y-1.5">
            <div className="px-1 text-xs font-bold uppercase tracking-wider text-zinc-550 flex items-center justify-between">
              <span>Endpoints</span>
              <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.2 rounded font-normal">
                {endpoints.length}
              </span>
            </div>

            {searchQuery.trim() !== '' ? (
              <div className="space-y-0.5">
                {filteredEndpoints.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic p-3 text-center">No matching endpoints.</div>
                ) : (
                  filteredEndpoints.map(ep => {
                    const isEpActive = selectedEndpointId === ep.id;
                    const methodColors: Record<string, string> = {
                      GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/10',
                      POST: 'text-brand-400 bg-brand-950/20 border-brand-500/10',
                      PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/10',
                      PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/10',
                      DELETE: 'text-red-400 bg-red-950/20 border-red-500/10'
                    };
                    return (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setSelectedEndpointId(ep.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-left truncate transition-colors border border-transparent ${
                          isEpActive 
                            ? 'bg-zinc-900 border-zinc-800 text-white font-semibold' 
                            : 'hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 w-11 text-center border ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                          {ep.method}
                        </span>
                        <span className="truncate">{ep.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-0.5">
                {endpoints.length === 0 ? (
                  <div className="px-1 py-2 text-xs italic text-zinc-650">No endpoints found.</div>
                ) : (
                  (() => {
                    const renderFolder = (node: FolderNode, depth: number = 0) => {
                      return (
                        <div className="space-y-0.5">
                          {/* Subfolders */}
                          {Object.values(node.subfolders).map(sub => {
                            const isFolderExpanded = !!expandedFolders[sub.fullPath];
                            return (
                              <div key={sub.fullPath} className="space-y-0.5">
                                <div
                                  onClick={() => toggleFolder(sub.fullPath)}
                                  className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20 cursor-pointer select-none"
                                  style={{ paddingLeft: `${(depth + 1) * 8}px` }}
                                >
                                  {isFolderExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
                                  )}
                                  <Folder className="h-3.5 w-3.5 text-zinc-500 shrink-0 fill-current opacity-60" />
                                  <span className="truncate font-medium">{sub.name}</span>
                                </div>

                                {isFolderExpanded && (
                                  <div className="border-l border-zinc-900/40 ml-1 pl-0.5 space-y-0.5">
                                    {renderFolder(sub, depth + 1)}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Endpoints */}
                          {node.endpoints.map(ep => {
                            const isEpActive = selectedEndpointId === ep.id;
                            const methodColors: Record<string, string> = {
                              GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/10',
                              POST: 'text-brand-400 bg-brand-950/20 border-brand-500/10',
                              PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/10',
                              PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/10',
                              DELETE: 'text-red-400 bg-red-950/20 border-red-500/10'
                            };

                            return (
                              <button
                                key={ep.id}
                                onClick={() => {
                                  setSelectedEndpointId(ep.id);
                                  setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left truncate transition-colors border border-transparent ${
                                  isEpActive 
                                    ? 'bg-zinc-900 border-zinc-800 text-white font-semibold' 
                                    : 'hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'
                                }`}
                                style={{ paddingLeft: `${(depth + 1) * 8 + 4}px` }}
                              >
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 w-11 text-center border ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                                  {ep.method}
                                </span>
                                <span className="truncate text-zinc-300 hover:text-white">{ep.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    };
                    return renderFolder(folderTree);
                  })()
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-900 mt-auto bg-zinc-950 flex flex-col gap-2 shrink-0">
          <a 
            href="/" 
            className="flex items-center justify-between rounded-lg border border-zinc-900 bg-zinc-900/20 px-3 py-2 text-xs font-bold hover:bg-zinc-900 hover:text-white transition-all"
          >
            <span className="text-zinc-400">Create Your Own Docs</span>
            <ArrowRight className="h-3.5 w-3.5 text-brand-500" />
          </a>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
          
          {selectedEndpointId === null ? (
            /* Collection Overview View */
            <div className="space-y-8">
              {/* Collection Metadata Card */}
              <div className="border-b border-zinc-900 pb-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 animate-pulse">
                  <Layers className="h-4 w-4" />
                  <span>API Collection Overview</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">{collection.name}</h1>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                  {collection.description || 'This shared API collection contains endpoint specifications, request configurations, version snapshots, and snippet generation tools.'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Endpoints</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">{endpoints.length}</span>
                    <span className="text-xs text-zinc-500">routes</span>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Version Snapshots</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">{totalSnapshotsCount}</span>
                    <span className="text-xs text-zinc-500">captured</span>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Environment</span>
                  <span className="text-sm font-extrabold text-emerald-400 truncate">
                    {selectedEnvId === 'none' ? 'No Environment' : environments.find(e => e.id === selectedEnvId)?.name}
                  </span>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Variables Active</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">
                      {selectedEnvId === 'none' ? 0 : Object.keys(activeVariables).length}
                    </span>
                    <span className="text-xs text-zinc-500">variables</span>
                  </div>
                </div>
              </div>

              {/* Endpoints Table/Directory */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-450 uppercase tracking-wider">Endpoints Directory</h3>
                <div className="grid grid-cols-1 gap-3">
                  {filteredEndpoints.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-900 rounded-xl text-zinc-550">
                      No registered endpoints found in this collection.
                    </div>
                  ) : (
                    filteredEndpoints.map(ep => {
                      const methodColors: Record<string, string> = {
                        GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30',
                        POST: 'text-brand-400 bg-brand-950/20 border-brand-500/30',
                        PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/30',
                        PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/20',
                        DELETE: 'text-red-400 bg-red-950/20 border-red-500/30'
                      };
                      return (
                        <div 
                          key={ep.id}
                          onClick={() => setSelectedEndpointId(ep.id)}
                          className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-zinc-805 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border shrink-0 w-16 text-center ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                              {ep.method}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-white font-bold group-hover:text-brand-400 transition-colors">{ep.name}</span>
                              <span className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">{resolve(ep.path)}</span>
                            </div>
                          </div>
                          {ep.description && (
                            <span className="text-[11px] text-zinc-550 mt-2 md:mt-0 max-w-sm truncate md:text-right">
                              {ep.description}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Selected Endpoint Detail View */
            (() => {
              const ep = selectedEndpoint;
              if (!ep) {
                return (
                  <div className="text-center py-16 text-zinc-550 border border-dashed border-zinc-900 rounded-xl">
                    Endpoint not found.
                  </div>
                );
              }
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
                <div className="space-y-6 animate-scale-up">
                  {/* Endpoint Header Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                    <div className="space-y-2.5">
                      <button 
                        onClick={() => setSelectedEndpointId(null)}
                        className="text-[10px] font-bold text-zinc-500 hover:text-brand-400 transition-colors uppercase tracking-wider block"
                      >
                        ← Back to Overview
                      </button>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 w-16 text-center ${methodColors[ep.method] || 'text-zinc-400 bg-zinc-800'}`}>
                          {ep.method}
                        </span>
                        <h1 className="text-lg text-white font-extrabold">{ep.name}</h1>
                      </div>
                      <div className="font-mono text-xs text-zinc-450 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-900 break-all">
                        {resolve(ep.path)}
                      </div>
                    </div>
                  </div>

                  {/* Documentation details container */}
                  <div className="space-y-4">
                    {/* Endpoint description */}
                    {ep.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-zinc-850 pl-3">
                        {ep.description}
                      </p>
                    )}

                    {/* Sub-tab navigation panels */}
                    <div className="border-b border-zinc-900 flex items-center justify-between">
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
                                : 'border-transparent text-zinc-550 hover:text-zinc-350'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SUB TAB: API DOCUMENTATION */}
                    {activeSubTab === 'docs' && (
                      <div className="space-y-6">
                        {/* Headers Section */}
                        {(() => {
                          const headerList = parseList(ep.headers);
                          if (headerList.length === 0) return null;
                          return (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Request Headers</span>
                              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 overflow-hidden text-xs">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-bold text-left">
                                      <th className="p-3 font-semibold w-1/4">Header Key</th>
                                      <th className="p-3 font-semibold w-1/4">Default Value</th>
                                      <th className="p-3 font-semibold">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900">
                                    {headerList.map((h: any, i: number) => (
                                      <tr key={i} className="hover:bg-zinc-900/10">
                                        <td className="p-3 font-mono text-zinc-300 font-bold select-all">{h.key}</td>
                                        <td className="p-3 font-mono text-zinc-400 select-all">{h.value || '-'}</td>
                                        <td className="p-3 text-zinc-400">{h.description || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Query Parameters Section */}
                        {(() => {
                          const paramList = parseList(ep.queryParams);
                          if (paramList.length === 0) return null;
                          return (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Query Parameters</span>
                              <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 overflow-hidden text-xs">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-bold text-left">
                                      <th className="p-3 font-semibold w-1/4">Parameter Key</th>
                                      <th className="p-3 font-semibold w-1/4">Example Value</th>
                                      <th className="p-3 font-semibold">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900">
                                    {paramList.map((p: any, i: number) => (
                                      <tr key={i} className="hover:bg-zinc-900/10">
                                        <td className="p-3 font-mono text-zinc-300 font-bold select-all">{p.key}</td>
                                        <td className="p-3 font-mono text-zinc-400 select-all">{p.value || '-'}</td>
                                        <td className="p-3 text-zinc-400">{p.description || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Request Body Section */}
                        {ep.bodyType && ep.bodyType !== 'none' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Request Body</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-brand-400">
                                {ep.bodyType === 'json' ? 'application/json' : ep.bodyType === 'urlencoded' ? 'application/x-www-form-urlencoded' : ep.bodyType}
                              </span>
                            </div>
                            {ep.bodyContent ? (
                              <div className="rounded-xl border border-zinc-900 bg-zinc-955/50 p-4 font-mono text-xs overflow-auto max-h-60 leading-relaxed text-zinc-300">
                                <pre>{ep.bodyContent}</pre>
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-500 italic p-3 rounded-lg border border-zinc-900 bg-zinc-950/20">
                                Empty body template
                              </div>
                            )}
                          </div>
                        )}

                        {/* Response Schema Section */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Response Schema</span>
                          {ep.responseSchema ? (
                            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 max-h-72 overflow-y-auto">
                              <RenderSchemaNode name="response" node={ep.responseSchema} />
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500 italic p-3 rounded-lg border border-zinc-900 bg-zinc-950/20">
                              No response schema captured.
                            </div>
                          )}
                        </div>
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
                                  : 'border-transparent text-zinc-550 hover:text-zinc-355'
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
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-550">
                                  <span>STATUS: <span className={activeSnapshot.statusCode < 400 ? 'text-emerald-400' : 'text-red-400'}>{activeSnapshot.statusCode}</span></span>
                                  <span>TIME: <span className="text-zinc-400">{activeSnapshot.responseTime} ms</span></span>
                                  <span>SIZE: <span className="text-zinc-400">{activeSnapshot.responseSize} B</span></span>
                                  <span>SAVED: <span className="text-zinc-400">{new Date(activeSnapshot.createdAt).toLocaleDateString()}</span></span>
                                </div>
                                
                                {/* Mini tabs */}
                                <div className="flex gap-2">
                                  {(['body', 'headers', 'request'] as const).map(tab => (
                                    <button
                                      key={tab}
                                      onClick={() => setSnapSubTabs(prev => ({ ...prev, [ep.id]: tab }))}
                                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border transition-all cursor-pointer ${
                                        (snapSubTabs[ep.id] || 'body') === tab
                                          ? 'bg-zinc-800 border-zinc-700 text-white shadow'
                                          : 'border-transparent text-zinc-555 hover:text-zinc-350'
                                      }`}
                                    >
                                      {tab === 'body' ? 'Response Body' : tab === 'headers' ? 'Headers' : 'Request'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Body Tab */}
                              {(snapSubTabs[ep.id] || 'body') === 'body' && (
                                <div className="rounded border border-zinc-850 bg-zinc-950 p-4 overflow-auto max-h-80 font-mono text-[11px] text-zinc-300">
                                  <pre>{getPrettySnapshotBody(ep.id, selectedVer)}</pre>
                                </div>
                              )}

                              {/* Headers Tab */}
                              {(snapSubTabs[ep.id] || 'body') === 'headers' && (
                                <div className="rounded border border-zinc-850 bg-zinc-950 p-4 overflow-auto max-h-80 text-xs">
                                  {(() => {
                                    const resHeaders = parseList(activeSnapshot.responseHeaders);
                                    if (resHeaders.length === 0) {
                                      return <div className="text-zinc-550 italic text-center py-2">No response headers captured.</div>;
                                    }
                                    return (
                                      <div className="divide-y divide-zinc-900 font-mono">
                                        {resHeaders.map((h: any, idx: number) => (
                                          <div key={idx} className="flex justify-between py-1.5 gap-4">
                                            <span className="text-zinc-400 font-bold select-all">{h.key}</span>
                                            <span className="text-zinc-300 text-right break-all select-all">{h.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Request Tab */}
                              {(snapSubTabs[ep.id] || 'body') === 'request' && (
                                <div className="rounded border border-zinc-850 bg-zinc-950 p-4 overflow-auto max-h-80 text-xs space-y-4">
                                  <div className="font-mono text-zinc-400 border-b border-zinc-900 pb-2">
                                    <span className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Target Endpoint</span>
                                    <div className="flex gap-2 items-center mt-1">
                                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-brand-400">
                                        {ep.method}
                                      </span>
                                      <span className="text-zinc-300 font-bold select-all">{ep.path}</span>
                                    </div>
                                  </div>

                                  {/* Captured Request Headers */}
                                  {(() => {
                                    const reqHeaders = parseList(activeSnapshot.requestHeaders);
                                    if (reqHeaders.length === 0) return null;
                                    return (
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Sent Headers</span>
                                        <div className="divide-y divide-zinc-900 font-mono text-[11px] pl-2 border-l border-zinc-800">
                                          {reqHeaders.map((h: any, idx: number) => (
                                            <div key={idx} className="flex justify-between py-1 gap-4">
                                              <span className="text-zinc-400 font-bold select-all">{h.key}</span>
                                              <span className="text-zinc-300 text-right break-all select-all">{h.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Captured Query Params */}
                                  {(() => {
                                    const reqParams = parseList(activeSnapshot.requestParams);
                                    if (reqParams.length === 0) return null;
                                    return (
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Query Parameters</span>
                                        <div className="divide-y divide-zinc-900 font-mono text-[11px] pl-2 border-l border-zinc-850">
                                          {reqParams.map((p: any, idx: number) => (
                                            <div key={idx} className="flex justify-between py-1 gap-4">
                                              <span className="text-zinc-400 font-bold select-all">{p.key}</span>
                                              <span className="text-zinc-300 text-right break-all select-all">{p.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Captured Request Body */}
                                  {activeSnapshot.requestBody ? (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider block">Sent Request Body</span>
                                      <div className="rounded bg-zinc-900/40 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-40">
                                        <pre>{activeSnapshot.requestBody}</pre>
                                      </div>
                                    </div>
                                  ) : null}

                                  {!activeSnapshot.requestHeaders && !activeSnapshot.requestParams && !activeSnapshot.requestBody && (
                                    <div className="text-zinc-500 italic text-center py-2">No request metadata captured for this version.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-650 italic py-2">Select a version snapshot to preview response.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB TAB: CLIENT SNIPPETS */}
                    {activeSubTab === 'snippets' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-555 font-bold uppercase tracking-wider">Format:</span>
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
                </div>
              );
            })()
          )}

        </main>
        
        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-900 bg-zinc-955 py-6 text-center text-xs text-zinc-600 shrink-0">
          Powered by Orbit API © {new Date().getFullYear()}. Dynamic API snapshot and tracking system.
        </footer>
      </div>
    </div>
  );
}
