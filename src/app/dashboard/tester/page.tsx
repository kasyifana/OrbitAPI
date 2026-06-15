import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import TesterClient from '@/components/TesterClient';

interface PageProps {
  searchParams: Promise<{
    colId?: string;
    historyId?: string;
  }>;
}

export default async function TesterPage({ searchParams }: PageProps) {
  const { data } = await auth.getSession();

  if (!data || !data.user) {
    redirect('/login');
  }

  const userId = data.user.id;
  const { colId, historyId } = await searchParams;

  // Parallel database reads for user collections and environments
  const [collections, environments] = await Promise.all([
    db.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        endpoints: {
          select: {
            id: true,
            name: true,
            method: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.environment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        variables: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // If loading a request from history
  let initialRequest = null;
  if (historyId) {
    const historyItem = await db.historyItem.findFirst({
      where: { id: historyId, userId },
    });

    if (historyItem) {
      initialRequest = {
        method: historyItem.method,
        url: historyItem.url,
        headers: Array.isArray(historyItem.headers) 
          ? (historyItem.headers as any) 
          : [],
        bodyType: historyItem.bodyType,
        body: historyItem.body,
      };
    }
  }

  return (
    <TesterClient
      collections={collections}
      environments={environments.map(env => ({
        id: env.id,
        name: env.name,
        // Ensure variables is safely typed as a Record<string, string>
        variables: (env.variables as Record<string, string>) || {},
      }))}
      initialRequest={initialRequest}
      preselectedColId={colId}
    />
  );
}
