'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: 'purple' | 'pink' | 'blue' | 'green';
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  gradient = 'purple',
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn('h-full', className)}
    >
      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-600">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {trend && (
              <span
                className={cn(
                  'text-xs sm:text-sm font-semibold',
                  trend.isPositive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
