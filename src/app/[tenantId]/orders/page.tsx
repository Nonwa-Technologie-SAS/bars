'use client';

import {
  withAppLayout,
  type AppLayoutContext,
} from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
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
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Hash,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  Search,
  ShoppingCart,
  Table as TableIcon,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';

type OrdersResponse = Order[] | { data?: Order[]; orders?: Order[] };

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  createdAt: Date | string;
  product?: {
    name: string;
    imageUrl?: string;
    category?: string;
  };
}

interface OrderDetailResponse {
  order?: Order;
  items?: OrderItem[];
  table?: {
    label?: string;
  };
}

interface OrdersPageProps {
  layout: AppLayoutContext;
}

const createFormatCurrency = (locale: string) => (amount: number) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const createFormatDateTime = (locale: string) => (value: string | Date) => {
  const dateObj = value instanceof Date ? value : new Date(value);
  return dateObj.toLocaleString(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const shortId = (value?: string) => {
  if (!value) return '';
  return value.length > 8 ? `${value.slice(0, 8)}…` : value;
};

const createGetStatusConfig =
  (t: (key: string) => string) => (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return {
          variant: 'warning' as const,
          label: t('orders.status.pendingPayment'),
          icon: AlertCircle,
          class:
            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        };
      case OrderStatus.PAID:
        return {
          variant: 'success' as const,
          label: t('orders.status.paid'),
          icon: CheckCircle2,
          class:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        };
      case OrderStatus.PREPARING:
        return {
          variant: 'secondary' as const,
          label: t('orders.status.preparing'),
          icon: Clock,
          class:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        };
      case OrderStatus.READY:
        return {
          variant: 'default' as const,
          label: t('orders.status.ready'),
          icon: CheckCircle2,
          class:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        };
      case OrderStatus.DELIVERED:
        return {
          variant: 'success' as const,
          label: t('orders.status.delivered'),
          icon: CheckCircle2,
          class:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        };
      case OrderStatus.CANCELLED:
        return {
          variant: 'destructive' as const,
          label: t('orders.status.cancelled'),
          icon: XCircle,
          class:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        };
      default:
        return {
          variant: 'secondary' as const,
          label: status,
          icon: Clock,
          class:
            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        };
    }
  };

const createAllStatuses = (
  t: (key: string) => string
): Array<{ label: string; value?: OrderStatus }> => [
  { label: t('orders.list.filter.all'), value: undefined },
  {
    label: t('orders.list.filter.pendingPayment'),
    value: OrderStatus.PENDING_PAYMENT,
  },
  { label: t('orders.list.filter.paid'), value: OrderStatus.PAID },
  { label: t('orders.list.filter.preparing'), value: OrderStatus.PREPARING },
  { label: t('orders.list.filter.ready'), value: OrderStatus.READY },
  { label: t('orders.list.filter.delivered'), value: OrderStatus.DELIVERED },
  { label: t('orders.list.filter.cancelled'), value: OrderStatus.CANCELLED },
];

const PAGE_SIZE = 10;

const OrdersPage: React.FC<OrdersPageProps> = ({ layout }) => {
  const { tenant, tenantId } = layout;
  const { t, locale } = useI18n();
  const intlLocale =
    locale === 'fr'
      ? 'fr-FR'
      : locale === 'lb' || locale === 'ar'
      ? 'ar'
      : locale === 'zh'
      ? 'zh-CN'
      : 'en-US';
  const formatCurrency = useMemo(
    () => createFormatCurrency(intlLocale),
    [intlLocale]
  );
  const formatDateTime = useMemo(
    () => createFormatDateTime(intlLocale),
    [intlLocale]
  );
  const getStatusConfig = useMemo(() => createGetStatusConfig(t), [t]);
  const ALL_STATUSES = useMemo(() => createAllStatuses(t), [t]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailTableLabel, setDetailTableLabel] = useState<string>('');
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    if (!tenantId) return;
    const controller = new AbortController();
    setLoading(true);
    const url = new URL(`/api/${tenantId}/orders`, window.location.origin);
    if (statusFilter) url.searchParams.set('status', statusFilter);
    fetch(url.toString(), { signal: controller.signal })
      .then((res) => res.json())
      .then((data: OrdersResponse) => {
        const list = Array.isArray(data)
          ? data
          : data.data || data.orders || [];
        const normalized = list.map((o) => ({
          ...o,
          createdAt:
            o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt),
          updatedAt:
            o.updatedAt instanceof Date ? o.updatedAt : new Date(o.updatedAt),
        })) as Order[];
        const sorted = normalized.sort((a, b) => {
          const dateA =
            a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB =
            b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        setOrders(sorted);
        setPage(1);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch orders', err);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [tenantId, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const id = o.id?.toLowerCase() || '';
      const tableId = o.tableId?.toLowerCase() || '';
      return id.includes(q) || tableId.includes(q);
    });
  }, [orders, search]);

  const newOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === OrderStatus.PENDING_PAYMENT ||
        o.status === OrderStatus.PAID
    );
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const openDetail = async (orderId: string) => {
    if (!tenantId) return;
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/${tenantId}/orders/${orderId}`);
      const json = (await res.json()) as OrderDetailResponse;
      const order = json?.order;
      const items = json?.items || [];
      const table = json?.table;
      if (order) {
        setDetailOrder({
          ...order,
          createdAt:
            order.createdAt instanceof Date
              ? order.createdAt
              : new Date(order.createdAt),
          updatedAt:
            order.updatedAt instanceof Date
              ? order.updatedAt
              : new Date(order.updatedAt),
        });
        setDetailItems(
          items.map((it) => ({
            ...it,
            createdAt:
              it.createdAt instanceof Date
                ? it.createdAt
                : new Date(it.createdAt),
          }))
        );
        setDetailTableLabel(table?.label || order.tableId);
      }
    } catch (e) {
      console.error('Failed to fetch order detail', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (orderId: string, next: OrderStatus) => {
    if (!tenantId) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/${tenantId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { order?: Order; error?: string };
      const updated = json?.order;
      if (updated) {
        setOrders((prev) => {
          const nextList = prev
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
            });
          if (statusFilter && next !== statusFilter) {
            return nextList.filter((o) => o.status === statusFilter);
          }
          return nextList;
        });
      }
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'
    >
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white'>
            {t('orders.title')}
          </h1>
          <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1'>
            {t('orders.subtitle').replace(
              '{name}',
              tenant?.name || tenant?.id || tenantId
            )}
          </p>
        </div>
      </div>

      {/* New Orders Alert */}
      <AnimatePresence>
        {newOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='space-y-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 p-4 sm:p-6 border border-blue-100 dark:border-blue-900/20'
          >
            <div className='flex items-center gap-2'>
              <div className='relative flex h-3 w-3'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-3 w-3 bg-blue-600'></span>
              </div>
              <h2 className='text-lg sm:text-xl font-semibold tracking-tight text-blue-900 dark:text-blue-200'>
                {t('orders.newOrders.title').replace(
                  '{count}',
                  newOrders.length.toString()
                )}
              </h2>
            </div>
            <div className='flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory'>
              {newOrders.map((o, idx) => {
                const status = getStatusConfig(o.status);
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className='min-w-[280px] sm:min-w-[320px] flex-none snap-start border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all'>
                      <CardContent className='p-4 sm:p-5 space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div className='font-bold text-base sm:text-lg'>
                            #{shortId(o.id)}
                          </div>
                          <Badge
                            variant='secondary'
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 ${status.class}`}
                          >
                            <StatusIcon className='h-3 w-3' />
                            {status.label}
                          </Badge>
                        </div>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div className='space-y-1'>
                            <p className='text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider'>
                              {t('orders.newOrders.table')}
                            </p>
                            <p className='font-semibold text-base text-gray-900 dark:text-white'>
                              {shortId(o.tableId)}
                            </p>
                          </div>
                          <div className='space-y-1 text-right'>
                            <p className='text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider'>
                              {t('orders.newOrders.amount')}
                            </p>
                            <p className='font-bold text-base text-blue-600 dark:text-blue-400'>
                              {formatCurrency(o.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                          <span>{t('orders.newOrders.receivedAt')}</span>
                          <span className='font-medium text-gray-900 dark:text-white'>
                            {formatDateTime(o.createdAt)}
                          </span>
                        </div>
                        <div className='flex items-center justify-between pt-2 gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='flex-1'
                            onClick={() => openDetail(o.id)}
                          >
                            <Eye className='size-4 mr-2' />
                            {t('orders.newOrders.detail')}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='px-3'
                                disabled={updatingId === o.id}
                              >
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuLabel>
                                {t('orders.newOrders.changeStatus')}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {Object.values(OrderStatus).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => updateStatus(o.id, s)}
                                >
                                  {getStatusConfig(s).label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orders Card */}
      <Card className='border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800'>
        <CardHeader className='p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg'>
              <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <CardTitle className='text-base sm:text-lg md:text-xl font-semibold'>
              {t('orders.list.title')}
            </CardTitle>
            <Badge variant='secondary' className='text-xs px-2 py-0.5'>
              {filtered.length}
            </Badge>
          </div>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-56 md:w-64 min-w-[180px] sm:min-w-[200px]'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                type='search'
                placeholder={t('orders.list.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9 sm:h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm'
              />
            </div>
            <div className='hidden sm:flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewMode('table')}
                aria-label={t('orders.list.view.tableAria')}
              >
                <TableIcon className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewMode('grid')}
                aria-label={t('orders.list.view.gridAria')}
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 items-center gap-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm'
                >
                  <ListFilter className='h-3.5 w-3.5' />
                  <span className='hidden sm:inline'>
                    {ALL_STATUSES.find((s) => s.value === statusFilter)
                      ?.label || t('orders.list.filter.all')}
                  </span>
                  <span className='sm:hidden'>
                    {t('orders.list.filter.short')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>
                  {t('orders.list.filter.label')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.label}
                    onClick={() => setStatusFilter(s.value)}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {viewMode === 'table' ? (
            <>
              {/* Desktop/Tablet Table View */}
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader className='bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10'>
                    <TableRow className='hover:bg-transparent border-b border-gray-200 dark:border-gray-700'>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('orders.table.headers.order')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('orders.table.headers.status')}
                      </TableHead>
                      <TableHead className='min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('orders.table.headers.table')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('orders.table.headers.amount')}
                      </TableHead>
                      <TableHead className='min-w-[140px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('orders.table.headers.createdAt')}
                      </TableHead>
                      <TableHead className='w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('orders.table.headers.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`s-${i}`}>
                          <TableCell>
                            <Skeleton className='h-4 w-40' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-5 w-24' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-20' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-24' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-32' />
                          </TableCell>
                          <TableCell className='text-right'>
                            <Skeleton className='h-8 w-20 ml-auto' />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginated.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='h-32 text-center text-gray-500 py-8'
                        >
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <ShoppingCart className='h-8 w-8 text-gray-400' />
                            <p className='text-sm'>{t('orders.table.empty')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((o) => {
                        const status = getStatusConfig(o.status);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow
                            key={o.id}
                            className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50'
                          >
                            <TableCell className='py-3'>
                              <div className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                #{shortId(o.id)}
                              </div>
                            </TableCell>
                            <TableCell className='py-3'>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit ${status.class}`}
                              >
                                <StatusIcon className='h-3 w-3' />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='py-3 text-gray-600 dark:text-gray-300 text-sm'>
                              {shortId(o.tableId)}
                            </TableCell>
                            <TableCell className='py-3 text-right'>
                              <span className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                {formatCurrency(o.totalAmount)}
                              </span>
                            </TableCell>
                            <TableCell className='py-3 text-gray-600 dark:text-gray-300 text-sm'>
                              {formatDateTime(o.createdAt)}
                            </TableCell>
                            <TableCell className='py-3 text-right'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size='sm'
                                    variant='ghost'
                                    className='h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                    disabled={updatingId === o.id}
                                  >
                                    <MoreHorizontal className='size-4' />
                                    <span className='sr-only'>
                                      {t('orders.actions.title')}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>
                                    {t('orders.actions.detail')}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDetail(o.id)}
                                  >
                                    <Eye className='mr-2 h-4 w-4' />
                                    {t('orders.actions.viewDetail')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>
                                    {t('orders.actions.changeStatus')}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {Object.values(OrderStatus).map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => updateStatus(o.id, s)}
                                    >
                                      {getStatusConfig(s).label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Compact Card View */}
              <div className='md:hidden space-y-3 p-3 sm:p-4'>
                {loading ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={`s-${i}`} className='p-4'>
                        <Skeleton className='h-24 w-full' />
                      </Card>
                    ))}
                  </div>
                ) : paginated.length === 0 ? (
                  <div className='text-center text-gray-500 py-12'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <ShoppingCart className='h-8 w-8 text-gray-400' />
                      <p className='text-sm'>{t('orders.table.empty')}</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {paginated.map((o, idx) => {
                      const status = getStatusConfig(o.status);
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={o.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98]'>
                            <CardContent className='p-4'>
                              <div className='flex items-start justify-between gap-3 mb-3'>
                                <div className='flex-1 min-w-0'>
                                  <h3 className='font-semibold text-base text-gray-900 dark:text-white mb-1'>
                                    #{shortId(o.id)}
                                  </h3>
                                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {t('orders.mobile.table')}{' '}
                                    {shortId(o.tableId)}
                                  </p>
                                </div>
                                <Badge
                                  variant='secondary'
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 ${status.class}`}
                                >
                                  <StatusIcon className='h-3 w-3' />
                                  {status.label}
                                </Badge>
                              </div>

                              <div className='grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800'>
                                <div>
                                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                    {t('orders.mobile.amount')}
                                  </p>
                                  <p className='font-bold text-base text-blue-600 dark:text-blue-400'>
                                    {formatCurrency(o.totalAmount)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                    {t('orders.mobile.date')}
                                  </p>
                                  <p className='text-xs text-gray-900 dark:text-gray-200 font-medium'>
                                    {formatDateTime(o.createdAt)}
                                  </p>
                                </div>
                              </div>

                              <div className='flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 mt-3'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='flex-1'
                                  onClick={() => openDetail(o.id)}
                                >
                                  <Eye className='size-4 mr-2' />
                                  {t('orders.mobile.detail')}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      className='px-2'
                                      disabled={updatingId === o.id}
                                    >
                                      <MoreHorizontal className='size-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align='end'
                                    className='w-48'
                                  >
                                    <DropdownMenuLabel>
                                      {t('orders.actions.changeStatus')}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {Object.values(OrderStatus).map((s) => (
                                      <DropdownMenuItem
                                        key={s}
                                        onClick={() => updateStatus(o.id, s)}
                                      >
                                        {getStatusConfig(s).label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </>
          ) : (
            /* Grid View */
            <div className='p-3 sm:p-4 md:p-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={`sg-${i}`} className='p-4'>
                    <Skeleton className='h-40 w-full' />
                  </Card>
                ))
              ) : paginated.length === 0 ? (
                <div className='col-span-full text-center text-gray-500 py-12'>
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <ShoppingCart className='h-8 w-8 text-gray-400' />
                    <p className='text-sm'>{t('orders.table.empty')}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {paginated.map((o, idx) => {
                    const status = getStatusConfig(o.status);
                    const StatusIcon = status.icon;
                    return (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ y: -2 }}
                      >
                        <Card className='h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all'>
                          <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between gap-2'>
                              <div className='flex items-center gap-2'>
                                <div className='h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
                                  <Hash className='h-4 w-4' />
                                </div>
                                <div>
                                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                                    {t('orders.grid.order')}
                                  </div>
                                  <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                                    #{shortId(o.id)}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 ${status.class}`}
                              >
                                <StatusIcon className='h-3 w-3' />
                                {status.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-3 text-sm'>
                              <div className='rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3'>
                                <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1'>
                                  <TableIcon className='h-3.5 w-3.5' />
                                  {t('orders.grid.table')}
                                </div>
                                <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                                  {shortId(o.tableId)}
                                </div>
                              </div>
                              <div className='rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3'>
                                <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1'>
                                  <Calendar className='h-3.5 w-3.5' />
                                  {t('orders.grid.date')}
                                </div>
                                <div className='text-xs font-semibold text-gray-900 dark:text-white truncate'>
                                  {formatDateTime(o.createdAt)}
                                </div>
                              </div>
                            </div>

                            <div className='flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/20 p-3'>
                              <div className='text-xs text-gray-500 dark:text-gray-400'>
                                {t('orders.grid.total')}
                              </div>
                              <div className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                                {formatCurrency(o.totalAmount)}
                              </div>
                            </div>

                            <div className='flex items-center gap-2 pt-1'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='flex-1'
                                onClick={() => openDetail(o.id)}
                              >
                                <Eye className='size-4 mr-2' />
                                {t('orders.grid.detail')}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size='sm'
                                    variant='ghost'
                                    className='px-2'
                                    disabled={updatingId === o.id}
                                  >
                                    <MoreHorizontal className='size-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>
                                    {t('orders.actions.changeStatus')}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {Object.values(OrderStatus).map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => updateStatus(o.id, s)}
                                    >
                                      {getStatusConfig(s).label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          )}

          {!loading && filtered.length > PAGE_SIZE && (
            <div className='p-4 border-t border-gray-100 dark:border-gray-800'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href='#'
                        isActive={page === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side='right'
          className='sm:max-w-lg p-0 flex flex-col h-full overflow-hidden'
        >
          {detailLoading ? (
            <>
              <SheetTitle className='sr-only'>
                {t('orders.detail.loading.title')}
              </SheetTitle>
              <SheetDescription
                id='order-detail-description'
                className='sr-only'
              >
                {t('orders.detail.loading.description')}
              </SheetDescription>
              <div className='flex-1 p-6 space-y-6'>
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-14 w-14 rounded-2xl' />
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                  <Skeleton className='h-8 w-24 rounded-full' />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <Skeleton className='h-20 rounded-xl' />
                  <Skeleton className='h-20 rounded-xl' />
                </div>
                <Skeleton className='h-6 w-32' />
                <div className='space-y-3'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='flex items-center gap-3'>
                      <Skeleton className='h-16 w-16 rounded-xl' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-40' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                      <Skeleton className='h-5 w-20' />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : detailOrder ? (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='relative bg-blue-50/50 dark:bg-blue-950/10 p-6 pb-8 border-b border-gray-200 dark:border-gray-800'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-4'>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.1,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className='h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm'
                    >
                      <Hash className='h-6 w-6' />
                    </motion.div>
                    <div>
                      <SheetTitle className='text-xl font-bold text-gray-900 dark:text-white'>
                        {t('orders.detail.title').replace(
                          '{id}',
                          shortId(detailOrder.id)
                        )}
                      </SheetTitle>
                      <SheetDescription
                        id='order-detail-description'
                        className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'
                      >
                        {t('orders.detail.description')}
                      </SheetDescription>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {(() => {
                      const status = getStatusConfig(detailOrder.status);
                      const StatusIcon = status.icon;
                      return (
                        <Badge
                          variant='secondary'
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold border flex items-center gap-1.5 ${status.class}`}
                        >
                          <StatusIcon className='h-3.5 w-3.5' />
                          {status.label}
                        </Badge>
                      );
                    })()}
                  </motion.div>
                </div>

                {/* Quick Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className='grid grid-cols-2 gap-3 mt-6'
                >
                  <div className='rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4'>
                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1'>
                      <TableIcon className='h-3.5 w-3.5' />
                      {t('orders.detail.table')}
                    </div>
                    <div className='text-base font-semibold text-gray-900 dark:text-white'>
                      {detailTableLabel}
                    </div>
                  </div>
                  <div className='rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4'>
                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      {t('orders.detail.dateTime')}
                    </div>
                    <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                      {formatDateTime(detailOrder.createdAt)}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Items List */}
              <div className='flex-1 overflow-y-auto px-6 py-4'>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className='flex items-center justify-between mb-4'
                >
                  <h3 className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    {t('orders.detail.items.title').replace(
                      '{count}',
                      detailItems.length.toString()
                    )}
                  </h3>
                </motion.div>

                {detailItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='flex flex-col items-center justify-center py-12 text-center'
                  >
                    <div className='h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
                      <ShoppingCart className='h-8 w-8 text-gray-400' />
                    </div>
                    <p className='text-gray-500 dark:text-gray-400'>
                      {t('orders.detail.items.empty')}
                    </p>
                  </motion.div>
                ) : (
                  <div className='space-y-3'>
                    <AnimatePresence>
                      {detailItems.map((it, index) => {
                        const lineTotal = it.unitPrice * it.quantity;
                        return (
                          <motion.div
                            key={it.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                              delay: 0.35 + index * 0.05,
                              duration: 0.2,
                            }}
                            whileHover={{ scale: 1.01 }}
                            className='group flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer'
                          >
                            <div className='relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0'>
                              {it.product?.imageUrl ? (
                                <Image
                                  src={it.product.imageUrl}
                                  alt={it.product.name}
                                  fill
                                  className='object-cover group-hover:scale-105 transition-transform duration-300'
                                  sizes='64px'
                                />
                              ) : (
                                <div className='h-full w-full flex items-center justify-center text-gray-400'>
                                  <Hash className='h-6 w-6' />
                                </div>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-semibold text-sm text-gray-900 dark:text-white truncate'>
                                {it.product?.name || it.productId}
                              </div>
                              <div className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                {formatCurrency(it.unitPrice)} × {it.quantity}
                              </div>
                              {it.product?.category && (
                                <div className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                                  {it.product.category}
                                </div>
                              )}
                            </div>
                            <div className='text-right shrink-0'>
                              <div className='text-sm font-bold text-gray-900 dark:text-white'>
                                {formatCurrency(lineTotal)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6 space-y-4'
              >
                {/* Summary */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      {t('orders.detail.summary.subtotal')}
                    </span>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {formatCurrency(detailOrder.totalAmount)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      {t('orders.detail.summary.serviceFee')}
                    </span>
                    <span className='text-green-600 dark:text-green-400 font-medium'>
                      {t('orders.detail.summary.serviceFeeFree')}
                    </span>
                  </div>
                  <div className='h-px bg-gray-200 dark:bg-gray-800 my-2' />
                  <div className='flex items-center justify-between'>
                    <span className='text-base font-semibold text-gray-900 dark:text-white'>
                      {t('orders.detail.summary.total')}
                    </span>
                    <span className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                      {formatCurrency(detailOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-3'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        className='flex-1'
                        disabled={updatingId === detailOrder.id}
                      >
                        {t('orders.detail.actions.changeStatus')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='center' className='w-56'>
                      <DropdownMenuLabel>
                        {t('orders.detail.actions.newStatus')}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.values(OrderStatus).map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => {
                            updateStatus(detailOrder.id, s);
                            setDetailOpen(false);
                          }}
                          className='cursor-pointer'
                        >
                          {getStatusConfig(s).label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant='default'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    onClick={() => setDetailOpen(false)}
                  >
                    {t('orders.detail.actions.close')}
                  </Button>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <SheetTitle className='sr-only'>
                {t('orders.detail.empty.title')}
              </SheetTitle>
              <SheetDescription
                id='order-detail-description'
                className='sr-only'
              >
                {t('orders.detail.empty.description')}
              </SheetDescription>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default withAppLayout(OrdersPage, {
  requireAuth: true,
  showLoading: true,
});
