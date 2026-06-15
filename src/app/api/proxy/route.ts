import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body, bodyType } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Clean and validate URL (ensure it has a protocol)
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `http://${targetUrl}`;
    }

    // Prepare headers
    const reqHeaders = new Headers();
    if (Array.isArray(headers)) {
      headers.forEach(({ key, value }) => {
        if (key && value) {
          reqHeaders.append(key, value);
        }
      });
    }

    // Configure Request Init
    const init: RequestInit = {
      method: method || 'GET',
      headers: reqHeaders,
    };

    // Prepare body
    if (method && method !== 'GET' && method !== 'HEAD' && body) {
      if (bodyType === 'json') {
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (!reqHeaders.has('content-type') && !reqHeaders.has('Content-Type')) {
          reqHeaders.append('content-type', 'application/json');
        }
      } else if (bodyType === 'urlencoded') {
        init.body = body;
        if (!reqHeaders.has('content-type') && !reqHeaders.has('Content-Type')) {
          reqHeaders.append('content-type', 'application/x-www-form-urlencoded');
        }
      } else {
        init.body = body;
      }
    }

    // Measure request timing
    const startTime = performance.now();
    let response: Response;
    try {
      response = await fetch(targetUrl, init);
    } catch (err: any) {
      const endTime = performance.now();
      return NextResponse.json({
        ok: false,
        status: 0,
        statusText: 'Network Error',
        responseTime: Math.round(endTime - startTime),
        responseSize: 0,
        headers: [],
        body: `Failed to fetch: ${err.message || 'Unknown network error'}. Make sure the URL is correct and the host is reachable.`,
      });
    }

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // Read response body & calculate size
    let responseBodyText = '';
    let responseSize = 0;
    try {
      responseBodyText = await response.text();
      // Calculate byte size using standard Blob API
      responseSize = new Blob([responseBodyText]).size;
    } catch (err) {
      responseBodyText = 'Error reading response content';
    }

    // Parse response headers
    const resHeaders: { key: string; value: string }[] = [];
    response.headers.forEach((value, key) => {
      resHeaders.push({ key, value });
    });

    // Automatically log history in the database if user is authenticated
    try {
      const { auth: serverAuth } = await import('@/lib/auth');
      const { db: database } = await import('@/lib/db');
      
      const { data } = await serverAuth.getSession();

      if (data && data.user) {
        await database.historyItem.create({
          data: {
            userId: data.user.id,
            method: method || 'GET',
            url: targetUrl,
            headers: headers || [],
            bodyType: bodyType || 'none',
            body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
            responseStatus: response.status,
            responseTime,
            responseBody: responseBodyText,
          },
        });
      }
    } catch (historyErr) {
      // Fail silently for history logging to avoid disrupting the request execution itself
      console.error('Failed to log request history:', historyErr);
    }

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      responseSize,
      headers: resHeaders,
      body: responseBodyText,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal proxy error' },
      { status: 500 }
    );
  }
}
