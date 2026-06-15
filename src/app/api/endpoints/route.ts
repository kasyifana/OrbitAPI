import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { data } = await auth.getSession();

    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionId, name, method, path, description, headers: reqHeadersList, queryParams } = await req.json();

    if (!collectionId || !name || !method || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership of the collection
    const collection = await db.collection.findFirst({
      where: { id: collectionId, userId: data.user.id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
    }

    const endpoint = await db.endpoint.create({
      data: {
        collectionId,
        name: name.trim(),
        method,
        path: path.trim(),
        description: description?.trim() || null,
        headers: reqHeadersList || [],
        queryParams: queryParams || [],
      },
    });

    return NextResponse.json(endpoint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
