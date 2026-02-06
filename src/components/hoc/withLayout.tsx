'use client';

import { MobileNav } from '@/components/dashboard/MobileNav';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function withLayout<P extends object>(
  Component: React.ComponentType<P>,
  options: { showSidebar?: boolean } = {}
) {
  return function LayoutComponent(props: P) {
    const { showSidebar = true } = options;

    if (!showSidebar) {
      return <Component {...props} />;
    }

    return (
      <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
        <MobileNav />
        <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
        <main className='flex-1 overflow-y-auto'>
          <Component {...props} />
        </main>
      </div>
    );
  };
}
