import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200':
            variant === 'default',
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200':
            variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
            variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
            variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
            variant === 'destructive',
        },
        className
      )}
      style={{padding: '0.25rem 0.5rem'}}
      {...props}
    />
  );
}

export { Badge };
