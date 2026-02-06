'use client';

import type { AppLayoutContext } from '@/components/hoc/withAppLayout';
import { withAppLayout } from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatus } from '@/core/entities/Order';
import type { Order } from '@/shared/types';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Types pour les réponses API
interface ApiOrder {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  tableId: string;
  tenantId: string;
  paymentIntentId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ApiTable {
  id: string;
  label: string;
  qrCodeUrl: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  tenantId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ApiUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  tenantId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface NotificationPayload {
  url?: string;
  [key: string]: unknown;
}

// Type pour window avec webkitAudioContext
interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface DashboardPageProps {
  layout: AppLayoutContext;
}

function DashboardPage({ layout }: DashboardPageProps) {
  const { tenantId } = layout;
  const { t, locale } = useI18n();
  const intlLocale =
    locale === 'en'
      ? 'en-US'
      : locale === 'lb' || locale === 'ar'
      ? 'ar'
      : locale === 'zh'
      ? 'zh-CN'
      : 'fr-FR';
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [periodMonths, setPeriodMonths] = useState(6);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [timeRange, setTimeRange] = useState<
    'TODAY' | 'WEEK' | 'MONTH' | 'ALL'
  >('ALL');
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  const shortId = (id?: string) =>
    id ? (id.length > 8 ? `${id.slice(0, 8)}…` : id) : '';

  const notify = async (
    title: string,
    body: string,
    payload?: NotificationPayload
  ) => {
    try {
      if (Notification.permission !== 'granted') return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/next.svg',
          tag: 'bars-event',
          data: payload || {},
        });
        navigator.serviceWorker.controller?.postMessage?.({
          type: 'PUSH_RECEIVED',
          payload: { title, body, data: payload || {}, tag: 'bars-event' },
        });
      } else {
        new Notification(title, { body });
        // Fallback message dispatch
        window.postMessage(
          {
            type: 'PUSH_RECEIVED',
            payload: { title, body, data: payload || {} },
          },
          '*'
        );
      }
    } catch {}
  };
  const beep = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as WindowWithAudioContext).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {}
  };

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      Notification &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        if (!reg) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch {}
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    const controller = new AbortController();
    setLoading(true);
    const fetchAll = () =>
      Promise.all([
        fetch(`/api/${tenantId}/orders`, { signal: controller.signal }).then(
          (r) => r.json()
        ),
        fetch(`/api/${tenantId}/products`, { signal: controller.signal }).then(
          (r) => r.json()
        ),
        fetch(`/api/${tenantId}/users`, { signal: controller.signal }).then(
          (r) => r.json()
        ),
        fetch(`/api/${tenantId}/tables`, { signal: controller.signal }).then(
          (r) => r.json()
        ),
      ])
        .then(
          ([ordersRes, productsRes, usersRes, tablesRes]: [
            { orders?: ApiOrder[]; data?: ApiOrder[] } | ApiOrder[],
            { data?: ApiProduct[] } | ApiProduct[],
            { data?: ApiUser[] } | ApiUser[],
            { data?: ApiTable[] } | ApiTable[]
          ]) => {
            const list = Array.isArray(ordersRes)
              ? ordersRes
              : ordersRes.orders || ordersRes.data || [];
            const normalized = (list as ApiOrder[]).map((o) => ({
              ...o,
              createdAt:
                typeof o.createdAt === 'string'
                  ? new Date(o.createdAt)
                  : o.createdAt,
              updatedAt:
                typeof o.updatedAt === 'string'
                  ? new Date(o.updatedAt)
                  : o.updatedAt,
            })) as Order[];

            const sorted = normalized.sort((a, b) => {
              const dateA =
                a.createdAt instanceof Date
                  ? a.createdAt
                  : new Date(a.createdAt);
              const dateB =
                b.createdAt instanceof Date
                  ? b.createdAt
                  : new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });
            const currentIds = new Set(sorted.map((o) => o.id));
            const prevIds = prevOrderIdsRef.current;
            const newIds: string[] = [];
            currentIds.forEach((id) => {
              if (!prevIds.has(id)) newIds.push(id);
            });
            if (prevIds.size > 0 && newIds.length > 0) {
              // Notifier localement le dashboard
              if (typeof window !== 'undefined') {
                window.postMessage(
                  {
                    type: 'NEW_ORDER_BATCH',
                    count: newIds.length,
                  },
                  '*'
                );
              }

              newIds.slice(0, 3).forEach((id) => {
                const ord = sorted.find((o) => o.id === id);
                if (ord) {
                  const body = t('dashboard.toasts.newOrder.body').replace(
                    '{id}',
                    shortId(ord.id)
                  );
                  toast.success(body);
                  beep();
                  notify(t('dashboard.toasts.newOrder.title'), body, {
                    url: `/${tenantId}/orders`,
                  });
                }
              });
            }
            prevOrderIdsRef.current = currentIds;
            setOrders(sorted);

            const products = Array.isArray(productsRes)
              ? productsRes
              : productsRes.data || [];
            setProductsCount(products.length);
            const users = Array.isArray(usersRes)
              ? usersRes
              : usersRes.data || [];
            setUsersCount(users.length);
            const tlist = Array.isArray(tablesRes)
              ? tablesRes
              : tablesRes.data || [];
            const map: Record<string, string> = {};
            (tlist as ApiTable[]).forEach((t) => (map[t.id] = t.label));
            setTables(map);
          }
        )
        .finally(() => setLoading(false));

    fetchAll();
    const interval = setInterval(() => {
      fetchAll();
    }, 20000);
    return () => {
      clearInterval(interval);
      // controller.abort();
    };
  }, [tenantId]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    if (timeRange === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else if (timeRange === 'WEEK') {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - diffToMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
    } else if (timeRange === 'MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      const d =
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
      if (start && end) return d >= start && d < end;
      return true;
    });
  }, [orders, statusFilter, timeRange]);

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [filteredOrders]
  );
  const totalOrders = filteredOrders.length;

  const months = useMemo(() => {
    const now = new Date();
    const arr: { key: string; label: string }[] = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = d.toLocaleString(intlLocale, { month: 'short' });
      arr.push({ key, label });
    }
    return arr;
  }, [periodMonths, intlLocale]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m.key, 0));
    filteredOrders.forEach((o) => {
      const d =
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + o.totalAmount);
    });
    return months.map((m) => map.get(m.key) || 0);
  }, [months, filteredOrders]);

  const ordersByMonth = useMemo(() => {
    const map = new Map<string, number>();
    months.forEach((m) => map.set(m.key, 0));
    filteredOrders.forEach((o) => {
      const d =
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return months.map((m) => map.get(m.key) || 0);
  }, [months, filteredOrders]);

  const recentOrders = useMemo(
    () => filteredOrders.slice(0, 5),
    [filteredOrders]
  );

  const updateStatus = async (orderId: string, next: OrderStatus) => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/${tenantId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { order?: Order; error?: string };
      const updated = json?.order;
      if (updated) {
        setOrders((prev) =>
          prev
            .map((o) =>
              o.id === orderId
                ? { ...o, status: next, updatedAt: new Date() }
                : o
            )
            .sort((a, b) => {
              const dateA =
                a.createdAt instanceof Date
                  ? a.createdAt
                  : new Date(a.createdAt);
              const dateB =
                b.createdAt instanceof Date
                  ? b.createdAt
                  : new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            })
        );
        const body = t('dashboard.toasts.statusUpdated.body')
          .replace('{id}', shortId(orderId))
          .replace('{status}', String(next));
        toast.success(body);
        beep();
        notify(t('dashboard.toasts.statusUpdated.title'), body, {
          url: `/${tenantId}/orders`,
        });
      }
    } catch {}
  };

  // Helper pour obtenir l'icône de statut
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
      case OrderStatus.DELIVERED:
        return <CheckCircle2 className='h-4 w-4 text-blue-600' />;
      case OrderStatus.PREPARING:
      case OrderStatus.READY:
        return <Clock className='h-4 w-4 text-blue-500' />;
      case OrderStatus.CANCELLED:
        return <XCircle className='h-4 w-4 text-red-500' />;
      case OrderStatus.PENDING_PAYMENT:
        return <AlertCircle className='h-4 w-4 text-orange-500' />;
      default:
        return <Clock className='h-4 w-4 text-gray-500' />;
    }
  };

  // Helper pour obtenir la couleur du statut
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
      case OrderStatus.DELIVERED:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case OrderStatus.PREPARING:
      case OrderStatus.READY:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case OrderStatus.CANCELLED:
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case OrderStatus.PENDING_PAYMENT:
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  // Calcul des variations pour les KPIs (simulation)
  const kpiData = useMemo(() => {
    const prevMonthRevenue = totalRevenue * 0.85; // Simulation
    const prevMonthOrders = Math.floor(totalOrders * 0.85);
    const revenueChange =
      totalRevenue > 0
        ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;
    const ordersChange =
      totalOrders > 0
        ? ((totalOrders - prevMonthOrders) / prevMonthOrders) * 100
        : 0;

    return [
      {
        label: t('dashboard.kpis.revenue.label'),
        value: new Intl.NumberFormat(intlLocale, {
          style: 'currency',
          currency: 'XOF',
          maximumFractionDigits: 0,
        }).format(totalRevenue),
        icon: TrendingUp,
        change: revenueChange,
        changeLabel: t('dashboard.kpis.changeLabel'),
        iconColor: 'text-blue-600 dark:text-blue-300',
        cardBg:
          'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20',
        cardBorder: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-900 dark:text-blue-100',
        valueColor: 'text-blue-700 dark:text-blue-300',
      },
      {
        label: t('dashboard.kpis.orders.label'),
        value: totalOrders.toLocaleString(intlLocale),
        icon: ShoppingCart,
        change: ordersChange,
        changeLabel: t('dashboard.kpis.changeLabel'),
        iconColor: 'text-green-600 dark:text-green-300',
        cardBg:
          'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20',
        cardBorder: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-900 dark:text-green-100',
        valueColor: 'text-green-700 dark:text-green-300',
      },
      {
        label: t('dashboard.kpis.products.label'),
        value: productsCount.toLocaleString(intlLocale),
        icon: Package,
        change: null,
        changeLabel: null,
        iconColor: 'text-purple-600 dark:text-purple-300',
        cardBg:
          'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20',
        cardBorder: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-900 dark:text-purple-100',
        valueColor: 'text-purple-700 dark:text-purple-300',
      },
      {
        label: t('dashboard.kpis.team.label'),
        value: usersCount.toLocaleString(intlLocale),
        icon: UserCheck,
        change: null,
        changeLabel: null,
        iconColor: 'text-orange-600 dark:text-orange-300',
        cardBg:
          'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20',
        cardBorder: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-900 dark:text-orange-100',
        valueColor: 'text-orange-700 dark:text-orange-300',
      },
    ];
  }, [totalRevenue, totalOrders, productsCount, usersCount, intlLocale, t]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='min-h-screen bg-gray-50/50 dark:bg-gray-950'
    >
      {/* Breadcrumb et Actions */}
      <div className='z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-3'>
          <div className='flex flex-row items-center justify-between gap-4'>
            {/* Breadcrumb */}
            <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium'>Bars</span>
              <ChevronDown className='h-4 w-4 -rotate-90' />
              <span className='text-gray-900 dark:text-white font-semibold'>
                {t('dashboard.breadcrumb.current')}
              </span>
            </div>

            {/* Filtres */}
            <div className='flex flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 shrink-0 text-muted-foreground' />
                <select
                  value={String(periodMonths)}
                  onChange={(e) => setPeriodMonths(Number(e.target.value))}
                  className='h-8 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                >
                  <option value='3'>{t('dashboard.filters.period.3')}</option>
                  <option value='6'>{t('dashboard.filters.period.6')}</option>
                  <option value='12'>{t('dashboard.filters.period.12')}</option>
                </select>
              </div>
              <select
                value={timeRange}
                onChange={(e) =>
                  setTimeRange(
                    e.target.value as 'TODAY' | 'WEEK' | 'MONTH' | 'ALL'
                  )
                }
                className='h-8 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              >
                <option value='TODAY'>
                  {t('dashboard.filters.range.today')}
                </option>
                <option value='WEEK'>
                  {t('dashboard.filters.range.week')}
                </option>
                <option value='MONTH'>
                  {t('dashboard.filters.range.month')}
                </option>
                <option value='ALL'>{t('dashboard.filters.range.all')}</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | OrderStatus)
                }
                className='h-8 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              >
                <option value='ALL'>{t('dashboard.filters.status.all')}</option>
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className='container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6'>
        {/* KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          {kpiData.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Card
                  className={`${kpi.cardBg} ${kpi.cardBorder} border shadow-sm hover:shadow-md transition-shadow`}
                >
                  <CardContent className='p-4 sm:p-5'>
                    <div className='flex items-start justify-between mb-3 sm:mb-4'>
                      <div
                        className={`p-2 sm:p-2.5 rounded-lg bg-white/50 dark:bg-gray-900/30 ${kpi.iconColor}`}
                      >
                        <Icon className='h-4 w-4 sm:h-5 sm:w-5' />
                      </div>
                      {kpi.change !== null && (
                        <div
                          className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium ${
                            kpi.change >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {kpi.change >= 0 ? (
                            <ArrowUp className='h-3 w-3' />
                          ) : (
                            <ArrowDown className='h-3 w-3' />
                          )}
                          {Math.abs(kpi.change).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div className='space-y-0.5 sm:space-y-1'>
                      <p
                        className={`text-xs sm:text-sm font-medium ${kpi.textColor}`}
                      >
                        {kpi.label}
                      </p>
                      <p
                        className={`text-xl sm:text-2xl font-bold ${kpi.valueColor}`}
                      >
                        {kpi.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Graphiques */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Graphique Revenus */}
          <Card className='bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/50 border shadow-sm'>
            <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4'>
              <CardTitle className='text-lg font-semibold text-blue-900 dark:text-blue-100'>
                {t('dashboard.charts.revenue.title')}
              </CardTitle>
              <div className='text-xs text-blue-700 dark:text-blue-300'>
                {t('dashboard.charts.lastMonths').replace(
                  '{n}',
                  String(periodMonths)
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='h-[200px] sm:h-[240px]'>
                <svg viewBox='0 0 400 200' className='w-full h-full'>
                  <defs>
                    <linearGradient
                      id='revGradient'
                      x1='0'
                      x2='0'
                      y1='0'
                      y2='1'
                    >
                      <stop offset='0%' stopColor='#2563eb' stopOpacity='0.4' />
                      <stop offset='100%' stopColor='#2563eb' stopOpacity='0' />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const max = Math.max(...revenueByMonth, 1);
                    const stepX = 400 / (revenueByMonth.length - 1 || 1);
                    const points = revenueByMonth.map((v, idx) => {
                      const x = idx * stepX;
                      const y = 180 - (v / max) * 160;
                      return `${x},${y}`;
                    });
                    const path = `M ${points[0] || '0,180'} L ${points.join(
                      ' '
                    )}`;
                    const area = `${path} L 400,180 L 0,180 Z`;
                    return (
                      <>
                        <path d={area} fill='url(#revGradient)' />
                        <path
                          d={path}
                          fill='none'
                          stroke='#2563eb'
                          strokeWidth='2.5'
                          strokeLinecap='round'
                        />
                        {revenueByMonth.map((v, idx) => {
                          const x = idx * stepX;
                          const y = 180 - (v / max) * 160;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r='4'
                              fill='#2563eb'
                              className='hover:r-6 transition-all'
                            />
                          );
                        })}
                        {months.map((m, idx) => (
                          <text
                            key={m.key}
                            x={idx * stepX}
                            y={195}
                            fontSize='11'
                            fill='#6b7280'
                            textAnchor='middle'
                          >
                            {m.label}
                          </text>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Graphique Commandes */}
          <Card className='bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/50 border shadow-sm'>
            <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4'>
              <CardTitle className='text-lg font-semibold text-green-900 dark:text-green-100'>
                {t('dashboard.charts.orders.title')}
              </CardTitle>
              <div className='text-xs text-green-700 dark:text-green-300'>
                {t('dashboard.charts.lastMonths').replace(
                  '{n}',
                  String(periodMonths)
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='h-[200px] sm:h-[240px] flex items-end justify-center gap-3 sm:gap-4 px-4'>
                {(() => {
                  const max = Math.max(...ordersByMonth, 1);
                  return ordersByMonth.map((v, idx) => {
                    const h = Math.max(8, Math.round((v / max) * 180));
                    return (
                      <div
                        key={idx}
                        className='flex flex-col items-center gap-2 flex-1 group'
                      >
                        <div
                          className='w-full bg-gradient-to-t from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-600 dark:hover:from-green-600 dark:hover:to-green-500 cursor-pointer relative group-hover:scale-105 shadow-sm'
                          style={{ height: h }}
                        >
                          <div className='absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap'>
                            {v}
                          </div>
                        </div>
                        <div className='text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium'>
                          {months[idx]?.label}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table des Commandes */}
        <Card className='border-0 shadow-sm'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 px-4 sm:px-6'>
            <div className='space-y-0.5 sm:space-y-1'>
              <CardTitle className='text-base sm:text-lg font-semibold'>
                {t('dashboard.table.title')}
              </CardTitle>
              <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                {t('dashboard.table.subtitle')}
              </p>
            </div>
            <div className='flex items-center gap-1.5 sm:gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='gap-1.5 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3'
              >
                <Download className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>
                  {t('dashboard.table.actions.import')}
                </span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='gap-1.5 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3'
              >
                <Filter className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>
                  {t('dashboard.table.actions.filter')}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <Table>
                <TableHeader>
                  <TableRow className='border-b border-gray-200 dark:border-gray-800'>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6'>
                      {t('dashboard.table.headers.id')}
                    </TableHead>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6 hidden sm:table-cell'>
                      {t('dashboard.table.headers.table')}
                    </TableHead>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6'>
                      {t('dashboard.table.headers.date')}
                    </TableHead>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6'>
                      {t('dashboard.table.headers.amount')}
                    </TableHead>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6 hidden md:table-cell'>
                      {t('dashboard.table.headers.payment')}
                    </TableHead>
                    <TableHead className='font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6'>
                      {t('dashboard.table.headers.status')}
                    </TableHead>
                    <TableHead className='text-right font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-3 sm:px-6'>
                      {t('dashboard.table.headers.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow
                        key={`skeleton-${i}`}
                        className='border-b border-gray-100 dark:border-gray-800/50'
                      >
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse' />
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-16' />
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-24' />
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-20' />
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-16' />
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-20' />
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-24 ml-auto' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-12'>
                        <div className='flex flex-col items-center justify-center gap-3'>
                          <div className='p-4 rounded-full bg-gray-100 dark:bg-gray-800'>
                            <ShoppingCart className='h-8 w-8 text-gray-400' />
                          </div>
                          <p className='text-sm font-medium text-gray-900 dark:text-white'>
                            {t('dashboard.table.empty.title')}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {t('dashboard.table.empty.subtitle')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        className='border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors'
                      >
                        <TableCell className='font-medium text-gray-900 dark:text-white text-xs sm:text-sm px-3 sm:px-6'>
                          #{shortId(o.id)}
                        </TableCell>
                        <TableCell className='text-gray-600 dark:text-gray-400 text-xs sm:text-sm px-3 sm:px-6 hidden sm:table-cell'>
                          {tables[o.tableId] || o.tableId}
                        </TableCell>
                        <TableCell className='text-gray-600 dark:text-gray-400 text-xs sm:text-sm px-3 sm:px-6'>
                          {(o.createdAt instanceof Date
                            ? o.createdAt
                            : new Date(o.createdAt)
                          ).toLocaleString(intlLocale, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className='font-semibold text-gray-900 dark:text-white text-xs sm:text-sm px-3 sm:px-6'>
                          {new Intl.NumberFormat(intlLocale, {
                            style: 'currency',
                            currency: 'XOF',
                            maximumFractionDigits: 0,
                          }).format(o.totalAmount || 0)}
                        </TableCell>
                        <TableCell className='px-3 sm:px-6 hidden md:table-cell'>
                          <Badge className='bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800 text-[10px] sm:text-xs px-2 py-0.5'>
                            {t('dashboard.table.badge.online')}
                          </Badge>
                        </TableCell>
                        <TableCell className='px-3 sm:px-6'>
                          <div className='flex items-center gap-1.5 sm:gap-2'>
                            {getStatusIcon(o.status)}
                            <span
                              className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${getStatusColor(
                                o.status
                              )}`}
                            >
                              {o.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right px-3 sm:px-6'>
                          <div className='flex items-center justify-end gap-1 sm:gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              className='h-7 sm:h-8 text-[10px] sm:text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 px-1.5 sm:px-2'
                              onClick={() =>
                                updateStatus(o.id, OrderStatus.CANCELLED)
                              }
                            >
                              <span className='hidden sm:inline'>
                                {t('dashboard.table.actions.reject')}
                              </span>
                              <span className='sm:hidden'>✕</span>
                            </Button>
                            <Button
                              size='sm'
                              className='h-7 sm:h-8 text-[10px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white px-1.5 sm:px-2 md:px-3'
                              onClick={() =>
                                updateStatus(o.id, OrderStatus.PAID)
                              }
                            >
                              <span className='hidden sm:inline'>
                                {t('dashboard.table.actions.accept')}
                              </span>
                              <span className='sm:hidden'>✓</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.main>
  );
}

export default withAppLayout(DashboardPage, {
  requireAuth: true,
  showLoading: true,
});
