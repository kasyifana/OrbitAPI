import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{
    collectionId: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { data } = await auth.getSession();
    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionId } = await params;
    const body = await req.json();
    const { name, description, visibility, defaultEnvId } = body;

    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.collection.findFirst({
      where: { id: collectionId, userId: data.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.collection.update({
      where: { id: collectionId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        visibility: visibility !== undefined ? visibility : existing.visibility,
        defaultEnvId: defaultEnvId !== undefined ? defaultEnvId : (existing as any).defaultEnvId,
      } as any,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { data } = await auth.getSession();
    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionId } = await params;

    // Verify ownership
    const existing = await db.collection.findFirst({
      where: { id: collectionId, userId: data.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found or unauthorized' }, { status: 404 });
    }

    await db.collection.delete({
      where: { id: collectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
