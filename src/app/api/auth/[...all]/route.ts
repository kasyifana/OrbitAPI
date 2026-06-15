import { NextRequest } from 'next/server';
import { auth } from "@/lib/auth";

const handlers = auth.handler();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ all: string[] }> }
) {
  const params = await context.params;
  const path = params.all || [];
  return (handlers.GET as any)(request, {
    params: Promise.resolve({ path })
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ all: string[] }> }
) {
  const params = await context.params;
  const path = params.all || [];
  return (handlers.POST as any)(request, {
    params: Promise.resolve({ path })
  });
}
