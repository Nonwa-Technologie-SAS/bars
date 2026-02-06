'use client';

import { useI18n } from '@/components/providers/I18nProvider';
import { Button } from '@/components/ui/button';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  FolderKanban,
  HelpCircle,
  Home,
  Inbox,
  Package,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  // Utiliser le store Zustand
  const { user, tenant, logout: storeLogout } = useAuthStore();

  const tenantSegment = useMemo(() => {
    // IMPORTANT: On utilise l'ID tenant (pas le slug) pour matcher les routes /[tenantId]
    // et éviter des appels API invalides du type /api/bbm/...
    if (tenant?.id) return tenant.id;
    const parts = (pathname || '').split('/').filter(Boolean);
    return parts[0] || '1';
  }, [pathname, tenant?.id]);

  const menuItems = [
    { icon: Home, label: t('sidebar.dashboard'), href: `/${tenantSegment}/dashboard` },
    { icon: Inbox, label: t('sidebar.products'), href: `/${tenantSegment}/products` },
    { icon: Package, label: t('sidebar.stocks'), href: `/${tenantSegment}/stocks` },
    { icon: FolderKanban, label: t('sidebar.tables'), href: `/${tenantSegment}/tables` },
    { icon: Users, label: t('sidebar.users'), href: `/${tenantSegment}/users` },
    {
      icon: Calendar,
      label: t('sidebar.orders'),
      href: `/${tenantSegment}/orders`,
      badge: 5,
    },
    { icon: BarChart3, label: t('sidebar.reports'), href: `/${tenantSegment}/reports` },
  ];

  return (
    <SidebarProvider
      className={cn('h-full w-auto bg-transparent', className)}
      style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
    >
      <ShadcnSidebar
        collapsible='none'
        className='h-full w-full max-w-[18rem] bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800'
      >
        {/* Logo */}
        <SidebarHeader className='px-6 py-6 border-b border-gray-200 dark:border-gray-800'>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex items-center gap-3'
          >
            <div className='w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center'>
              <span className='text-white font-bold text-lg'>+</span>
            </div>
            <span className='text-xl font-bold text-gray-900 dark:text-white'>
              Bars.
            </span>
          </motion.div>
        </SidebarHeader>

        {/* Menu Navigation */}
        <SidebarContent className='px-2 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto'>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className='space-y-0.5'>
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname?.startsWith(item.href) ?? false;

                  return (
                    <SidebarMenuItem key={item.label}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <SidebarMenuButton
                          isActive={isActive}
                          asChild
                          className={cn(
                            'w-full group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200',
                            isActive
                              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60',
                          )}
                        >
                          <a
                            href={item.href}
                            className='flex items-center gap-3 w-full'
                          >
                            {isActive && (
                              <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full' />
                            )}
                            <Icon
                              className={cn(
                                'w-5 h-5 transition-colors shrink-0',
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400',
                              )}
                            />
                            <span
                              className={cn(
                                'flex-1 font-medium text-sm',
                                isActive ? 'font-semibold' : '',
                              )}
                            >
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                  isActive
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer avec Help, Settings et Upgrade Card */}
        <SidebarFooter className='px-2 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4 border-t border-gray-200 dark:border-gray-800'>
          {/* Help & Support et Settings */}
          <div className='space-y-1'>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname?.includes('/help')}
                asChild
                className={cn(
                  'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors',
                  pathname?.includes('/help')
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60',
                )}
              >
                <a href={`/${tenantSegment}/help`} className='flex items-center gap-3 w-full'>
                  {pathname?.includes('/help') && (
                    <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full' />
                  )}
                  <HelpCircle
                    className={cn(
                      'w-5 h-5 shrink-0',
                      pathname?.includes('/help')
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400',
                    )}
                  />
                  <span className='font-medium text-sm'>
                    {t('sidebar.help')}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname?.includes('/settings')}
                asChild
                className={cn(
                  'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors',
                  pathname?.includes('/settings')
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60',
                )}
              >
                <a href={`/${tenantSegment}/settings`}>
                  <Settings
                    className={cn(
                      'w-5 h-5',
                      pathname?.includes('/settings')
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                  />
                  <span className='font-medium text-sm'>
                    {t('sidebar.settings')}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>

          {/* Carte Astuce / Contexte application */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className='relative overflow-hidden rounded-xl p-3 sm:p-4 bg-blue-600 shadow-lg'
          >
            <div className='relative z-10'>
              <div className='flex items-center gap-2 mb-2'>
                <Sparkles className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                <span className='text-white font-bold text-xs sm:text-sm'>
                  {t('sidebar.tip.title')}
                </span>
              </div>
              <p className='text-white/90 text-[10px] sm:text-xs mb-2 sm:mb-3'>
                {t('sidebar.tip.description')}
              </p>
              <Button
                size='sm'
                className='w-full bg-white text-blue-600 hover:bg-gray-50 font-semibold text-[10px] sm:text-xs h-7 sm:h-8'
                onClick={() => router.push(`/${tenantSegment}/help`)}
              >
                {t('sidebar.tip.cta')}
              </Button>
            </div>
          </motion.div>
        </SidebarFooter>
      </ShadcnSidebar>
    </SidebarProvider>
  );
}
