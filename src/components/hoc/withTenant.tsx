'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MobileNav } from '../dashboard/MobileNav';
import { Sidebar } from '../dashboard/Sidebar';

export interface TenantContext {
  tenantId: string;
  name?: string;
  tenantSlug?: string;
}

export function withTenant<P extends object>(
  Component: React.ComponentType<P & { tenant: TenantContext }>
) {
  return function TenantComponent(props: P) {
    const params = useParams();
    const [tenant, setTenant] = useState<TenantContext | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadTenant = async () => {
        const tenantId = params?.tenantId as string;

        if (!tenantId) {
          setIsLoading(false);
          return;
        }

        // TODO: Charger les infos du tenant depuis l'API
        // Pour l'instant, on simule
        await new Promise((resolve) => setTimeout(resolve, 300));

        setTenant({
          tenantId,
          name: tenantId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          tenantSlug: tenantId,
        });

        setIsLoading(false);
      };

      loadTenant();
    }, [params]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      );
    }

    if (!tenant) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Tenant introuvable
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Le club demandé n'existe pas.
            </p>
          </div>
        </div>
      );
    }

    return  (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
      <MobileNav />
      <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
      <main 
        className='flex-1 overflow-y-auto m-8' 
        style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        <Component {...props} tenant={tenant} />
      </main>
    </div>
    );
  };
}
