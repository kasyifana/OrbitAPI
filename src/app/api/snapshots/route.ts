import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// Smart Schema Detection utility
function detectJsonSchema(json: any): any {
  if (json === null) return { type: 'null' };
  if (Array.isArray(json)) {
    return {
      type: 'array',
      items: json.length > 0 ? detectJsonSchema(json[0]) : { type: 'any' }
    };
  }
  const type = typeof json;
  if (type === 'object') {
    const properties: Record<string, any> = {};
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        properties[key] = detectJsonSchema(json[key]);
      }
    }
    return { type: 'object', properties };
  }
  return { type };
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession();

    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      endpointId, statusCode, responseTime, responseSize, responseHeaders, 
      responseBody, requestHeaders, requestBody, requestParams 
    } = await req.json();

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    // Verify endpoint owner
    const endpoint = await db.endpoint.findFirst({
      where: {
        id: endpointId,
        collection: { userId: data.user.id }
      },
      include: { collection: true }
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found or access denied' }, { status: 404 });
    }

    // Calculate next version number
    const lastSnapshot = await db.snapshot.findFirst({
      where: { endpointId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const nextVersion = lastSnapshot ? lastSnapshot.version + 1 : 1;

    // Smart Schema Detection: Extract type structures if response is JSON
    let responseSchema: any = null;
    try {
      const parsedBody = JSON.parse(responseBody);
      responseSchema = detectJsonSchema(parsedBody);
    } catch (e) {
      // Body is not JSON, schema remains null
    }

    // Begin transactional snapshot creation and endpoint schema update
    const [snapshot] = await db.$transaction([
      db.snapshot.create({
        data: {
          endpointId,
          version: nextVersion,
          statusCode: parseInt(statusCode),
          responseTime: parseFloat(responseTime),
          responseSize: parseFloat(responseSize),
          responseHeaders: responseHeaders || [],
          responseBody: responseBody || '',
          requestHeaders: requestHeaders || [],
          requestBody: requestBody || '',
          requestParams: requestParams || [],
        }
      }),
      db.endpoint.update({
        where: { id: endpointId },
        data: {
          responseSchema: responseSchema || undefined
        }
      })
    ]);

    return NextResponse.json(snapshot);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
