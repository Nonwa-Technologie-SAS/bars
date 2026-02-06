'use client';

import { useI18n } from '@/components/providers/I18nProvider';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    ArrowRight,
    BarChart3,
    HelpCircle,
    Package,
    Search,
    Settings,
    ShoppingCart,
    Table as TableIcon,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: 'pages' | 'components';
  keywords?: string[];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.tenantId as string;
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(() => {
    if (!tenantId) return [];
    
    const basePath = `/${tenantId}`;
    return [
      {
        id: 'dashboard',
        label: t('sidebar.dashboard'),
        icon: TrendingUp,
        path: `${basePath}/dashboard`,
        category: 'pages',
        keywords: ['dashboard', 'accueil', 'home', 'tableau', 'board'],
      },
      {
        id: 'products',
        label: t('sidebar.products'),
        icon: Package,
        path: `${basePath}/products`,
        category: 'pages',
        keywords: ['products', 'produits', 'items', 'articles'],
      },
      {
        id: 'stocks',
        label: t('sidebar.stocks'),
        icon: Package,
        path: `${basePath}/stocks`,
        category: 'pages',
        keywords: ['stocks', 'stock', 'inventory', 'inventaire'],
      },
      {
        id: 'tables',
        label: t('sidebar.tables'),
        icon: TableIcon,
        path: `${basePath}/tables`,
        category: 'pages',
        keywords: ['tables', 'table', 'qr', 'qrcode'],
      },
      {
        id: 'users',
        label: t('sidebar.users'),
        icon: Users,
        path: `${basePath}/users`,
        category: 'pages',
        keywords: ['users', 'utilisateurs', 'team', 'équipe', 'members'],
      },
      {
        id: 'orders',
        label: t('sidebar.orders'),
        icon: ShoppingCart,
        path: `${basePath}/orders`,
        category: 'pages',
        keywords: ['orders', 'commandes', 'order'],
      },
      {
        id: 'reports',
        label: t('sidebar.reports'),
        icon: BarChart3,
        path: `${basePath}/reports`,
        category: 'pages',
        keywords: ['reports', 'rapports', 'report', 'analytics', 'statistics'],
      },
      {
        id: 'help',
        label: t('sidebar.help'),
        icon: HelpCircle,
        path: `${basePath}/help`,
        category: 'pages',
        keywords: ['help', 'aide', 'support', 'faq'],
      },
      {
        id: 'settings',
        label: t('sidebar.settings'),
        icon: Settings,
        path: `${basePath}/settings`,
        category: 'pages',
        keywords: ['settings', 'paramètres', 'preferences', 'config'],
      },
    ];
  }, [tenantId, t]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const query = search.toLowerCase().trim();
    return commands.filter((cmd) => {
      const labelMatch = cmd.label.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some((kw) =>
        kw.toLowerCase().includes(query)
      );
      return labelMatch || keywordMatch;
    });
  }, [commands, search]);

  const pages = useMemo(
    () => filteredCommands.filter((cmd) => cmd.category === 'pages'),
    [filteredCommands]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (command: CommandItem) => {
    router.push(command.path);
    onOpenChange(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="sr-only">
              {locale === 'fr'
                ? 'Rechercher une page'
                : locale === 'lb'
                  ? 'ابحث عن صفحة'
                  : 'Search for a page'}
            </DialogTitle>
          <div className="relative">
            <Input
              type="text"
              placeholder={t('header.search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-12 text-base"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </DialogHeader>
              <DialogDescription className="sr-only">
                {locale === 'fr'
                  ? "Recherchez et naviguez vers une page de l'application"
                  : locale === 'lb'
                    ? 'ابحث وانتقل إلى صفحة في التطبيق'
                    : 'Search and navigate to an application page'}
              </DialogDescription>
        <div className="max-h-[400px] overflow-y-auto px-2 pb-4">
          {pages.length > 0 ? (
            <div className="space-y-4">
              <div>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'Pages' : 'Pages'}
                </div>
                <div className="space-y-1">
                  {pages.map((command, index) => {
                    const Icon = command.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleSelect(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium">
                          {command.label}
                        </span>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 ${
                            isSelected
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {locale === 'fr'
                ? 'Aucun résultat trouvé'
                : 'No results found'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
