'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  percentage,
  className,
  showLabel = true,
}: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {percentage}% task completed
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {100 - percentage}% remaining
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full shadow-sm relative overflow-hidden"
        >
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
    </div>
  );
}
