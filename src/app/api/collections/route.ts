import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession();

    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, visibility, importData } = body;

    // Handle Postman Collection JSON import
    if (importData) {
      const info = importData.info;
      const items = importData.item;

      if (!info || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid Postman Collection format' }, { status: 400 });
      }

      // Create new Collection
      const collection = await db.collection.create({
        data: {
          userId: data.user.id,
          name: info.name || 'Imported Collection',
          description: info.description || null,
          visibility: visibility || 'private',
        },
      });

      // Map Postman request items to Orbit Endpoint model structure
      const endpointsToCreate = items.map((item: any) => {
        const reqData = item.request;
        if (!reqData) return null;

        // Path parser
        let path = '';
        if (reqData.url) {
          if (typeof reqData.url === 'string') {
            try {
              path = new URL(reqData.url).pathname;
            } catch (e) {
              path = reqData.url;
            }
          } else if (Array.isArray(reqData.url.path)) {
            path = '/' + reqData.url.path.join('/');
          } else if (reqData.url.raw) {
            try {
              path = new URL(reqData.url.raw).pathname;
            } catch (e) {
              path = reqData.url.raw;
            }
          }
        }

        // Headers list parser
        const headersList = Array.isArray(reqData.header)
          ? reqData.header.map((h: any) => ({
              key: h.key,
              value: h.value,
              description: h.description || '',
              required: true,
            }))
          : [];

        // Query parameters list parser
        const queryParamsList = reqData.url && Array.isArray(reqData.url.query)
          ? reqData.url.query.map((q: any) => ({
              key: q.key,
              value: q.value,
              description: q.description || '',
              required: false,
            }))
          : [];

        // Body content parser
        let bodyType = 'none';
        let bodyContent = null;
        if (reqData.body) {
          if (reqData.body.mode === 'raw') {
            bodyType = 'json';
            bodyContent = reqData.body.raw || null;
          }
        }

        return {
          collectionId: collection.id,
          name: item.name || 'Untitled Endpoint',
          method: (reqData.method || 'GET').toUpperCase(),
          path: path || '/',
          description: reqData.description || null,
          headers: headersList,
          queryParams: queryParamsList,
          bodyType,
          bodyContent,
        };
      }).filter(Boolean);

      // Bulk create endpoints
      if (endpointsToCreate.length > 0) {
        await db.endpoint.createMany({
          data: endpointsToCreate as any[],
        });
      }

      return NextResponse.json(collection);
    }

    // Standard single collection creation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        userId: data.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        visibility: visibility || 'private',
      },
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
