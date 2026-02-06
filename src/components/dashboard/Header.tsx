'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useI18n } from '@/components/providers/I18nProvider';
import { useRouter, useParams } from 'next/navigation';
import { Search, Bell, Clock, ChevronDown, Volume2, Languages } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { CommandPalette } from './CommandPalette';

export function Header() {
  const { user, logout } = useAuthStore();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [currentDate, setCurrentDate] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description?: string; timeLabel: string; unread?: boolean }>>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [showNewOrdersIndicator, setShowNewOrdersIndicator] = useState(false);
  const hideNewOrdersTimeoutRef = useRef<number | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const intlLocale = useMemo(() => {
    if (locale === 'fr') return 'fr-FR';
    if (locale === 'en') return 'en-US';
    if (locale === 'lb' || locale === 'ar') return 'ar';
    if (locale === 'zh') return 'zh-CN';
    return 'fr-FR';
  }, [locale]);

  useEffect(() => {
    // Mettre à jour la date
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString(intlLocale, options));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000); // Mise à jour chaque minute
    return () => clearInterval(interval);
  }, [intlLocale]);

  // Raccourci clavier pour ouvrir le Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data: any = event.data || {};
      if (data?.type === "PUSH_RECEIVED") {
        const p = data.payload || {};
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const timeLabel = new Date().toLocaleString(intlLocale, { weekday: "long", hour: "2-digit", minute: "2-digit" });
        setNotifications((prev) => [{ id, title: p.title || "Notification", description: p.body, timeLabel, unread: true }, ...prev].slice(0, 20));

        // Si la notification correspond à une nouvelle commande, on active aussi l'icône audio
        const isNewOrder =
          typeof p.title === 'string' && p.title.toLowerCase().includes('nouvelle commande');
        if (isNewOrder) {
          const increment = typeof (p as any).count === 'number' ? (p as any).count : 1;
          setNewOrdersCount((prev) => prev + increment);
          setShowNewOrdersIndicator(true);
          if (hideNewOrdersTimeoutRef.current) {
            window.clearTimeout(hideNewOrdersTimeoutRef.current);
          }
          hideNewOrdersTimeoutRef.current = window.setTimeout(() => {
            setShowNewOrdersIndicator(false);
            setNewOrdersCount(0);
          }, 60_000);
        }
      }

      // Événement interne envoyé par le dashboard quand de nouvelles commandes arrivent
      if (data?.type === 'NEW_ORDER_BATCH') {
        const increment =
          typeof data.count === 'number' && data.count > 0 ? data.count : 1;
        setNewOrdersCount((prev) => prev + increment);
        setShowNewOrdersIndicator(true);
        if (hideNewOrdersTimeoutRef.current) {
          window.clearTimeout(hideNewOrdersTimeoutRef.current);
        }
        hideNewOrdersTimeoutRef.current = window.setTimeout(() => {
          setShowNewOrdersIndicator(false);
          setNewOrdersCount(0);
        }, 60_000);
      }
    };
    navigator.serviceWorker?.addEventListener?.("message", handler as any);
    window.addEventListener('message', handler as any);
    return () => {
      navigator.serviceWorker?.removeEventListener?.("message", handler as any);
      window.removeEventListener('message', handler as any);
      if (hideNewOrdersTimeoutRef.current) {
        window.clearTimeout(hideNewOrdersTimeoutRef.current);
      }
    };
  }, []);

  const displayName = user?.name || user?.email || t('header.userMenu.fallback');
  const displayEmail = user?.email || '';
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  const handleProfile = () => {
    if (tenantId) {
      router.push(`/${tenantId}/settings?tab=profile`);
    }
  };

  const handleSettings = () => {
    if (tenantId) {
      router.push(`/${tenantId}/settings`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              type="search"
              placeholder={t('header.search.placeholder')}
              className="pl-7 sm:pl-9 pr-20 sm:pr-24 h-9 sm:h-10 w-full text-sm sm:text-base bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
              onClick={() => setCommandPaletteOpen(true)}
              readOnly
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                <span className="text-xs">⌘</span>
                <span>K</span>
              </kbd>
              <kbd className="sm:hidden inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                <span className="text-xs">⌃</span>
                <span>K</span>
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Indicateur audio nouvelles commandes */}
        {showNewOrdersIndicator && newOrdersCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-xs sm:text-sm font-medium animate-pulse">
            <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{newOrdersCount}</span>
          </div>
        )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] p-0 shadow-xl rounded-xl">
              <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t('header.notifications.title')}</h3>
                  <button
                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                  >
                    {t('header.notifications.markAllRead')}
                  </button>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">{t('header.notifications.empty')}</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-3 sm:px-4 py-2.5 sm:py-3 flex gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold shrink-0">•</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            {n.unread && <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>}
                          </div>
                          {n.description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.description}</p>}
                          <p className="text-[11px] text-gray-400 mt-1">{n.timeLabel}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {currentDate}
            </span>
          </div>

          {/* Sélecteur de langue */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Languages className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{t('header.language.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocale('fr')}
                  className={`cursor-pointer ${
                    locale === 'fr'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <span className="mr-2">🇫🇷</span>
                  {t('header.language.fr')}
                  {locale === 'fr' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('en')}
                  className={`cursor-pointer ${
                    locale === 'en'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <span className="mr-2">🇬🇧</span>
                  {t('header.language.en')}
                  {locale === 'en' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('lb')}
                  className={`cursor-pointer ${
                    locale === 'lb'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <span className="mr-2">🇱🇧</span>
                  {t('header.language.lb')}
                  {locale === 'lb' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('ar')}
                  className={`cursor-pointer ${
                    locale === 'ar'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <span className="mr-2">🇸🇦</span>
                  {t('header.language.ar')}
                  {locale === 'ar' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('zh')}
                  className={`cursor-pointer ${
                    locale === 'zh'
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <span className="mr-2">🇨🇳</span>
                  {t('header.language.zh')}
                  {locale === 'zh' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>

          {/* Profil utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 h-auto p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{displayName}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{displayEmail}</span>
                </div>
                <ChevronDown className="hidden lg:block h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-56 max-w-[280px]">
              <DropdownMenuLabel>{t('header.userMenu.account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                {t('header.userMenu.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                {t('header.userMenu.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 dark:text-red-400 cursor-pointer"
              >
                {t('header.userMenu.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </header>
  );
}
