'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { FileText, Lightbulb, Sparkles } from 'lucide-react';

interface TaskCardProps {
  title: string;
  gradient: 'pink' | 'purple' | 'blue' | 'green';
  icon?: 'lightbulb' | 'file' | 'sparkles';
  avatars?: string[];
  className?: string;
  onClick?: () => void;
}

export function TaskCard({
  title,
  gradient,
  icon = 'lightbulb',
  avatars,
  className,
  onClick,
}: TaskCardProps) {
  // Toutes les cartes utilisent maintenant blue-600 (pas de dégradé)

  const icons = {
    lightbulb: Lightbulb,
    file: FileText,
    sparkles: Sparkles,
  };

  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn('cursor-pointer', className)}
    >
      <div
        className={cn(
          'relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-blue-600 text-white overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300',
        )}
      >
        <div className='relative z-10'>
          <div className='flex items-start justify-between mb-3 sm:mb-4'>
            <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
              <Icon className='w-5 h-5 sm:w-6 sm:h-6' />
            </div>
          </div>
          <h3 className='text-base sm:text-lg font-bold mb-4 sm:mb-6 leading-tight'>
            {title}
          </h3>
          {avatars && avatars.length > 0 && (
            <div className='flex items-center gap-2'>
              {avatars.map((avatar, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className='w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-xs font-semibold shadow-md'
                >
                  {avatar}
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {/* Decorative elements with animation */}
        <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse' />
        <div className='absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse delay-75' />
        <div className='absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-150' />
      </div>
    </motion.div>
  );
}
