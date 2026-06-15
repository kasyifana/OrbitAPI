'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { computeLineDiff } from '@/lib/diff';
import { 
  Activity, Layers, FileCode, Clock, Share2, Clipboard, Globe, 
  Trash2, ArrowLeft, CheckCircle2, ChevronRight, ChevronDown, 
  Play, Settings, Edit, Save, AlertCircle, Loader2, Info, Plus, X
} from 'lucide-react';

interface EndpointDetailsClientProps {
  endpoint: {
    id: string;
    name: string;
    method: string;
    path: string;
    description: string | null;
    collectionId: string;
    collectionName: string;
    collectionVisibility: string;
    responseSchema: any;
    headers?: any;
    queryParams?: any;
    bodyType?: string;
    bodyContent?: string | null;
  };
  snapshots: {
    id: string;
    version: number;
    statusCode: number;
    responseTime: number;
    responseSize: number;
    responseBody: string;
    createdAt: string;
    requestHeaders?: any;
    requestParams?: any;
    requestBody?: string | null;
    responseHeaders?: any;
  }[];
  environments: {
    id: string;
    name: string;
    variables: Record<string, string>;
  }[];
}

// Recursive component to render smart schemas
function RenderSchemaNode({ name, node }: { name: string; node: any }) {
  if (!node) return null;
  const isObject = node.type === 'object' && node.properties;
  const isArray = node.type === 'array' && node.items;

  return (
    <div className="pl-4 border-l border-zinc-800/80 mt-1">
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

interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
  description: string;
}

export default function EndpointDetailsClient({ 
  endpoint, 
  snapshots: initialSnapshots, 
  environments 
}: EndpointDetailsClientProps) {
  const router = useRouter();

  // Local state for snapshots to reflect new snapshots reactively
  const [localSnapshots, setLocalSnapshots] = useState(initialSnapshots);
  const snapshots = localSnapshots;

  // Tabs: docs, runner, history, diff, settings
  const [activeTab, setActiveTab] = useState<'docs' | 'runner' | 'history' | 'diff' | 'settings'>('docs');
  
  // Diff versions selection
  const [diffVerA, setDiffVerA] = useState<number>(snapshots[snapshots.length - 2]?.version || snapshots[0]?.version || 1);
  const [diffVerB, setDiffVerB] = useState<number>(snapshots[snapshots.length - 1]?.version || snapshots[0]?.version || 1);

  // Settings: renaming endpoint
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(endpoint.name);
  const [editDesc, setEditDesc] = useState(endpoint.description || '');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Selected snapshot for history tab
  const [selectedHistoryVer, setSelectedHistoryVer] = useState<number>(snapshots[snapshots.length - 1]?.version || 1);
  const [selectedSnapshotTab, setSelectedSnapshotTab] = useState<'body' | 'headers' | 'request'>('body');

  // Copy share link state
  const [copiedShare, setCopiedShare] = useState(false);

  // Copy code snippet state
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'javascript' | 'python'>('curl');

  // Delete states
  const [deleting, setDeleting] = useState(false);

  // Defer locale rendering until client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Test Runner States
  const [runnerTab, setRunnerTab] = useState<'params' | 'headers' | 'body'>('params');
  const [selectedEnvId, setSelectedEnvId] = useState<string>('none');
  const [activeVariables, setActiveVariables] = useState<Record<string, string>>({});

  const [runnerUrl, setRunnerUrl] = useState(() => {
    return `http://localhost:8000${endpoint.path}`;
  });

  const [runnerHeaders, setRunnerHeaders] = useState<KeyValueRow[]>(() => {
    let list: KeyValueRow[] = [];
    if (Array.isArray(endpoint.headers)) {
      list = endpoint.headers.map((h: any) => ({
        key: h.key || '',
        value: h.value || '',
        enabled: h.enabled !== false,
        description: h.description || '',
      }));
    }
    if (list.length === 0) {
      list.push({ key: 'Accept', value: 'application/json', enabled: true, description: '' });
    }
    list.push({ key: '', value: '', enabled: true, description: '' });
    return list;
  });

  const [runnerParams, setRunnerParams] = useState<KeyValueRow[]>(() => {
    let list: KeyValueRow[] = [];
    if (Array.isArray(endpoint.queryParams)) {
      list = endpoint.queryParams.map((p: any) => ({
        key: p.key || '',
        value: p.value || '',
        enabled: p.enabled !== false,
        description: p.description || '',
      }));
    }
    list.push({ key: '', value: '', enabled: true, description: '' });
    return list;
  });

  const [runnerBodyType, setRunnerBodyType] = useState(endpoint.bodyType || 'none');
  const [runnerBody, setRunnerBody] = useState(endpoint.bodyContent || '');

  const [runnerSending, setRunnerSending] = useState(false);
  const [runnerResponse, setRunnerResponse] = useState<any>(null);
  const [runnerResponseTab, setRunnerResponseTab] = useState<'body' | 'headers'>('body');

  const [runnerSaving, setRunnerSaving] = useState(false);
  const [runnerSaveSuccess, setRunnerSaveSuccess] = useState(false);
  const [runnerSaveError, setRunnerSaveError] = useState('');

  // Sync selected environment variables
  useEffect(() => {
    if (selectedEnvId === 'none') {
      setActiveVariables({});
    } else {
      const env = environments.find(e => e.id === selectedEnvId);
      setActiveVariables(env ? env.variables : {});
    }
  }, [selectedEnvId, environments]);

  // Environment substitution resolver
  const resolve = (text: string): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim();
      return activeVariables[trimmed] !== undefined ? activeVariables[trimmed] : match;
    });
  };

  // Auto-extends KeyValue grids inside collection runner
  const handleRunnerGridChange = (
    index: number,
    field: keyof KeyValueRow,
    value: any,
    type: 'params' | 'headers'
  ) => {
    const list = type === 'params' ? [...runnerParams] : [...runnerHeaders];
    list[index][field] = value as never;

    if (index === list.length - 1 && (list[index].key || list[index].value)) {
      list.push({ key: '', value: '', enabled: true, description: '' });
    }

    if (type === 'params') {
      setRunnerParams(list);
    } else {
      setRunnerHeaders(list);
    }
  };

  const removeRunnerRow = (index: number, type: 'params' | 'headers') => {
    const list = type === 'params' ? [...runnerParams] : [...runnerHeaders];
    if (list.length === 1) return;
    list.splice(index, 1);
    if (type === 'params') {
      setRunnerParams(list);
    } else {
      setRunnerHeaders(list);
    }
  };

  // Compile final url with params for runner
  const getRunnerCompiledUrl = () => {
    const baseUrlResolved = resolve(runnerUrl.trim());
    if (!baseUrlResolved) return '';

    try {
      const searchParams = new URLSearchParams();
      runnerParams.forEach(p => {
        if (p.enabled && p.key) {
          searchParams.append(resolve(p.key), resolve(p.value));
        }
      });

      const paramStr = searchParams.toString();
      if (!paramStr) return baseUrlResolved;

      const separator = baseUrlResolved.includes('?') ? '&' : '?';
      return `${baseUrlResolved}${separator}${paramStr}`;
    } catch (e) {
      return baseUrlResolved;
    }
  };

  // Execute Request inside Collection detail view
  const handleRunnerSend = async () => {
    const finalUrl = getRunnerCompiledUrl();
    if (!finalUrl) return;

    setRunnerSending(true);
    setRunnerResponse(null);

    const reqHeaders = runnerHeaders
      .filter(h => h.enabled && h.key)
      .map(h => ({
        key: resolve(h.key),
        value: resolve(h.value),
      }));

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          method: endpoint.method,
          headers: reqHeaders,
          bodyType: runnerBodyType,
          body: runnerBodyType !== 'none' ? resolve(runnerBody) : null,
        }),
      });

      const data = await res.json();
      setRunnerResponse(data);
      router.refresh();
    } catch (err: any) {
      setRunnerResponse({
        ok: false,
        status: 0,
        statusText: 'Proxy Request Failed',
        responseTime: 0,
        responseSize: 0,
        headers: [],
        body: err.message || 'An unexpected proxy error occurred',
      });
    } finally {
      setRunnerSending(false);
    }
  };

  // Save live execution as a new snapshot version
  const handleRunnerSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerResponse) return;
    setRunnerSaving(true);
    setRunnerSaveError('');
    setRunnerSaveSuccess(false);

    try {
      const snapRes = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId: endpoint.id,
          statusCode: runnerResponse.status,
          responseTime: runnerResponse.responseTime,
          responseSize: runnerResponse.responseSize,
          responseHeaders: runnerResponse.headers,
          responseBody: runnerResponse.body,
          requestHeaders: runnerHeaders.filter(h => h.key && h.enabled).map(h => ({ key: h.key, value: h.value })),
          requestBody: runnerBodyType !== 'none' ? runnerBody : null,
          requestParams: runnerParams.filter(p => p.key && p.enabled).map(p => ({ key: p.key, value: p.value })),
        }),
      });

      if (!snapRes.ok) {
        const snapData = await snapRes.json();
        throw new Error(snapData.error || 'Failed to save snapshot');
      }

      const newSnapshot = await snapRes.json();

      // Update local snapshots state reactively so tabs update immediately
      setLocalSnapshots(prev => {
        const next = [...prev, {
          id: newSnapshot.id,
          version: newSnapshot.version,
          statusCode: newSnapshot.statusCode,
          responseTime: newSnapshot.responseTime,
          responseSize: newSnapshot.responseSize,
          responseBody: newSnapshot.responseBody,
          createdAt: newSnapshot.createdAt,
          requestHeaders: newSnapshot.requestHeaders || [],
          requestBody: newSnapshot.requestBody || '',
          requestParams: newSnapshot.requestParams || [],
          responseHeaders: newSnapshot.responseHeaders || [],
        }];
        return next;
      });

      setSelectedHistoryVer(newSnapshot.version);
      
      // Update diff versions to compare with the new version automatically
      setDiffVerB(newSnapshot.version);

      setRunnerSaveSuccess(true);
      
      setTimeout(() => {
        setRunnerSaveSuccess(false);
        setActiveTab('history');
      }, 1000);

      router.refresh();
    } catch (err: any) {
      setRunnerSaveError(err.message || 'Failed to save snapshot');
    } finally {
      setRunnerSaving(false);
    }
  };

  // Parse details for diff calculation
  const getPrettySnapshotBody = (versionNum: number) => {
    const snap = snapshots.find(s => s.version === versionNum);
    if (!snap) return '';
    try {
      const parsed = JSON.parse(snap.responseBody);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return snap.responseBody;
    }
  };

  // Generate visual diff
  const getDiffLines = () => {
    const textA = getPrettySnapshotBody(diffVerA);
    const textB = getPrettySnapshotBody(diffVerB);
    return computeLineDiff(textA, textB);
  };

  // Generate code snippet based on parameters
  const generateSnippet = () => {
    const fullUrl = `https://api.example.com${endpoint.path}`;
    if (selectedLang === 'curl') {
      return `curl -X ${endpoint.method} "${fullUrl}" \\\n  -H "Accept: application/json"`;
    }
    if (selectedLang === 'javascript') {
      return `fetch("${fullUrl}", {\n  method: "${endpoint.method}",\n  headers: {\n    "Accept": "application/json"\n  }\n})\n.then(response => response.json())\n.then(data => console.log(data));`;
    }
    if (selectedLang === 'python') {
      return `import requests\n\nurl = "${fullUrl}"\nheaders = {"Accept": "application/json"}\n\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers)\nprint(response.json())`;
    }
    return '';
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/share/${endpoint.collectionId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Rename endpoint handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      const res = await fetch(`/api/endpoints/${endpoint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update endpoint');
      }

      setUpdateSuccess(true);
      setIsEditing(false);
      router.refresh();
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating');
    } finally {
      setUpdating(false);
    }
  };

  // Delete endpoint handler
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this endpoint registry? This will permanently wipe all history and version snapshots associated with it.')) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/endpoints/${endpoint.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
      setDeleting(false);
    }
  };

  const selectedSnapshot = snapshots.find(s => s.version === selectedHistoryVer);
  const methodColors: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30',
    POST: 'text-brand-400 bg-brand-950/20 border-brand-500/30',
    PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/30',
    PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/20',
    DELETE: 'text-red-400 bg-red-950/20 border-red-500/30'
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in max-w-6xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <Layers className="h-3.5 w-3.5" />
            <span>Collections</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400">{endpoint.collectionName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${methodColors[endpoint.method] || 'text-zinc-400 bg-zinc-800'}`}>
              {endpoint.method}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">{endpoint.name}</h1>
          </div>
          
          <div className="font-mono text-xs text-zinc-400 font-semibold">{endpoint.path}</div>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('runner')}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600/90 border border-brand-500/30 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-all cursor-pointer shadow-lg shadow-brand-950/20"
          >
            <Play className="h-3.5 w-3.5 fill-current text-white" />
            <span>Test Endpoint</span>
          </button>
          
          {endpoint.collectionVisibility !== 'private' && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-brand-400" />
              <span>{copiedShare ? 'Copied Link!' : 'Share Documentation'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800/80">
        <nav className="flex gap-6">
          {[
            { id: 'docs', label: 'API Documentation' },
            { id: 'runner', label: 'Test Runner' },
            { id: 'history', label: `Snapshots (${snapshots.length})` },
            { id: 'diff', label: 'Response Diff' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-brand-500 text-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: API DOCUMENTATION */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Docs Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Description</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {endpoint.description || 'No description provided for this endpoint. Click on the settings tab to add a description.'}
              </p>
            </div>

            {/* Smart Schema Detector Node */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-brand-400" />
                <span>Detected Response Schema</span>
              </h3>
              {endpoint.responseSchema ? (
                <div className="rounded border border-zinc-900 bg-zinc-950 p-4 max-h-96 overflow-y-auto">
                  <RenderSchemaNode name="response" node={endpoint.responseSchema} />
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic p-2.5">
                  No response schema detected. Run a request in the API Tester and save a response snapshot to auto-detect its schema structure.
                </div>
              )}
            </div>
          </div>

          {/* Snippets Column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Code Snippets</h3>
              
              {/* Language switcher */}
              <div className="grid grid-cols-3 gap-1 rounded bg-zinc-950/40 p-1 border border-zinc-800">
                {(['curl', 'javascript', 'python'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`rounded py-1 text-[10px] font-bold uppercase ${selectedLang === lang ? 'bg-zinc-850 text-white border border-zinc-800/80 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {lang === 'javascript' ? 'fetch' : lang}
                  </button>
                ))}
              </div>

              {/* Code Pre container */}
              <div className="relative">
                <pre className="rounded-lg bg-zinc-950 p-4 font-mono text-[10px] text-zinc-300 overflow-x-auto leading-relaxed max-h-48">
                  {generateSnippet()}
                </pre>
                <button
                  onClick={copyCodeToClipboard}
                  className="absolute right-2 top-2 rounded p-1 bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
                  title="Copy snippet"
                >
                  <Clipboard className="h-3.5 w-3.5" />
                </button>
              </div>
              {copiedCode && <span className="block text-[10px] text-emerald-400 font-semibold text-right">Snippet copied!</span>}
            </div>
          </div>

        </div>
      )}

      {/* TAB: TEST RUNNER */}
      {activeTab === 'runner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Config Panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Play className="h-4 w-4 text-emerald-400" />
                <span>Execute API Test</span>
              </h3>
              
              {/* Environment Selector inside Collection */}
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Env:</span>
                <select 
                  value={selectedEnvId} 
                  onChange={(e) => setSelectedEnvId(e.target.value)}
                  className="rounded border border-zinc-800 bg-zinc-955 px-2 py-0.5 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="none">No Environment</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* HTTP Method and URL input */}
            <div className="flex gap-2">
              <span className={`flex items-center justify-center text-xs font-black px-3 py-2 rounded-lg border border-zinc-850 select-none bg-zinc-950 text-brand-400`}>
                {endpoint.method}
              </span>
              
              <input
                type="text"
                value={runnerUrl}
                onChange={(e) => setRunnerUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1/users"
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-800 focus:border-brand-500 focus:outline-none font-mono"
              />

              <button
                onClick={handleRunnerSend}
                disabled={runnerSending || !runnerUrl}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {runnerSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>

            {/* Runner Config Tabs */}
            <div className="border-b border-zinc-800/80">
              <nav className="flex gap-4">
                {['params', 'headers', 'body'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRunnerTab(tab as any)}
                    className={`border-b-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      runnerTab === tab 
                        ? 'border-brand-500 text-white' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab === 'params' ? `Query Params (${runnerParams.filter(p=>p.key).length})` : 
                     tab === 'headers' ? `Headers (${runnerHeaders.filter(h=>h.key).length})` : 
                     `Body (${runnerBodyType})`}
                  </button>
                ))}
              </nav>
            </div>

            {/* Params grid view */}
            {runnerTab === 'params' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-4">Value</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {runnerParams.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input 
                          type="checkbox" 
                          checked={p.enabled} 
                          onChange={(e) => handleRunnerGridChange(idx, 'enabled', e.target.checked, 'params')}
                          className="rounded border-zinc-800 bg-zinc-950 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={p.key}
                        onChange={(e) => handleRunnerGridChange(idx, 'key', e.target.value, 'params')}
                        placeholder="key"
                        className="col-span-4 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-800 focus:border-brand-500 focus:outline-none font-mono"
                      />
                      <input 
                        type="text" 
                        value={p.value}
                        onChange={(e) => handleRunnerGridChange(idx, 'value', e.target.value, 'params')}
                        placeholder="value"
                        className="col-span-4 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-800 focus:border-brand-500 focus:outline-none font-mono"
                      />
                      <input 
                        type="text" 
                        value={p.description}
                        onChange={(e) => handleRunnerGridChange(idx, 'description', e.target.value, 'params')}
                        placeholder="desc"
                        className="col-span-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-800 focus:border-brand-500 focus:outline-none"
                      />
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => removeRunnerRow(idx, 'params')}
                          className="text-zinc-650 hover:text-red-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Headers grid view */}
            {runnerTab === 'headers' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">Key</div>
                  <div className="col-span-4">Value</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {runnerHeaders.map((h, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 flex justify-center">
                        <input 
                          type="checkbox" 
                          checked={h.enabled} 
                          onChange={(e) => handleRunnerGridChange(idx, 'enabled', e.target.checked, 'headers')}
                          className="rounded border-zinc-800 bg-zinc-950 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={h.key}
                        onChange={(e) => handleRunnerGridChange(idx, 'key', e.target.value, 'headers')}
                        placeholder="Accept"
                        className="col-span-4 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-850 focus:border-brand-500 focus:outline-none font-mono"
                      />
                      <input 
                        type="text" 
                        value={h.value}
                        onChange={(e) => handleRunnerGridChange(idx, 'value', e.target.value, 'headers')}
                        placeholder="application/json"
                        className="col-span-4 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-850 focus:border-brand-500 focus:outline-none font-mono"
                      />
                      <input 
                        type="text" 
                        value={h.description}
                        onChange={(e) => handleRunnerGridChange(idx, 'description', e.target.value, 'headers')}
                        placeholder="desc"
                        className="col-span-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] text-white placeholder-zinc-850 focus:border-brand-500 focus:outline-none"
                      />
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => removeRunnerRow(idx, 'headers')}
                          className="text-zinc-650 hover:text-red-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body editor view */}
            {runnerTab === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Content Type:</span>
                  <select
                    value={runnerBodyType}
                    onChange={(e) => setRunnerBodyType(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="none">none</option>
                    <option value="json">application/json</option>
                    <option value="text">text/plain</option>
                  </select>
                </div>

                {runnerBodyType !== 'none' && (
                  <textarea
                    value={runnerBody}
                    onChange={(e) => setRunnerBody(e.target.value)}
                    placeholder={runnerBodyType === 'json' ? '{\n  "uuid_kurikulum": "9c8d7e6f-..."\n}' : 'key=value'}
                    rows={6}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-xs font-mono text-white placeholder-zinc-850 focus:border-brand-500 focus:outline-none resize-y"
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Column: Response Panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-6 flex flex-col min-h-128 justify-between">
            {runnerSending ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                <p className="text-xs font-semibold tracking-wide">Executing HTTP Request...</p>
              </div>
            ) : !runnerResponse ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-650 space-y-3">
                <Activity className="h-8 w-8 text-zinc-800" />
                <p className="text-xs font-semibold">Test Client Idle</p>
                <p className="text-[11px] text-zinc-700">Set parameters and trigger send request to verify API responses.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                
                {/* Stats & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">Status</span>
                      <span className={`text-xs font-extrabold ${runnerResponse.status >= 200 && runnerResponse.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {runnerResponse.status || 'ERROR'} {runnerResponse.statusText}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">Time</span>
                      <span className="text-xs font-bold text-white font-mono">{runnerResponse.responseTime} ms</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase">Size</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {runnerResponse.responseSize > 1024 
                          ? `${(runnerResponse.responseSize / 1024).toFixed(2)} KB` 
                          : `${runnerResponse.responseSize} B`}
                      </span>
                    </div>
                  </div>

                  {/* Save Snapshot directly from inline Runner! */}
                  {runnerResponse.status > 0 && (
                    <button
                      onClick={handleRunnerSaveSnapshot}
                      disabled={runnerSaving}
                      className="flex items-center gap-1.5 rounded bg-brand-600 hover:bg-brand-500 px-3 py-1.5 text-[10px] font-bold text-white transition-colors cursor-pointer disabled:opacity-50 font-sans"
                    >
                      {runnerSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>Save as Snapshot</span>
                    </button>
                  )}
                </div>

                {runnerSaveError && (
                  <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2 text-[10px] text-red-400 font-sans">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{runnerSaveError}</span>
                  </div>
                )}

                {runnerSaveSuccess && (
                  <div className="flex items-center gap-2 rounded bg-emerald-950/40 border border-emerald-500/20 p-2 text-[10px] text-emerald-400 animate-bounce font-sans">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Response successfully saved as a new snapshot version!</span>
                  </div>
                )}

                {/* Response Tabs (Body/Headers) */}
                <div className="border-b border-zinc-850 flex items-center justify-between">
                  <nav className="flex gap-4">
                    {['body', 'headers'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setRunnerResponseTab(tab as any)}
                        className={`border-b-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          runnerResponseTab === tab 
                            ? 'border-brand-500 text-white' 
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Contents box */}
                <div className="flex-1 max-h-96 overflow-auto rounded-lg border border-zinc-850 bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed">
                  {runnerResponseTab === 'body' ? (
                    <pre className="text-zinc-300 whitespace-pre-wrap select-text">
                      {(() => {
                        if (!runnerResponse.body) return '';
                        try {
                          const parsed = JSON.parse(runnerResponse.body);
                          return JSON.stringify(parsed, null, 2);
                        } catch (e) {
                          return runnerResponse.body;
                        }
                      })()}
                    </pre>
                  ) : (
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-zinc-850 text-zinc-500 text-[9px] uppercase font-bold tracking-wider">
                          <th className="pb-1.5">Header Key</th>
                          <th className="pb-1.5">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {runnerResponse.headers.map((h: any, i: number) => (
                          <tr key={i} className="text-zinc-300">
                            <td className="py-2 font-semibold text-zinc-400 pr-4 select-all">{h.key}</td>
                            <td className="py-2 break-all font-mono text-zinc-500 select-all">{h.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SNAPSHOTS HISTORY */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* History selection rail */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Saved Snapshots</span>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {snapshots.map(snap => (
                <div
                  key={snap.id}
                  onClick={() => setSelectedHistoryVer(snap.version)}
                  className={`flex items-center justify-between rounded p-2.5 text-xs transition-colors cursor-pointer border ${
                    selectedHistoryVer === snap.version
                      ? 'bg-zinc-900 text-white border-brand-500/40 font-semibold'
                      : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Version {snap.version}</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-1 rounded ${snap.statusCode < 400 ? 'text-emerald-400 bg-emerald-950/20' : 'text-red-400 bg-red-950/20'}`}>
                    {snap.statusCode}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* History Details view */}
          <div className="lg:col-span-3 space-y-4">
            {selectedSnapshot ? (
              <div className="space-y-4">
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-xs font-semibold text-zinc-400">
                  <div>
                    Version: <span className="text-white">v{selectedSnapshot.version}</span>
                  </div>
                  <div>
                    Status: <span className={selectedSnapshot.statusCode < 400 ? 'text-emerald-400' : 'text-red-400'}>{selectedSnapshot.statusCode}</span>
                  </div>
                  <div>
                    Response Time: <span className="text-white font-mono">{selectedSnapshot.responseTime} ms</span>
                  </div>
                  <div>
                    Response Size: <span className="text-white font-mono">{selectedSnapshot.responseSize} B</span>
                  </div>
                  <div>
                    Saved at: <span className="text-white">{mounted ? new Date(selectedSnapshot.createdAt).toLocaleString() : ''}</span>
                  </div>
                </div>

                {/* Snapshot sub-tabs */}
                <div className="border-b border-zinc-800/60 flex items-center justify-between pb-1">
                  <nav className="flex gap-4">
                    {[
                      { id: 'body', label: 'Response Body' },
                      { id: 'headers', label: 'Response Headers' },
                      { id: 'request', label: 'Captured Request' }
                    ].map(subTab => (
                      <button
                        key={subTab.id}
                        type="button"
                        onClick={() => setSelectedSnapshotTab(subTab.id as any)}
                        className={`border-b-2 pb-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedSnapshotTab === subTab.id
                            ? 'border-brand-500 text-white'
                            : 'border-transparent text-zinc-550 hover:text-zinc-350'
                        }`}
                      >
                        {subTab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Sub-tab view contents */}
                {selectedSnapshotTab === 'body' && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 overflow-auto max-h-96 font-mono text-xs">
                    <pre className="text-zinc-300 leading-relaxed whitespace-pre-wrap select-text">
                      {getPrettySnapshotBody(selectedHistoryVer)}
                    </pre>
                  </div>
                )}

                {selectedSnapshotTab === 'headers' && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 overflow-auto max-h-96 text-xs">
                    {Array.isArray(selectedSnapshot.responseHeaders) && selectedSnapshot.responseHeaders.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-850 text-zinc-550 text-[10px] uppercase font-bold tracking-wider">
                            <th className="pb-2">Header Key</th>
                            <th className="pb-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/50">
                          {selectedSnapshot.responseHeaders.map((h: any, i: number) => (
                            <tr key={i} className="text-zinc-300">
                              <td className="py-2.5 font-semibold text-zinc-400 pr-4 select-all font-sans">{h.key}</td>
                              <td className="py-2.5 break-all font-mono text-zinc-550 select-all">{h.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-zinc-500 italic p-2.5">No response headers captured in this snapshot version.</div>
                    )}
                  </div>
                )}

                {selectedSnapshotTab === 'request' && (
                  <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/10 p-5 text-xs">
                    
                    {/* Method & Path */}
                    <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-brand-400`}>
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-white select-all">{endpoint.path}</span>
                    </div>

                    {/* Query Params */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-zinc-400 uppercase tracking-wide text-[10px]">Query Parameters</h4>
                      {Array.isArray(selectedSnapshot.requestParams) && selectedSnapshot.requestParams.filter((p: any) => p.key).length > 0 ? (
                        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-850 text-zinc-500 text-[9px] uppercase font-bold tracking-wider">
                                <th className="pb-1.5 pr-4">Key</th>
                                <th className="pb-1.5">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedSnapshot.requestParams.filter((p: any) => p.key).map((p: any, i: number) => (
                                <tr key={i} className="text-zinc-350 font-mono text-[11px]">
                                  <td className="py-1.5 pr-4 select-all text-zinc-455">{p.key}</td>
                                  <td className="py-1.5 select-all">{p.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-zinc-600 italic text-[11px]">No query parameters sent.</p>
                      )}
                    </div>

                    {/* Request Headers */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-zinc-400 uppercase tracking-wide text-[10px]">Headers</h4>
                      {Array.isArray(selectedSnapshot.requestHeaders) && selectedSnapshot.requestHeaders.filter((h: any) => h.key).length > 0 ? (
                        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-850 text-zinc-500 text-[9px] uppercase font-bold tracking-wider">
                                <th className="pb-1.5 pr-4">Key</th>
                                <th className="pb-1.5">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedSnapshot.requestHeaders.filter((h: any) => h.key).map((h: any, i: number) => (
                                <tr key={i} className="text-zinc-350 font-mono text-[11px]">
                                  <td className="py-1.5 pr-4 select-all text-zinc-455">{h.key}</td>
                                  <td className="py-1.5 select-all">{h.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-zinc-600 italic text-[11px]">No request headers sent.</p>
                      )}
                    </div>

                    {/* Request Body */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-zinc-400 uppercase tracking-wide text-[10px]">Request Body</h4>
                      {selectedSnapshot.requestBody ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] overflow-auto max-h-48">
                          <pre className="text-zinc-350 select-all whitespace-pre-wrap">{selectedSnapshot.requestBody}</pre>
                        </div>
                      ) : (
                        <p className="text-zinc-650 italic text-[11px]">none</p>
                      )}
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500">No snapshot records found.</div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: RESPONSE DIFF VIEWER */}
      {activeTab === 'diff' && (
        <div className="space-y-4">
          
          {/* Diff Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Compare version</span>
              <select 
                value={diffVerA} 
                onChange={(e) => setDiffVerA(parseInt(e.target.value))}
                className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 font-bold"
              >
                {snapshots.map(s => (
                  <option key={s.id} value={s.version}>v{s.version}</option>
                ))}
              </select>

              <span className="text-xs text-zinc-500">with</span>

              <select 
                value={diffVerB} 
                onChange={(e) => setDiffVerB(parseInt(e.target.value))}
                className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 font-bold"
              >
                {snapshots.map(s => (
                  <option key={s.id} value={s.version}>v{s.version}</option>
                ))}
              </select>
            </div>
            
            <div className="text-xs font-semibold text-zinc-500 italic">
              Showing diff logs: v{diffVerA} ➔ v{diffVerB}
            </div>
          </div>

          {/* Diff Viewer Pane */}
          {snapshots.length < 2 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-12 text-center text-zinc-500 space-y-2">
              <Info className="h-8 w-8 mx-auto text-zinc-600" />
              <p className="text-sm font-semibold">Insufficient snapshot records</p>
              <p className="text-xs text-zinc-600">You need to have at least 2 saved snapshots of this endpoint to execute comparisons.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 overflow-auto max-h-128 font-mono text-xs">
              <pre className="space-y-0.5 leading-relaxed">
                {getDiffLines().map((line, idx) => {
                  let lineClass = 'text-zinc-300';
                  let prefix = ' ';
                  if (line.type === 'added') {
                    lineClass = 'text-emerald-400 bg-emerald-950/20 block border-l-2 border-emerald-500 pl-1.5';
                    prefix = '+';
                  } else if (line.type === 'removed') {
                    lineClass = 'text-red-400 bg-red-950/25 block border-l-2 border-red-500 pl-1.5';
                    prefix = '-';
                  } else {
                    lineClass = 'text-zinc-400 pl-2';
                  }

                  return (
                    <code key={idx} className={`${lineClass} whitespace-pre`}>
                      {prefix} {line.text}
                    </code>
                  );
                })}
              </pre>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-8">
          
          <form onSubmit={handleUpdate} className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Endpoint Settings</h3>
            
            {updateError && (
              <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="flex items-center gap-2 rounded bg-emerald-950/40 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Endpoint registry updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Friendly Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Description</label>
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none resize-y"
              />
            </div>

            <div>
              <button 
                type="submit" 
                disabled={updating}
                className="rounded bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 flex items-center gap-1.5 cursor-pointer"
              >
                {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Updates</span>
              </button>
            </div>
          </form>

          {/* Delete Danger Section */}
          <div className="border-t border-zinc-800 pt-6 max-w-xl space-y-4">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
            <p className="text-xs text-zinc-400">
              Permanently delete this API endpoint registry and all saved response versions. This action is irreversible.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded bg-red-950/20 border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 hover:border-red-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Registry</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
