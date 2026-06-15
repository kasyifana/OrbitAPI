import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{
    envId: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { data } = await auth.getSession();
    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { envId } = await params;
    const body = await req.json();
    const { name, variables, scope, collectionId } = body;

    if (scope === 'local' && (!collectionId || !collectionId.trim())) {
      return NextResponse.json({ error: 'Collection is required for local environments' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.environment.findFirst({
      where: { id: envId, userId: data.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Environment not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.environment.update({
      where: { id: envId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        variables: variables !== undefined ? variables : existing.variables,
        scope: scope !== undefined ? scope : (existing as any).scope,
        collectionId: scope !== undefined ? (scope === 'local' ? collectionId.trim() : null) : (existing as any).collectionId,
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

    const { envId } = await params;

    // Verify ownership
    const existing = await db.environment.findFirst({
      where: { id: envId, userId: data.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Environment not found or unauthorized' }, { status: 404 });
    }

    await db.environment.delete({
      where: { id: envId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
