import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardSidebar from '@/components/DashboardSidebar';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data } = await auth.getSession();

  // Protect the dashboard routes
  if (!data || !data.user) {
    redirect('/login');
  }

  const userId = data.user.id;

  // Parallel database queries to fetch Sidebar data
  const [collections, environments, history] = await Promise.all([
    db.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        endpoints: {
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            folder: true,
          } as any,
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    db.environment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    db.historyItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        method: true,
        url: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 text-white">
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        user={{
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        }}
        collections={collections as any}
        environments={environments.map((env: any) => ({
          id: env.id,
          name: env.name,
          variables: (env.variables as Record<string, string>) || {},
          scope: env.scope,
          collectionId: env.collectionId,
        }))}
        history={history.map(item => ({
          ...item,
          // Serialize dates for Client Component safety
          createdAt: item.createdAt.toISOString(),
        }))}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-dark-900 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
