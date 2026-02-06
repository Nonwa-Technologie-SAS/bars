'use client';

import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700'
        aria-label='Toggle menu'
      >
        {isOpen ? (
          <X className='w-6 h-6 text-gray-900 dark:text-white' />
        ) : (
          <Menu className='w-6 h-6 text-gray-900 dark:text-white' />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className='fixed inset-0 bg-black/50 z-40 md:hidden'
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              'fixed top-0 left-0 h-full w-72 max-w-[80vw] z-40 transform transition-transform duration-300 ease-in-out md:hidden',
              isOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <Sidebar />
          </div>
        </>
      )}
    </>
  );
}
