import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH: Update endpoint metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const { data } = await auth.getSession();

    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpointId } = await params;
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify ownership
    const endpoint = await db.endpoint.findFirst({
      where: {
        id: endpointId,
        collection: { userId: data.user.id }
      }
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found or access denied' }, { status: 404 });
    }

    const updated = await db.endpoint.update({
      where: { id: endpointId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Permanent deletion
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  try {
    const { data } = await auth.getSession();

    if (!data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpointId } = await params;

    // Verify ownership
    const endpoint = await db.endpoint.findFirst({
      where: {
        id: endpointId,
        collection: { userId: data.user.id }
      }
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found or access denied' }, { status: 404 });
    }

    await db.endpoint.delete({
      where: { id: endpointId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
