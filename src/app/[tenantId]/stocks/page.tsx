'use client';

import type { AppLayoutContext } from '@/components/hoc/withAppLayout';
import { withAppLayout } from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
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
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  Package,
  Search,
  Table as TableIcon,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity?: number;
  isAvailable?: boolean;
  category?: string;
  createdAt?: string | Date;
}

type MovementType =
  | 'RESTOCK'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'SPOILAGE'
  | 'RETURN'
  | 'INVENTORY_COUNT';

interface StockMovement {
  id: string;
  type: MovementType;
  delta: number;
  previousStock: number;
  newStock: number;
  note?: string;
  createdAt: string | Date;
}

interface StocksPageProps {
  layout: AppLayoutContext;
}

const StocksPage: React.FC<StocksPageProps> = ({ layout }) => {
  const { tenantId, tenant } = layout;
  const { t, locale } = useI18n();
  const intlLocale =
    locale === 'en'
      ? 'en-US'
      : locale === 'lb' || locale === 'ar'
      ? 'ar'
      : locale === 'zh'
      ? 'zh-CN'
      : 'fr-FR';
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockIds, setLowStockIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [actionOpen, setActionOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'adjust' | 'set'>('adjust');
  const [actionProduct, setActionProduct] = useState<Product | null>(null);
  const [delta, setDelta] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(0);
  const [movementType, setMovementType] = useState<MovementType>('RESTOCK');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<StockMovement[]>([]);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDateTime = (value: string | Date) => {
    const dateObj = value instanceof Date ? value : new Date(value);
    return dateObj.toLocaleString(intlLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const fetchProducts = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenantId}/products`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data?.data) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
      toast.error(t('stocks.load.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/${tenantId}/products/low-stock`);
      const data = await res.json();
      const list = data?.data || [];
      setLowStockIds(new Set(list.map((p: Product) => p.id)));
    } catch (e) {
      console.error('Failed to fetch low stock products', e);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchProducts();
      fetchLowStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter;
      const matchesLow = !onlyLowStock || lowStockIds.has(p.id);
      return matchesQuery && matchesCategory && matchesLow;
    });
  }, [products, search, categoryFilter, onlyLowStock, lowStockIds]);

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (p.stockQuantity ?? 0), 0),
    [products]
  );
  const lowStockCount = useMemo(() => lowStockIds.size, [lowStockIds]);
  const outOfStockCount = useMemo(
    () => products.filter((p) => (p.stockQuantity ?? 0) <= 0).length,
    [products]
  );

  const openAction = (product: Product, mode: 'adjust' | 'set') => {
    setActionProduct(product);
    setActionMode(mode);
    setDelta(1);
    setQuantity(product.stockQuantity ?? 0);
    setMovementType('RESTOCK');
    setNote('');
    setActionOpen(true);
  };

  const openHistory = async (product: Product) => {
    console.log(product);
    if (!tenantId) return;
    setHistoryProduct(product);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/${tenantId}/products/${product.id}/stock-movements?limit=20`
      );
      const data = await res.json();
      const list = data?.data || [];
      setHistoryItems(list);
    } catch (e) {
      console.error('Failed to fetch stock movements', e);
      toast.error(t('stocks.history.loadError'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitAction = async () => {
    if (!tenantId || !actionProduct) return;
    setSubmitting(true);
    try {
      if (actionMode === 'adjust') {
        if (!delta || delta === 0) {
          toast.error(t('stocks.toast.deltaRequired'));
          setSubmitting(false);
          return;
        }
        const res = await fetch(
          `/api/${tenantId}/products/${actionProduct.id}/stock-adjust`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              delta,
              type: movementType,
              note: note || undefined,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || t('stocks.toast.updateError'));
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== actionProduct.id) return p;
            const nextQty = (p.stockQuantity ?? 0) + delta;
            return { ...p, stockQuantity: nextQty, isAvailable: nextQty > 0 };
          })
        );
        toast.success(t('stocks.toast.adjustSuccess'));
      } else {
        if (quantity < 0) {
          toast.error(t('stocks.toast.quantityPositive'));
          setSubmitting(false);
          return;
        }
        const res = await fetch(
          `/api/${tenantId}/products/${actionProduct.id}/stock-set`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity,
              note: note || undefined,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || t('stocks.toast.updateError'));
        setProducts((prev) =>
          prev.map((p) =>
            p.id === actionProduct.id
              ? { ...p, stockQuantity: quantity, isAvailable: quantity > 0 }
              : p
          )
        );
        toast.success(t('stocks.toast.setSuccess'));
      }
      setActionOpen(false);
      fetchLowStock();
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : t('stocks.toast.updateError');
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (qty: number, isLow: boolean) => {
    if (qty <= 0) {
      return {
        label: t('stocks.status.break'),
        class:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        icon: XCircle,
      };
    }
    if (isLow) {
      return {
        label: t('stocks.status.low'),
        class:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'OK',
      class:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      icon: CheckCircle2,
    };
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
            {t('stocks.title')}
          </h1>
          <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1'>
            {t('stocks.subtitle').replace('{name}', tenant?.name || tenantId)}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='border-0 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400'>
                {t('stocks.stats.products')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                {products.length}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className='border-0 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400'>
                {t('stocks.stats.totalStock')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {totalStock.toLocaleString(intlLocale)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='border-0 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400'>
                {t('stocks.stats.lowStock')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400'>
                {lowStockCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className='border-0 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400'>
                {t('stocks.stats.outOfStock')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400'>
                {outOfStockCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Table Card */}
      <Card className='border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800'>
        <CardHeader className='p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg'>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <CardTitle className='text-base sm:text-lg md:text-xl font-semibold'>
              {t('stocks.title')}
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
                placeholder={t('stocks.header.searchPlaceholder')}
                className='pl-9 h-9 sm:h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                    {categoryFilter === 'all'
                      ? t('stocks.header.filter.all')
                      : categoryFilter}
                  </span>
                  <span className='sm:hidden'>
                    {t('stocks.header.filter.short')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>
                  {t('stocks.header.filter.label')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                  {t('stocks.header.filter.all')}
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='onlyLowStock'
                checked={onlyLowStock}
                onCheckedChange={(v) => setOnlyLowStock(Boolean(v))}
              />
              <label
                htmlFor='onlyLowStock'
                className='text-xs sm:text-sm text-gray-600 dark:text-gray-300 cursor-pointer'
              >
                <span className='hidden sm:inline'>
                  {t('stocks.header.lowStock.full')}
                </span>
                <span className='sm:hidden'>
                  {t('stocks.header.lowStock.short')}
                </span>
              </label>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewMode('table')}
                aria-label={t('stocks.header.view.tableAria')}
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
                aria-label={t('stocks.header.view.gridAria')}
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
            </div>
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
                      <TableHead className='min-w-[200px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('stocks.table.headers.product')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('stocks.table.headers.category')}
                      </TableHead>
                      <TableHead className='min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('stocks.table.headers.price')}
                      </TableHead>
                      <TableHead className='min-w-[90px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center'>
                        {t('stocks.table.headers.stock')}
                      </TableHead>
                      <TableHead className='min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center'>
                        {t('stocks.table.headers.status')}
                      </TableHead>
                      <TableHead className='w-[80px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('stocks.table.headers.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={`s-${i}`}>
                          <TableCell>
                            <Skeleton className='h-4 w-44' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-24' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-20' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-16' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-5 w-24' />
                          </TableCell>
                          <TableCell className='text-right'>
                            <Skeleton className='h-8 w-20 ml-auto' />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='h-32 text-center text-gray-500 py-8'
                        >
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <Package className='h-8 w-8 text-gray-400' />
                            <p className='text-sm'>{t('stocks.table.empty')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((p) => {
                        const qty = p.stockQuantity ?? 0;
                        const isLow = lowStockIds.has(p.id);
                        const status = getStatusConfig(qty, isLow);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow
                            key={p.id}
                            className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50'
                          >
                            <TableCell className='py-3'>
                              <div className='flex flex-col'>
                                <span className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                  {p.name}
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                                  {p.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='py-3 text-gray-600 dark:text-gray-300 text-sm'>
                              {p.category || t('stocks.category.uncategorized')}
                            </TableCell>
                            <TableCell className='py-3 text-right'>
                              <span className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                {formatCurrency(p.price)}
                              </span>
                            </TableCell>
                            <TableCell className='py-3 text-center'>
                              <span className='font-bold text-base sm:text-lg text-gray-900 dark:text-white'>
                                {qty}
                              </span>
                            </TableCell>
                            <TableCell className='py-3 text-center'>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit mx-auto ${status.class}`}
                              >
                                <StatusIcon className='h-3 w-3' />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='py-3 text-right'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                  >
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => openAction(p, 'adjust')}
                                  >
                                    <TrendingUp className='mr-2 h-4 w-4' />
                                    Ajuster le stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openAction(p, 'set')}
                                  >
                                    <TrendingDown className='mr-2 h-4 w-4' />
                                    Définir le stock
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openHistory(p)}
                                  >
                                    <History className='mr-2 h-4 w-4' />
                                    Historique
                                  </DropdownMenuItem>
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
                        <Skeleton className='h-20 w-full' />
                      </Card>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className='text-center text-gray-500 py-12'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Package className='h-8 w-8 text-gray-400' />
                      <p className='text-sm'>Aucun produit trouvé.</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filtered.map((p, idx) => {
                      const qty = p.stockQuantity ?? 0;
                      const isLow = lowStockIds.has(p.id);
                      const status = getStatusConfig(qty, isLow);
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98]'>
                            <CardContent className='p-4'>
                              <div className='flex items-start justify-between gap-3 mb-3'>
                                <div className='flex-1 min-w-0'>
                                  <h3 className='font-semibold text-base text-gray-900 dark:text-white truncate mb-1'>
                                    {p.name}
                                  </h3>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 font-mono mb-2'>
                                    {p.id.slice(0, 8).toUpperCase()}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {p.category || 'Non catégorisé'}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='h-8 w-8 text-gray-500 flex-shrink-0'
                                    >
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align='end'
                                    className='w-48'
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => openAction(p, 'adjust')}
                                    >
                                      <TrendingUp className='mr-2 h-4 w-4' />
                                      Ajuster le stock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openAction(p, 'set')}
                                    >
                                      <TrendingDown className='mr-2 h-4 w-4' />
                                      Définir le stock
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => openHistory(p)}
                                    >
                                      <History className='mr-2 h-4 w-4' />
                                      Historique
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className='grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800'>
                                <div>
                                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                    Prix
                                  </p>
                                  <p className='font-bold text-sm text-gray-900 dark:text-white'>
                                    {formatCurrency(p.price)}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                    Stock
                                  </p>
                                  <p className='font-bold text-base text-gray-900 dark:text-white'>
                                    {qty}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'>
                                    Statut
                                  </p>
                                  <Badge
                                    variant='secondary'
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold border flex items-center gap-1 w-fit ${status.class}`}
                                  >
                                    <StatusIcon className='h-3 w-3' />
                                    {status.label}
                                  </Badge>
                                </div>
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
                  <Card key={`s-${i}`} className='p-4'>
                    <Skeleton className='h-32 w-full' />
                  </Card>
                ))
              ) : filtered.length === 0 ? (
                <div className='col-span-full text-center text-gray-500 py-12'>
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <Package className='h-8 w-8 text-gray-400' />
                    <p className='text-sm'>Aucun produit trouvé.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {filtered.map((p, idx) => {
                    const qty = p.stockQuantity ?? 0;
                    const isLow = lowStockIds.has(p.id);
                    const status = getStatusConfig(qty, isLow);
                    const StatusIcon = status.icon;
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card className='group border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all'>
                          <CardContent className='p-4 space-y-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='flex-1 min-w-0'>
                                <h3 className='font-semibold text-base text-gray-900 dark:text-white truncate mb-1'>
                                  {p.name}
                                </h3>
                                <p className='text-xs text-gray-500 dark:text-gray-400 font-mono mb-1'>
                                  {p.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                  {p.category || 'Non catégorisé'}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-gray-500 flex-shrink-0'
                                  >
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => openAction(p, 'adjust')}
                                  >
                                    <TrendingUp className='mr-2 h-4 w-4' />
                                    Ajuster le stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openAction(p, 'set')}
                                  >
                                    <TrendingDown className='mr-2 h-4 w-4' />
                                    Définir le stock
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openHistory(p)}
                                  >
                                    <History className='mr-2 h-4 w-4' />
                                    Historique
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className='grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800'>
                              <div>
                                <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide'>
                                  Prix
                                </p>
                                <p className='font-bold text-sm text-gray-900 dark:text-white'>
                                  {formatCurrency(p.price)}
                                </p>
                              </div>
                              <div>
                                <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide'>
                                  Stock
                                </p>
                                <p className='font-bold text-lg text-blue-600 dark:text-blue-400'>
                                  {qty}
                                </p>
                              </div>
                            </div>

                            <div className='pt-2 border-t border-gray-100 dark:border-gray-800'>
                              <p className='text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide'>
                                Statut
                              </p>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border flex items-center gap-1.5 w-fit ${status.class}`}
                              >
                                <StatusIcon className='h-3 w-3' />
                                {status.label}
                              </Badge>
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
        </CardContent>
      </Card>

      {/* Action Sheet */}
      <Sheet open={actionOpen} onOpenChange={setActionOpen}>
        <SheetContent className='overflow-y-auto sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>
              {actionMode === 'adjust'
                ? 'Ajuster le stock'
                : 'Définir le stock'}
            </SheetTitle>
            <SheetDescription>
              {actionProduct
                ? `${actionProduct.name} • ${
                    actionProduct.category || 'Sans catégorie'
                  }`
                : ''}
            </SheetDescription>
          </SheetHeader>
          <div className='grid gap-6 py-6'>
            <div className='flex items-center gap-2'>
              <Button
                variant={actionMode === 'adjust' ? 'default' : 'outline'}
                className={`flex-1 ${
                  actionMode === 'adjust'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : ''
                }`}
                onClick={() => setActionMode('adjust')}
              >
                Ajuster
              </Button>
              <Button
                variant={actionMode === 'set' ? 'default' : 'outline'}
                className={`flex-1 ${
                  actionMode === 'set'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : ''
                }`}
                onClick={() => setActionMode('set')}
              >
                Définir
              </Button>
            </div>

            {actionMode === 'adjust' ? (
              <>
                <Field>
                  <FieldLabel>Variation (+/-)</FieldLabel>
                  <Input
                    type='number'
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                    className='focus-visible:ring-blue-600'
                  />
                  <FieldError errors={[]} />
                </Field>
                <Field>
                  <FieldLabel>Type de mouvement</FieldLabel>
                  <select
                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600'
                    value={movementType}
                    onChange={(e) =>
                      setMovementType(e.target.value as MovementType)
                    }
                  >
                    <option value='RESTOCK'>Réappro</option>
                    <option value='SALE'>Vente</option>
                    <option value='ADJUSTMENT'>Ajustement</option>
                    <option value='SPOILAGE'>Perte</option>
                    <option value='RETURN'>Retour</option>
                    <option value='INVENTORY_COUNT'>Inventaire</option>
                  </select>
                  <FieldError errors={[]} />
                </Field>
              </>
            ) : (
              <Field>
                <FieldLabel>Quantité totale</FieldLabel>
                <Input
                  type='number'
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={0}
                  className='focus-visible:ring-blue-600'
                />
                <FieldError errors={[]} />
              </Field>
            )}

            <Field>
              <FieldLabel>Note (optionnel)</FieldLabel>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Ex: inventaire de fin de semaine'
                className='flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600'
              />
              <FieldError errors={[]} />
            </Field>
          </div>

          <SheetFooter>
            <Button variant='outline' onClick={() => setActionOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={submitAction}
              disabled={submitting}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side='right' className='sm:max-w-lg'>
          <SheetHeader>
            <SheetTitle>Historique des mouvements</SheetTitle>
            <SheetDescription>
              {historyProduct ? historyProduct.name : 'Produit'}
            </SheetDescription>
          </SheetHeader>
          <div className='p-4 space-y-4'>
            {historyLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`m-${i}`} className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-16' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                    <Skeleton className='h-4 w-16' />
                  </div>
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div className='text-sm text-muted-foreground text-center py-8'>
                <History className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                <p>Aucun mouvement de stock</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {historyItems.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                  >
                    <Badge
                      variant='secondary'
                      className='w-20 justify-center text-xs'
                    >
                      {m.type}
                    </Badge>
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {m.delta > 0 ? `+${m.delta}` : m.delta} → {m.newStock}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatDateTime(m.createdAt)}
                      </div>
                      {m.note && (
                        <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 italic'>
                          {m.note}
                        </div>
                      )}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400 font-mono'>
                      {m.previousStock} → {m.newStock}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default withAppLayout(StocksPage, {
  requireAuth: true,
  showLoading: true,
});
