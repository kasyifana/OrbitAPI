import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import EndpointDetailsClient from '@/components/EndpointDetailsClient';

interface PageProps {
  params: Promise<{
    endpointId: string;
  }>;
}

export default async function EndpointDetailsPage({ params }: PageProps) {
  const { data } = await auth.getSession();

  if (!data || !data.user) {
    redirect('/login');
  }

  const userId = data.user.id;
  const { endpointId } = await params;

  // Parallel database reads for endpoint details and environments
  const [endpoint, environments] = await Promise.all([
    db.endpoint.findFirst({
      where: {
        id: endpointId,
        collection: { userId },
      },
      include: {
        collection: {
          select: {
            name: true,
            visibility: true,
            defaultEnvId: true,
          } as any,
        },
        snapshots: {
          select: {
            id: true,
            version: true,
            statusCode: true,
            responseTime: true,
            responseSize: true,
            responseBody: true,
            createdAt: true,
            requestHeaders: true,
            requestBody: true,
            requestParams: true,
            responseHeaders: true,
          },
          orderBy: { version: 'asc' },
        },
      },
    }),
    db.environment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        variables: true,
        scope: true,
        collectionId: true,
      } as any,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!endpoint) {
    notFound();
  }

  // Format details for Client Component hydration safety
  const formattedEndpoint = {
    id: endpoint.id,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    description: endpoint.description,
    collectionId: endpoint.collectionId,
    collectionName: endpoint.collection.name,
    collectionVisibility: endpoint.collection.visibility,
    collectionDefaultEnvId: (endpoint.collection as any).defaultEnvId || null,
    responseSchema: endpoint.responseSchema,
    headers: endpoint.headers,
    queryParams: endpoint.queryParams,
    bodyType: endpoint.bodyType,
    bodyContent: endpoint.bodyContent,
  };

  const formattedSnapshots = endpoint.snapshots.map(snap => ({
    id: snap.id,
    version: snap.version,
    statusCode: snap.statusCode,
    responseTime: snap.responseTime,
    responseSize: snap.responseSize,
    responseBody: snap.responseBody,
    createdAt: snap.createdAt.toISOString(),
    requestHeaders: snap.requestHeaders || [],
    requestBody: snap.requestBody || '',
    requestParams: snap.requestParams || [],
    responseHeaders: snap.responseHeaders || [],
  }));

  return (
    <EndpointDetailsClient 
      endpoint={formattedEndpoint as any}
      snapshots={formattedSnapshots}
      environments={environments.map((env: any) => ({
        id: env.id,
        name: env.name,
        variables: (env.variables as Record<string, string>) || {},
        scope: env.scope,
        collectionId: env.collectionId,
      }))}
    />
  );
}
