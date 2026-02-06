'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  logo?: string;
  avatars?: string[];
  priority?: 'high' | 'medium' | 'low';
}

interface TaskListProps {
  title: string;
  tasks: Task[];
  className?: string;
}

export function TaskList({ title, tasks, className }: TaskListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className='text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider'
      >
        {title}
      </motion.h3>
      <div className='space-y-3'>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, x: 4 }}
            className='flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-200 cursor-pointer group'
          >
            {task.logo && (
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200'>
                <span className='text-xl font-bold text-purple-600 dark:text-purple-400'>
                  {task.logo}
                </span>
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2 mb-1'>
                <p className='font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
                  {task.title}
                </p>
                {task.priority && (
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'destructive'
                        : task.priority === 'medium'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {task.priority}
                  </Badge>
                )}
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2'>
                {task.subtitle}
              </p>
              <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                <span className='flex items-center gap-1.5'>
                  <Clock className='w-3.5 h-3.5' />
                  {task.status}
                </span>
              </div>
            </div>
            {task.avatars && task.avatars.length > 0 && (
              <div className='flex items-center gap-2 flex-shrink-0'>
                {task.avatars.map((avatar, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + idx * 0.05 }}
                    className='w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-gray-800 shadow-md hover:scale-110 transition-transform'
                  >
                    {avatar}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
