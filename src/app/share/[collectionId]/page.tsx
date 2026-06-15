import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ShareCollectionClient from '@/components/ShareCollectionClient';
import { ShieldAlert, Activity } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    collectionId: string;
  }>;
}

export default async function ShareCollectionPage({ params }: PageProps) {
  const { collectionId } = await params;

  // Retrieve collection details with its endpoints and snapshots
  const collection = await db.collection.findUnique({
    where: { id: collectionId },
    include: {
      endpoints: {
        include: {
          snapshots: {
            select: {
              id: true,
              version: true,
              statusCode: true,
              responseTime: true,
              responseSize: true,
              responseBody: true,
              requestHeaders: true,
              requestBody: true,
              requestParams: true,
              responseHeaders: true,
              createdAt: true,
            },
            orderBy: { version: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  // Enforce visibility constraint (only public or unlisted collections are visible)
  if (collection.visibility === 'private') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-950 px-4 text-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Private Collection</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The owner of this collection has marked it as private. If you believe this is an error, please ask the owner to set its visibility to Public or Unlisted.
          </p>
          <div className="pt-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors cursor-pointer"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map endpoints to safe Client types
  const formattedEndpoints = collection.endpoints.map(ep => ({
    id: ep.id,
    name: ep.name,
    method: ep.method,
    path: ep.path,
    description: ep.description,
    headers: ep.headers,
    queryParams: ep.queryParams,
    bodyType: ep.bodyType,
    bodyContent: ep.bodyContent,
    responseSchema: ep.responseSchema,
    snapshots: ep.snapshots.map(snap => ({
      id: snap.id,
      version: snap.version,
      statusCode: snap.statusCode,
      responseTime: snap.responseTime,
      responseSize: snap.responseSize,
      responseBody: snap.responseBody,
      requestHeaders: snap.requestHeaders,
      requestBody: snap.requestBody,
      requestParams: snap.requestParams,
      responseHeaders: snap.responseHeaders,
      createdAt: snap.createdAt.toISOString(),
    })),
  }));

  // Fetch environments: either local to this collection, or the collection's default/pinned environment
  const environments = await db.environment.findMany({
    where: {
      OR: [
        { collectionId: collection.id },
        { id: (collection as any).defaultEnvId || '' }
      ]
    } as any,
    select: {
      id: true,
      name: true,
      variables: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedEnvironments = environments.map(env => ({
    id: env.id,
    name: env.name,
    variables: (env.variables as Record<string, string>) || {},
  }));

  return (
    <ShareCollectionClient
      collection={{
        id: collection.id,
        name: collection.name,
        description: collection.description,
        defaultEnvId: (collection as any).defaultEnvId || null,
      }}
      endpoints={formattedEndpoints}
      environments={formattedEnvironments}
    />
  );
}
