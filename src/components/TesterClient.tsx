'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Plus, Trash2, CheckCircle2, Copy, Download, Layers, 
  Globe, Info, AlertCircle, Loader2, Save, FileCode, Activity, X
} from 'lucide-react';

interface TesterClientProps {
  collections: {
    id: string;
    name: string;
    endpoints: { id: string; name: string; method: string }[];
  }[];
  environments: {
    id: string;
    name: string;
    variables: Record<string, string>;
    scope?: string;
    collectionId?: string | null;
  }[];
  initialRequest?: {
    method: string;
    url: string;
    headers: { key: string; value: string; enabled?: boolean }[];
    bodyType: string;
    body: string | null;
  } | null;
  preselectedColId?: string | null;
}

interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
  description: string;
}

// Parsing helper functions for cURL commands and Postman collection files
function parseCurlCommand(curlText: string) {
  // Replace escaped newlines
  const normalized = curlText.replace(/\\\s*\n/g, ' ').trim();
  
  // Tokenize respecting quotes
  const tokens: string[] = [];
  let currentToken = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (escaped) {
      currentToken += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if ((char === ' ' || char === '\t') && !inSingleQuote && !inDoubleQuote) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  if (currentToken) {
    tokens.push(currentToken);
  }

  // Parse options
  let method = 'GET';
  let url = '';
  const headers: { key: string; value: string; enabled: boolean; description: string }[] = [];
  let body = '';
  let bodyType = 'none';

  // Standard flags that consume one argument
  const argFlags = new Set([
    '-X', '--request',
    '-H', '--header',
    '-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode',
    '-u', '--user',
    '-A', '--user-agent',
    '-b', '--cookie',
    '-c', '--cookie-jar',
    '-F', '--form', '--form-string',
    '-o', '--output',
    '-m', '--max-time',
    '--connect-timeout',
    '--resolve',
    '--retry'
  ]);

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
      }
    } else if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerVal = tokens[++i];
        const colonIdx = headerVal.indexOf(':');
        if (colonIdx > -1) {
          const key = headerVal.substring(0, colonIdx).trim();
          const value = headerVal.substring(colonIdx + 1).trim();
          headers.push({ key, value, enabled: true, description: '' });
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary' || token === '--data-urlencode') {
      if (i + 1 < tokens.length) {
        body = tokens[++i];
        bodyType = 'json'; // default to json
        if (method === 'GET') {
          method = 'POST';
        }
      }
    } else if (token === '-u' || token === '--user') {
      if (i + 1 < tokens.length) {
        const userPass = tokens[++i];
        const base64Auth = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(userPass))) : '';
        headers.push({ key: 'Authorization', value: `Basic ${base64Auth}`, enabled: true, description: 'Basic Auth' });
      }
    } else if (token.startsWith('-')) {
      if (argFlags.has(token)) {
        i++; // skip next argument
      }
    } else {
      if (!url) {
        url = token;
        if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
        if (url.startsWith("'") && url.endsWith("'")) url = url.slice(1, -1);
      }
    }
  }

  if (body) {
    try {
      JSON.parse(body);
      bodyType = 'json';
    } catch (e) {
      bodyType = 'text';
    }
  }

  const queryParams: { key: string; value: string; enabled: boolean; description: string }[] = [];
  if (url && url.includes('?')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.forEach((value, key) => {
        queryParams.push({ key, value, enabled: true, description: '' });
      });
      url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (e) {
      const qIdx = url.indexOf('?');
      const base = url.substring(0, qIdx);
      const search = url.substring(qIdx + 1);
      const pairs = search.split('&');
      pairs.forEach(pair => {
        const eqIdx = pair.indexOf('=');
        if (eqIdx > -1) {
          queryParams.push({
            key: decodeURIComponent(pair.substring(0, eqIdx)),
            value: decodeURIComponent(pair.substring(eqIdx + 1)),
            enabled: true,
            description: '',
          });
        } else if (pair) {
          queryParams.push({
            key: decodeURIComponent(pair),
            value: '',
            enabled: true,
            description: '',
          });
        }
      });
      url = base;
    }
  }

  return { method, url, headers, body, bodyType, queryParams };
}

interface ExtractedPostmanReq {
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean; description: string }[];
  bodyType: string;
  body: string;
  queryParams: { key: string; value: string; enabled: boolean; description: string }[];
}

function extractPostmanRequests(items: any[]): ExtractedPostmanReq[] {
  const reqs: ExtractedPostmanReq[] = [];
  
  function recurse(arr: any[]) {
    for (const item of arr) {
      if (item.request) {
        const reqData = item.request;
        const name = item.name || 'Untitled';
        const method = (reqData.method || 'GET').toUpperCase();
        
        let url = '';
        const queryParams: any[] = [];
        
        if (reqData.url) {
          if (typeof reqData.url === 'string') {
            url = reqData.url;
          } else {
            url = reqData.url.raw || '';
            if (Array.isArray(reqData.url.query)) {
              reqData.url.query.forEach((q: any) => {
                queryParams.push({
                  key: q.key || '',
                  value: q.value || '',
                  enabled: q.disabled !== true,
                  description: q.description || '',
                });
              });
            }
          }
        }
        
        if (url && url.includes('?') && queryParams.length === 0) {
          const qIdx = url.indexOf('?');
          const search = url.substring(qIdx + 1);
          url = url.substring(0, qIdx);
          const pairs = search.split('&');
          pairs.forEach(pair => {
            const eqIdx = pair.indexOf('=');
            if (eqIdx > -1) {
              queryParams.push({
                key: decodeURIComponent(pair.substring(0, eqIdx)),
                value: decodeURIComponent(pair.substring(eqIdx + 1)),
                enabled: true,
                description: '',
              });
            } else if (pair) {
              queryParams.push({
                key: decodeURIComponent(pair),
                value: '',
                enabled: true,
                description: '',
              });
            }
          });
        }
        
        const headers: any[] = [];
        if (Array.isArray(reqData.header)) {
          reqData.header.forEach((h: any) => {
            headers.push({
              key: h.key || '',
              value: h.value || '',
              enabled: h.disabled !== true,
              description: h.description || '',
            });
          });
        }
        
        let bodyType = 'none';
        let body = '';
        if (reqData.body) {
          bodyType = reqData.body.mode || 'none';
          if (bodyType === 'raw') {
            body = reqData.body.raw || '';
            const ctHeader = headers.find(h => h.key.toLowerCase() === 'content-type');
            if (ctHeader?.value.toLowerCase().includes('json') || body.trim().startsWith('{') || body.trim().startsWith('[')) {
              bodyType = 'json';
            } else {
              bodyType = 'text';
            }
          } else if (bodyType === 'urlencoded' && Array.isArray(reqData.body.urlencoded)) {
            body = reqData.body.urlencoded
              .map((param: any) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
              .join('&');
          }
        }
        
        reqs.push({
          name,
          method,
          url,
          headers,
          bodyType,
          body,
          queryParams,
        });
      } else if (Array.isArray(item.item)) {
        recurse(item.item);
      }
    }
  }
  
  recurse(items);
  return reqs;
}

export default function TesterClient({ 
  collections, 
  environments, 
  initialRequest,
  preselectedColId 
}: TesterClientProps) {
  const router = useRouter();

  // URL & Method
  const [method, setMethod] = useState(initialRequest?.method || 'GET');
  const [url, setUrl] = useState(initialRequest?.url || '');

  // Environment Selector
  const [selectedEnvId, setSelectedEnvId] = useState<string>('none');
  const [activeVariables, setActiveVariables] = useState<Record<string, string>>({});

  // Tabs for configuration
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  // Parameters, Headers & Body lists
  const [params, setParams] = useState<KeyValueRow[]>([{ key: '', value: '', enabled: true, description: '' }]);
  const [headersList, setHeadersList] = useState<KeyValueRow[]>([{ key: '', value: '', enabled: true, description: '' }]);
  const [bodyType, setBodyType] = useState(initialRequest?.bodyType || 'none');
  const [body, setBody] = useState(initialRequest?.body || '');
  const [formDataList, setFormDataList] = useState<KeyValueRow[]>(() => {
    if (initialRequest?.bodyType === 'form-data' && initialRequest?.body) {
      try {
        const parsed = JSON.parse(initialRequest.body);
        if (Array.isArray(parsed)) {
          return [...parsed.map(row => ({ key: row.key, value: row.value, enabled: true, description: '' })), { key: '', value: '', enabled: true, description: '' }];
        }
      } catch (e) {}
    }
    return [{ key: '', value: '', enabled: true, description: '' }];
  });

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [parsedRequests, setParsedRequests] = useState<ExtractedPostmanReq[]>([]);

  // Send states
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');

  // Save Snapshot states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMode, setSaveMode] = useState<'existing' | 'new'>('new');
  const [selectedColId, setSelectedColId] = useState(preselectedColId || (collections[0]?.id ?? ''));
  const [selectedEndpointId, setSelectedEndpointId] = useState('');
  const [newEndpointName, setNewEndpointName] = useState('');
  const [newEndpointPath, setNewEndpointPath] = useState('');
  const [newEndpointDesc, setNewEndpointDesc] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync selected environment variables
  useEffect(() => {
    if (selectedEnvId === 'none') {
      setActiveVariables({});
    } else {
      const env = environments.find(e => e.id === selectedEnvId);
      setActiveVariables(env ? env.variables : {});
    }
  }, [selectedEnvId, environments]);

  // Sync preselected endpoint path when URL changes
  useEffect(() => {
    try {
      const parsed = new URL(url);
      setNewEndpointPath(parsed.pathname);
    } catch (e) {
      setNewEndpointPath(url);
    }
  }, [url]);

  // Load initial request settings if available (e.g. from history click)
  useEffect(() => {
    if (initialRequest) {
      setMethod(initialRequest.method);
      setUrl(initialRequest.url);
      setBodyType(initialRequest.bodyType);
      setBody(initialRequest.body || '');

      if (initialRequest.bodyType === 'form-data' && initialRequest.body) {
        try {
          const parsed = JSON.parse(initialRequest.body);
          if (Array.isArray(parsed)) {
            setFormDataList([...parsed.map(row => ({ key: row.key, value: row.value, enabled: true, description: '' })), { key: '', value: '', enabled: true, description: '' }]);
          } else {
            setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
          }
        } catch (e) {
          setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
        }
      } else {
        setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
      }

      if (initialRequest.headers && initialRequest.headers.length > 0) {
        setHeadersList(
          initialRequest.headers.map(h => ({
            key: h.key,
            value: h.value,
            enabled: h.enabled !== false,
            description: '',
          }))
        );
      }
    }
  }, [initialRequest]);

  // Environment substitution resolver
  const resolve = (text: string): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim();
      return activeVariables[trimmed] !== undefined ? activeVariables[trimmed] : match;
    });
  };

  // Auto-extends KeyValue grids
  const handleGridChange = (
    index: number,
    field: keyof KeyValueRow,
    value: any,
    type: 'params' | 'headers' | 'form-data'
  ) => {
    const list = type === 'params' ? [...params] : type === 'headers' ? [...headersList] : [...formDataList];
    list[index][field] = value as never;

    // Add empty row if last is touched
    if (index === list.length - 1 && (list[index].key || list[index].value)) {
      list.push({ key: '', value: '', enabled: true, description: '' });
    }

    if (type === 'params') {
      setParams(list);
    } else if (type === 'headers') {
      setHeadersList(list);
    } else {
      setFormDataList(list);
    }
  };

  const removeRow = (index: number, type: 'params' | 'headers' | 'form-data') => {
    const list = type === 'params' ? [...params] : type === 'headers' ? [...headersList] : [...formDataList];
    if (list.length === 1) return; // keep at least one
    list.splice(index, 1);
    if (type === 'params') {
      setParams(list);
    } else if (type === 'headers') {
      setHeadersList(list);
    } else {
      setFormDataList(list);
    }
  };

  // Loader utility to populate the sandbox builder state with parsed request properties
  const loadRequestIntoTester = (req: {
    method: string;
    url: string;
    headers: { key: string; value: string; enabled: boolean; description: string }[];
    bodyType: string;
    body: string;
    queryParams?: { key: string; value: string; enabled: boolean; description: string }[];
  }) => {
    setMethod(req.method || 'GET');
    setUrl(req.url || '');
    setBodyType(req.bodyType || 'none');
    setBody(req.body || '');

    // For body formdata
    if (req.bodyType === 'form-data' && req.body) {
      try {
        const parsed = JSON.parse(req.body);
        if (Array.isArray(parsed)) {
          setFormDataList([...parsed.map(row => ({ key: row.key, value: row.value, enabled: true, description: '' })), { key: '', value: '', enabled: true, description: '' }]);
        } else {
          setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
        }
      } catch (e) {
        setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
      }
    } else {
      setFormDataList([{ key: '', value: '', enabled: true, description: '' }]);
    }

    // For headers list, add an empty row at the end to keep the auto-extend grid happy
    const cleanHeaders = req.headers && req.headers.length > 0 
      ? [...req.headers.map(h => ({ key: h.key, value: h.value, enabled: h.enabled !== false, description: h.description || '' }))]
      : [];
    cleanHeaders.push({ key: '', value: '', enabled: true, description: '' });
    setHeadersList(cleanHeaders);

    // For query parameters list, add an empty row at the end as well
    const cleanParams = req.queryParams && req.queryParams.length > 0
      ? [...req.queryParams.map(p => ({ key: p.key, value: p.value, enabled: p.enabled !== false, description: p.description || '' }))]
      : [];
      cleanParams.push({ key: '', value: '', enabled: true, description: '' });
    setParams(cleanParams);

    // Focus tab depending on request method and contents
    if (req.method !== 'GET' && req.body) {
      setActiveTab('body');
    } else if (cleanParams.length > 1) {
      setActiveTab('params');
    } else {
      setActiveTab('headers');
    }
  };

  // Submission handler that parses the import text input
  const handleImportSubmit = () => {
    setImportError('');
    const text = importText.trim();
    if (!text) return;

    // 1. Check if it's JSON
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        
        // Case A: Postman Collection
        if (parsed.info && Array.isArray(parsed.item)) {
          const extracted = extractPostmanRequests(parsed.item);
          if (extracted.length === 0) {
            throw new Error('No requests found in the Postman collection.');
          }
          if (extracted.length === 1) {
            loadRequestIntoTester(extracted[0]);
            setShowImportModal(false);
          } else {
            setParsedRequests(extracted);
          }
          return;
        }
        
        // Case B: Single Postman Item (has request object)
        if (parsed.request) {
          const extracted = extractPostmanRequests([parsed]);
          if (extracted.length > 0) {
            loadRequestIntoTester(extracted[0]);
            setShowImportModal(false);
            return;
          }
        }
        
        // Case C: Single Postman raw request structure (has method and url)
        if (parsed.method && parsed.url) {
          const mockItem = { name: parsed.name || 'Imported Request', request: parsed };
          const extracted = extractPostmanRequests([mockItem]);
          if (extracted.length > 0) {
            loadRequestIntoTester(extracted[0]);
            setShowImportModal(false);
            return;
          }
        }

        throw new Error('Unsupported JSON format. Make sure it is a valid Postman Collection or request object.');
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON content.');
        return;
      }
    }

    // 2. Check if it's a cURL command
    if (text.toLowerCase().startsWith('curl')) {
      try {
        const parsed = parseCurlCommand(text);
        if (!parsed.url) {
          throw new Error('Could not find a valid URL in the cURL command.');
        }
        loadRequestIntoTester(parsed);
        setShowImportModal(false);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse cURL command.');
      }
      return;
    }

    setImportError('Unrecognized format. Please paste a valid cURL command or Postman JSON.');
  };

  // Compile final url with params
  const getCompiledUrl = () => {
    const baseUrlResolved = resolve(url.trim());
    if (!baseUrlResolved) return '';

    try {
      // Build search params
      const searchParams = new URLSearchParams();
      params.forEach(p => {
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

  // Execute Request
  const handleSend = async () => {
    const finalUrl = getCompiledUrl();
    if (!finalUrl) return;

    setSending(true);
    setResponse(null);

    // Filter and resolve headers
    const reqHeaders = headersList
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
          method,
          headers: reqHeaders,
          bodyType,
          body: bodyType === 'form-data'
            ? JSON.stringify(formDataList.filter(f => f.key && f.enabled).map(f => ({ key: resolve(f.key), value: resolve(f.value) })))
            : (bodyType !== 'none' ? resolve(body) : null),
        }),
      });

      const data = await res.json();
      setResponse(data);
      router.refresh(); // trigger refresh to update history sidebar list
    } catch (err: any) {
      setResponse({
        ok: false,
        status: 0,
        statusText: 'Proxy Request Failed',
        responseTime: 0,
        responseSize: 0,
        headers: [],
        body: err.message || 'An unexpected proxy error occurred',
      });
    } finally {
      setSending(false);
    }
  };

  // Save response snapshot
  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSnapshot(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      let endpointId = selectedEndpointId;

      // If new, register endpoint first
      if (saveMode === 'new') {
        if (!newEndpointName.trim() || !newEndpointPath.trim()) {
          throw new Error('Name and path are required');
        }

        const epRes = await fetch('/api/endpoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionId: selectedColId,
            name: newEndpointName,
            method,
            path: newEndpointPath,
            description: newEndpointDesc,
          }),
        });

        if (!epRes.ok) {
          const epData = await epRes.json();
          throw new Error(epData.error || 'Failed to register endpoint');
        }

        const newEp = await epRes.json();
        endpointId = newEp.id;
      }

      if (!endpointId) {
        throw new Error('Please select or register an endpoint');
      }

      // Save the Snapshot
      const snapRes = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId,
          statusCode: response.status,
          responseTime: response.responseTime,
          responseSize: response.responseSize,
          responseHeaders: response.headers,
          responseBody: response.body,
          requestHeaders: headersList.filter(h => h.key && h.enabled).map(h => ({ key: h.key, value: h.value })),
          requestBody: bodyType === 'form-data'
            ? JSON.stringify(formDataList.filter(f => f.key && f.enabled).map(f => ({ key: f.key, value: f.value })))
            : (bodyType !== 'none' ? body : null),
          requestParams: params.filter(p => p.key && p.enabled).map(p => ({ key: p.key, value: p.value })),
        }),
      });

      if (!snapRes.ok) {
        const snapData = await snapRes.json();
        throw new Error(snapData.error || 'Failed to save snapshot');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveSuccess(false);
        // Redirect to endpoints page to analyze
        router.push(`/dashboard/collections/${endpointId}`);
        router.refresh();
      }, 1000);

    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Copy response utility
  const copyResponse = () => {
    if (!response?.body) return;
    navigator.clipboard.writeText(response.body);
  };

  // Download response utility
  const downloadResponse = () => {
    if (!response?.body) return;
    const blob = new Blob([response.body], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Syntax highlighting mock / indentation parser
  const getPrettyBody = () => {
    if (!response?.body) return '';
    try {
      const parsed = JSON.parse(response.body);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return response.body;
    }
  };

  // Fetch endpoints for selected collection (to populate dropdown)
  const activeColEndpoints = collections.find(c => c.id === selectedColId)?.endpoints || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      
      {/* Request Header Bar */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/40 px-6 gap-4">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-white uppercase">API Client Sandbox</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Import Button */}
          <button
            onClick={() => {
              setImportText('');
              setImportError('');
              setParsedRequests([]);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <FileCode className="h-3.5 w-3.5 text-brand-400" />
            <span>Import cURL / Postman</span>
          </button>

          {/* Environment Switcher */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-400">Env:</span>
            <select 
              value={selectedEnvId} 
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 focus:border-brand-500 focus:outline-none"
            >
              <option value="none">No Environment</option>
              {environments.map(env => {
                const colName = env.scope === 'local' 
                  ? collections.find(c => c.id === env.collectionId)?.name 
                  : null;
                const label = colName 
                  ? `${env.name} (local: ${colName})` 
                  : `${env.name} (global)`;
                return (
                  <option key={env.id} value={env.id}>{label}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main split work pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        
        {/* Left Side: Request Builder */}
        <div className="border-r border-zinc-800 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          
          {/* Method and URL grid */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-bold text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/users or {{BASE_URL}}/users"
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-700 focus:border-brand-500 focus:outline-none font-mono"
              />

              <button
                onClick={handleSend}
                disabled={sending || !url}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
            {url.includes('{{') && (
              <div className="text-[11px] font-mono text-zinc-550 flex items-center gap-1.5 mt-1 ml-1 select-all">
                <Globe className="h-3 w-3 text-brand-500 shrink-0 animate-pulse" />
                <span>Resolved URL:</span>
                <span className={resolve(url).includes('{{') ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {resolve(url)}
                </span>
                {resolve(url).includes('{{') && (
                  <span className="text-[10px] text-amber-500/80">(Select an environment or define variables to resolve)</span>
                )}
              </div>
            )}
          </div>

          {/* Config Tabs */}
          <div className="border-b border-zinc-800/80">
            <nav className="flex gap-4">
              {['params', 'headers', 'body'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`border-b-2 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'border-brand-500 text-white' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'params' ? `Query Params (${params.filter(p=>p.key).length})` : 
                   tab === 'headers' ? `Headers (${headersList.filter(h=>h.key).length})` : 
                   `Body (${bodyType})`}
                </button>
              ))}
            </nav>
          </div>

          {/* Params grid view */}
          {activeTab === 'params' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                <div className="col-span-1"></div>
                <div className="col-span-4">Key</div>
                <div className="col-span-4">Value</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1"></div>
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {params.map((p, idx) => {
                  const resolvedKey = resolve(p.key);
                  const resolvedVal = resolve(p.value);
                  const keyHasVar = p.key.includes('{{');
                  const valHasVar = p.value.includes('{{');
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 flex justify-center">
                          <input 
                            type="checkbox" 
                            checked={p.enabled} 
                            onChange={(e) => handleGridChange(idx, 'enabled', e.target.checked, 'params')}
                            className="rounded border-zinc-800 bg-zinc-950 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={p.key}
                          onChange={(e) => handleGridChange(idx, 'key', e.target.value, 'params')}
                          placeholder="key"
                          className={`col-span-4 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                            keyHasVar 
                              ? resolvedKey.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                              : 'border-zinc-800 focus:border-brand-500'
                          }`}
                        />
                        <input 
                          type="text" 
                          value={p.value}
                          onChange={(e) => handleGridChange(idx, 'value', e.target.value, 'params')}
                          placeholder="value or {{VAR}}"
                          className={`col-span-4 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                            valHasVar 
                              ? resolvedVal.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                              : 'border-zinc-800 focus:border-brand-500'
                          }`}
                        />
                        <input 
                          type="text" 
                          value={p.description}
                          onChange={(e) => handleGridChange(idx, 'description', e.target.value, 'params')}
                          placeholder="desc"
                          className="col-span-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-brand-500 focus:outline-none"
                        />
                        <div className="col-span-1 flex justify-center">
                          <button 
                            onClick={() => removeRow(idx, 'params')}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {(keyHasVar || valHasVar) && (
                        <div className="col-span-12 grid grid-cols-12 gap-2 pl-6">
                          <div className="col-span-4">
                            {keyHasVar && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                resolvedKey.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                → {resolvedKey.includes('{{') ? 'unresolved' : resolvedKey}
                              </span>
                            )}
                          </div>
                          <div className="col-span-4">
                            {valHasVar && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                resolvedVal.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                → {resolvedVal.includes('{{') ? 'unresolved' : resolvedVal}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Headers grid view */}
          {activeTab === 'headers' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                <div className="col-span-1"></div>
                <div className="col-span-4">Key</div>
                <div className="col-span-4">Value</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1"></div>
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {headersList.map((h, idx) => {
                  const resolvedKey = resolve(h.key);
                  const resolvedVal = resolve(h.value);
                  const keyHasVar = h.key.includes('{{');
                  const valHasVar = h.value.includes('{{');
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 flex justify-center">
                          <input 
                            type="checkbox" 
                            checked={h.enabled} 
                            onChange={(e) => handleGridChange(idx, 'enabled', e.target.checked, 'headers')}
                            className="rounded border-zinc-800 bg-zinc-950 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={h.key}
                          onChange={(e) => handleGridChange(idx, 'key', e.target.value, 'headers')}
                          placeholder="Authorization"
                          className={`col-span-4 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                            keyHasVar 
                              ? resolvedKey.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                              : 'border-zinc-800 focus:border-brand-500'
                          }`}
                        />
                        <input 
                          type="text" 
                          value={h.value}
                          onChange={(e) => handleGridChange(idx, 'value', e.target.value, 'headers')}
                          placeholder="Bearer {{TOKEN}}"
                          className={`col-span-4 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                            valHasVar 
                              ? resolvedVal.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                              : 'border-zinc-800 focus:border-brand-500'
                          }`}
                        />
                        <input 
                          type="text" 
                          value={h.description}
                          onChange={(e) => handleGridChange(idx, 'description', e.target.value, 'headers')}
                          placeholder="desc"
                          className="col-span-2 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-brand-500 focus:outline-none"
                        />
                        <div className="col-span-1 flex justify-center">
                          <button 
                            onClick={() => removeRow(idx, 'headers')}
                            className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {(keyHasVar || valHasVar) && (
                        <div className="grid grid-cols-12 gap-2 pl-6">
                          <div className="col-span-4">
                            {keyHasVar && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                resolvedKey.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                → {resolvedKey.includes('{{') ? 'unresolved' : resolvedKey}
                              </span>
                            )}
                          </div>
                          <div className="col-span-4">
                            {valHasVar && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                resolvedVal.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                → {resolvedVal.includes('{{') ? 'unresolved' : resolvedVal}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Body editor view */}
          {activeTab === 'body' && (
            <div className="space-y-4 flex flex-col flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Content Type:</span>
                 <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 focus:border-brand-500 focus:outline-none"
                >
                  <option value="none">none</option>
                  <option value="json">application/json</option>
                  <option value="urlencoded">application/x-www-form-urlencoded</option>
                  <option value="form-data">multipart/form-data</option>
                  <option value="text">text/plain</option>
                </select>
              </div>

              {bodyType === 'form-data' ? (
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-1.5 px-2">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">Key</div>
                    <div className="col-span-5">Value</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {formDataList.map((row, idx) => {
                      const resolvedKey = resolve(row.key);
                      const resolvedVal = resolve(row.value);
                      const keyHasVar = row.key.includes('{{');
                      const valHasVar = row.value.includes('{{');
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 flex justify-center">
                              <input 
                                type="checkbox" 
                                checked={row.enabled} 
                                onChange={(e) => handleGridChange(idx, 'enabled', e.target.checked, 'form-data')}
                                className="rounded border-zinc-800 bg-zinc-950 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={row.key}
                              onChange={(e) => handleGridChange(idx, 'key', e.target.value, 'form-data')}
                              placeholder="key"
                              className={`col-span-5 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                                keyHasVar 
                                  ? resolvedKey.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                                  : 'border-zinc-800 focus:border-brand-500'
                              }`}
                            />
                            <input 
                              type="text" 
                              value={row.value}
                              onChange={(e) => handleGridChange(idx, 'value', e.target.value, 'form-data')}
                              placeholder="value or {{VAR}}"
                              className={`col-span-5 rounded border bg-zinc-950/60 px-2 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                                valHasVar 
                                  ? resolvedVal.includes('{{') ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-500/40 focus:border-emerald-400'
                                  : 'border-zinc-800 focus:border-brand-500'
                              }`}
                            />
                            <div className="col-span-1 flex justify-center">
                              <button 
                                type="button"
                                onClick={() => removeRow(idx, 'form-data')}
                                className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                title="Remove row"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {(keyHasVar || valHasVar) && (
                            <div className="grid grid-cols-12 gap-2 pl-6">
                              <div className="col-span-5">
                                {keyHasVar && (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                    resolvedKey.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    → {resolvedKey.includes('{{') ? 'unresolved' : resolvedKey}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-5">
                                {valHasVar && (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                    resolvedVal.includes('{{') ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    → {resolvedVal.includes('{{') ? 'unresolved' : resolvedVal}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                bodyType !== 'none' && (
                  <div className="flex-1 flex flex-col gap-1">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={bodyType === 'json' ? '{\n  "name": "Ali"\n}' : 'key=value&name=Ali'}
                      className={`w-full min-h-64 flex-1 rounded-lg border bg-zinc-950/80 p-4 text-xs font-mono text-white placeholder-zinc-800 focus:outline-none resize-y transition-colors ${
                        body.includes('{{') 
                          ? resolve(body).includes('{{') ? 'border-amber-500/40 focus:border-amber-400' : 'border-emerald-500/30 focus:border-emerald-400'
                          : 'border-zinc-800 focus:border-brand-500'
                      }`}
                    />
                    {body.includes('{{') && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <Globe className="h-3 w-3 text-brand-400 shrink-0" />
                        <span className="text-zinc-500">Body preview:</span>
                        <span className={`truncate ${
                          resolve(body).includes('{{') ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {resolve(body).includes('{{') ? 'Some variables are unresolved — select an environment' : resolve(body).substring(0, 80) + (resolve(body).length > 80 ? '…' : '')}
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

        </div>

        {/* Right Side: Response Viewer */}
        <div className="flex flex-col h-full bg-zinc-950/20 overflow-y-auto p-6 space-y-6">
          {sending ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm font-semibold tracking-wide">Executing HTTP Request...</p>
            </div>
          ) : !response ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3">
              <Activity className="h-10 w-10 text-zinc-700" />
              <p className="text-sm font-semibold">Ready to test</p>
              <p className="text-xs text-zinc-700">Enter a URL and click send to execute.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4 h-full">
              
              {/* Response Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-4">
                  {/* Status Code */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Status</span>
                    <span className={`text-sm font-extrabold ${response.status >= 200 && response.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {response.status || 'ERROR'} {response.statusText}
                    </span>
                  </div>

                  {/* Response Time */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Time</span>
                    <span className="text-sm font-bold text-white font-mono">{response.responseTime} ms</span>
                  </div>

                  {/* Size */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Size</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {response.responseSize > 1024 
                        ? `${(response.responseSize / 1024).toFixed(2)} KB` 
                        : `${response.responseSize} B`}
                    </span>
                  </div>
                </div>

                {/* Save Snapshot Button */}
                {response.status > 0 && collections.length > 0 && (
                  <button
                    onClick={() => { setSaveError(''); setSaveSuccess(false); setShowSaveModal(true); }}
                    className="flex items-center gap-1.5 rounded bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Snapshot</span>
                  </button>
                )}
              </div>

              {(() => {
                let detectedToken = '';
                if (response && response.body) {
                  try {
                    const parsed = JSON.parse(response.body);
                    const findToken = (obj: any): string => {
                      if (!obj || typeof obj !== 'object') return '';
                      const keys = ['token', 'access_token', 'accessToken', 'jwt', 'id_token', 'idToken'];
                      for (const k of keys) {
                        if (typeof obj[k] === 'string' && obj[k].length > 10) {
                          return obj[k];
                        }
                      }
                      if (obj.data) {
                        const t = findToken(obj.data);
                        if (t) return t;
                      }
                      for (const k of Object.keys(obj)) {
                        if (obj[k] && typeof obj[k] === 'object') {
                          const t = findToken(obj[k]);
                          if (t) return t;
                        }
                      }
                      return '';
                    };
                    detectedToken = findToken(parsed);
                  } catch (e) {}
                }

                if (!detectedToken) return null;

                return (
                  <div className="flex items-center justify-between rounded bg-brand-950/40 border border-brand-500/20 px-3.5 py-2.5 text-xs text-brand-300">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                      {selectedEnvId === 'none' ? (
                        <span>💡 <strong>Token detected in response!</strong> Select an environment at the top to save it.</span>
                      ) : (
                        <span>💡 <strong>Token detected in response!</strong> Save as <code>TOKEN</code> in active environment?</span>
                      )}
                    </div>
                    {selectedEnvId !== 'none' && (
                      <button
                        onClick={async () => {
                          const activeEnv = environments.find(e => e.id === selectedEnvId);
                          if (activeEnv) {
                            const updatedVars = {
                              ...activeEnv.variables,
                              TOKEN: detectedToken
                            };
                            try {
                              const res = await fetch(`/api/environments/${selectedEnvId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ variables: updatedVars })
                              });
                              if (res.ok) {
                                setActiveVariables(updatedVars);
                                alert('Token successfully saved as {{TOKEN}}!');
                              }
                            } catch (err) {
                              console.error('Failed to save token', err);
                            }
                          }
                        }}
                        className="rounded bg-brand-600 px-2.5 py-1 font-bold text-white hover:bg-brand-500 transition-colors cursor-pointer shrink-0 ml-4"
                      >
                        Save
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Response Tabs */}
              <div className="border-b border-zinc-800/60 flex items-center justify-between">
                <nav className="flex gap-4">
                  {['body', 'headers'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setResponseTab(tab as any)}
                      className={`border-b-2 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        responseTab === tab 
                          ? 'border-brand-500 text-white' 
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>

                {/* Copy/Download Panel */}
                {responseTab === 'body' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyResponse}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                      title="Copy response body"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={downloadResponse}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                      title="Download JSON file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Response Content area */}
              <div className="flex-1 min-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
                {responseTab === 'body' ? (
                  <pre className="text-zinc-300 leading-relaxed whitespace-pre-wrap select-text">
                    {getPrettyBody()}
                  </pre>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="pb-2">Header Key</th>
                        <th className="pb-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                      {response.headers.map((h: any, i: number) => (
                        <tr key={i} className="text-zinc-300">
                          <td className="py-2.5 font-semibold text-zinc-400 select-all pr-4">{h.key}</td>
                          <td className="py-2.5 break-all select-all font-mono">{h.value}</td>
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

      {/* DIALOG MODAL: SAVE SNAPSHOT */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Save className="h-4 w-4 text-brand-400" />
                <span>Save Endpoint Snapshot</span>
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSnapshot} className="space-y-4">
              {saveError && (
                <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded bg-emerald-950/40 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 animate-bounce" />
                  <span>Snapshot saved! Redirecting to API docs...</span>
                </div>
              )}

              {/* Save mode toggler */}
              <div className="grid grid-cols-2 gap-2 border border-zinc-800 rounded p-1 bg-zinc-950/40">
                <button
                  type="button"
                  onClick={() => setSaveMode('new')}
                  className={`rounded py-1 text-xs font-semibold ${saveMode === 'new' ? 'bg-brand-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Register New Endpoint
                </button>
                <button
                  type="button"
                  onClick={() => setSaveMode('existing')}
                  className={`rounded py-1 text-xs font-semibold ${saveMode === 'existing' ? 'bg-brand-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Append to Existing
                </button>
              </div>

              {/* Select Target Collection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Target Collection</label>
                <select 
                  value={selectedColId}
                  onChange={(e) => {
                    setSelectedColId(e.target.value);
                    setSelectedEndpointId('');
                  }}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                >
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>

              {/* Save form: New Endpoint */}
              {saveMode === 'new' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Endpoint Name</label>
                    <input 
                      type="text" 
                      value={newEndpointName}
                      onChange={(e) => setNewEndpointName(e.target.value)}
                      placeholder="Get Active User Profile"
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                      required={saveMode === 'new'}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Method</label>
                      <input 
                        type="text" 
                        value={method} 
                        readOnly 
                        className="w-full rounded border border-zinc-850 bg-zinc-900 text-zinc-500 px-3 py-2 text-sm text-center font-bold font-mono focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Endpoint Path</label>
                      <input 
                        type="text" 
                        value={newEndpointPath}
                        onChange={(e) => setNewEndpointPath(e.target.value)}
                        placeholder="/users/profile"
                        className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white font-mono focus:border-brand-500 focus:outline-none"
                        required={saveMode === 'new'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Description</label>
                    <textarea 
                      value={newEndpointDesc}
                      onChange={(e) => setNewEndpointDesc(e.target.value)}
                      placeholder="Fetches detailed account metadata for the authenticated browser token..."
                      rows={2}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                /* Save form: Existing Endpoint */
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Select Endpoint</label>
                  {activeColEndpoints.length === 0 ? (
                    <div className="text-xs italic text-red-400 py-2">No endpoints registered in this collection yet. Please select &quot;Register New Endpoint&quot; first.</div>
                  ) : (
                    <select 
                      value={selectedEndpointId}
                      onChange={(e) => setSelectedEndpointId(e.target.value)}
                      className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                      required={saveMode === 'existing'}
                    >
                      <option value="">-- Choose endpoint --</option>
                      {activeColEndpoints.map(ep => (
                        <option key={ep.id} value={ep.id}>{ep.method} {ep.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Submit panel */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowSaveModal(false)}
                  className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingSnapshot || (saveMode === 'existing' && !selectedEndpointId)}
                  className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 flex items-center gap-1.5"
                >
                  {savingSnapshot && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DIALOG MODAL: IMPORT cURL / POSTMAN */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-brand-400" />
                <span>Import cURL or Postman Request</span>
              </h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error banner */}
            {importError && (
              <div className="flex items-center gap-2 rounded bg-red-950/40 border border-red-500/20 p-2.5 text-xs text-red-400 mb-4 animate-shake">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {parsedRequests.length === 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Paste a raw <code className="text-zinc-200">curl</code> command (e.g. <code className="text-zinc-300">curl -X POST http://...</code>) or a Postman collection/request JSON. We will parse it and load the details directly.
                </p>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Paste cURL or JSON here...\n\nExample:\ncurl -X GET "https://api.example.com/users" -H "Authorization: Bearer my-token"`}
                  rows={8}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 text-xs font-mono text-white placeholder-zinc-800 focus:border-brand-500 focus:outline-none resize-y"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowImportModal(false)}
                    className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImportSubmit}
                    disabled={!importText.trim()}
                    className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              // Multi-request selection view
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 font-medium">
                  Multiple requests detected. Select a request to load into the API client sandbox:
                </p>

                <div className="max-h-80 overflow-y-auto space-y-2 border border-zinc-800 rounded-lg p-2 bg-zinc-950/40">
                  {parsedRequests.map((req, idx) => {
                    const methodColors: Record<string, string> = {
                      GET: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30',
                      POST: 'text-brand-400 bg-brand-950/20 border-brand-500/30',
                      PUT: 'text-amber-400 bg-amber-950/20 border-amber-500/30',
                      PATCH: 'text-yellow-500 bg-yellow-950/10 border-yellow-500/20',
                      DELETE: 'text-red-400 bg-red-950/20 border-red-500/30'
                    };

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          loadRequestIntoTester(req);
                          setShowImportModal(false);
                        }}
                        className="flex items-center justify-between border border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900 p-3 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 w-14 text-center ${methodColors[req.method] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                            {req.method}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-xs">{req.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 truncate max-w-xs">{req.url}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => setParsedRequests([])}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Back to paste box
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowImportModal(false)}
                    className="rounded px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
