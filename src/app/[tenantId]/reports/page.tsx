'use client';

import type { AppLayoutContext } from '@/components/hoc/withAppLayout';
import { withAppLayout } from '@/components/hoc/withAppLayout';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Label } from '@/components/ui/label';
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
  BarChart3,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  ListFilter,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

interface ReportItem {
  productId: string;
  name: string;
  category?: string | null;
  unitPrice?: number | null;
  soldQty: number;
  revenue: number;
  stockRemaining: number;
}

interface ReportResponse {
  items: ReportItem[];
  totals: {
    totalRevenue: number;
    totalItemsSold: number;
    productCount: number;
    from: string | Date;
    to: string | Date;
    period: Period;
  };
}

interface ReportRow {
  id: string;
  title: string;
  createdAt: Date;
  period: Period;
  startDate?: string;
  endDate?: string;
  data: ReportResponse;
}

const createFormatCurrency = (locale: string) => (amount: number) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const createFormatDate = (locale: string) => (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(locale, { dateStyle: 'medium' });
};

interface ReportsPageProps {
  layout: AppLayoutContext;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ layout }) => {
  const { tenantId } = layout;
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
  const formatDate = useMemo(() => createFormatDate(intlLocale), [intlLocale]);

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [advFilterOpen, setAdvFilterOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<Period | 'all'>('all');
  const [minRevenue, setMinRevenue] = useState<string>('');

  const [period, setPeriod] = useState<Period>('day');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const getPeriodLabel = (p: Period): string => t(`reports.period.${p}`) || p;

  const fetchReports = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/${tenantId}/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(
          data.map((r: ReportRow & { createdAt?: string }) => ({
            ...r,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          }))
        );
      }
    } catch (e) {
      console.error('Error fetching reports', e);
      toast.error(t('reports.load.error'));
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, t]);

  const getShareText = (data: ReportResponse) => {
    const range = data?.totals
      ? `${formatDate(data.totals.from)} → ${formatDate(data.totals.to)}`
      : '';
    const total = formatCurrency(data?.totals?.totalRevenue ?? 0);
    const qty = data?.totals?.totalItemsSold ?? 0;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const summaryTemplate = t('reports.share.text');
    return summaryTemplate
      .replace('{range}', range)
      .replace('{total}', total)
      .replace('{qty}', String(qty))
      .replace('{url}', `${baseUrl}/${tenantId}/reports/detail`);
  };

  const handleEmail = (id: string, data: ReportResponse) => {
    const subject = t('reports.share.emailSubject');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const summary = getShareText(data);
    const bodyTemplate = t('reports.share.emailBody');
    const body = bodyTemplate
      .replace('{summary}', summary)
      .replace('{url}', `${baseUrl}/${tenantId}/reports/detail?id=${id}`);
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsApp = (id: string, data: ReportResponse) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const summary = getShareText(data);
    const textTemplate = t('reports.share.whatsappText');
    const text = textTemplate
      .replace('{summary}', summary)
      .replace('{url}', `${baseUrl}/${tenantId}/reports/detail?id=${id}`);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenantId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, from, to }),
      });

      if (res.ok) {
        const newReport = await res.json();
        setDialogOpen(false);
        fetchReports();
        router.push(`/${tenantId}/reports/detail?id=${newReport.id}`);
        toast.success('Rapport généré');
      } else {
        toast.error('Échec de la génération du rapport');
      }
    } catch (error) {
      console.error('Failed to generate report', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = r.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPeriod = filterPeriod === 'all' || r.period === filterPeriod;
      const matchesRevenue =
        !minRevenue || r.data.totals.totalRevenue >= parseFloat(minRevenue);
      return matchesSearch && matchesPeriod && matchesRevenue;
    });
  }, [reports, search, filterPeriod, minRevenue]);

  return (
    <div className='container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
      >
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'>
            <BarChart3 className='h-5 w-5 sm:h-6 sm:w-6' />
          </div>
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white'>
              {t('reports.title')}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {t('reports.subtitle')}
            </p>
          </div>
        </div>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2'>
              <FileText className='h-4 w-4' />
              {t('reports.generate.button')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className='sm:max-w-md'>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('reports.generate.dialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('reports.generate.dialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
                <Label htmlFor='period' className='sm:text-right'>
                  {t('reports.generate.period.label')}
                </Label>
                <select
                  id='period'
                  className='sm:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                >
                  <option value='day'>
                    {t('reports.generate.periodOption.day')}
                  </option>
                  <option value='week'>
                    {t('reports.generate.periodOption.week')}
                  </option>
                  <option value='month'>
                    {t('reports.generate.periodOption.month')}
                  </option>
                  <option value='year'>
                    {t('reports.generate.periodOption.year')}
                  </option>
                  <option value='custom'>
                    {t('reports.generate.periodOption.custom')}
                  </option>
                </select>
              </div>
              {period === 'custom' && (
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
                    <Label htmlFor='from' className='sm:text-right'>
                      {t('reports.generate.fromLabel')}
                    </Label>
                    <Input
                      id='from'
                      type='date'
                      className='sm:col-span-3 focus-visible:ring-blue-600'
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-4 items-center gap-4'>
                    <Label htmlFor='to' className='sm:text-right'>
                      {t('reports.generate.toLabel')}
                    </Label>
                    <Input
                      id='to'
                      type='date'
                      className='sm:col-span-3 focus-visible:ring-blue-600'
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('users.sheet.actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  {loading
                    ? t('reports.generate.submitting')
                    : t('reports.generate.submit')}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      <Card className='border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800'>
        <CardHeader className='p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800'>
          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-56 md:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                placeholder={t('reports.list.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9 sm:h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-600'
              />
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setAdvFilterOpen(!advFilterOpen)}
              className={`h-9 w-9 shrink-0 ${
                advFilterOpen
                  ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <ListFilter className='h-4 w-4' />
            </Button>
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
              aria-label={t('reports.list.view.tableAria')}
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
              aria-label={t('reports.list.view.gridAria')}
            >
              <LayoutGrid className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        {advFilterOpen && (
          <CardContent className='p-4 sm:p-6 pt-0 border-b border-gray-100 dark:border-gray-800'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='space-y-2'>
                <Label className='text-sm'>
                  {t('reports.filters.period.label')}
                </Label>
                <select
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600'
                  value={filterPeriod}
                  onChange={(e) =>
                    setFilterPeriod(e.target.value as Period | 'all')
                  }
                >
                  <option value='all'>{t('reports.filters.period.all')}</option>
                  <option value='day'>{t('reports.filters.period.day')}</option>
                  <option value='week'>
                    {t('reports.filters.period.week')}
                  </option>
                  <option value='month'>
                    {t('reports.filters.period.month')}
                  </option>
                  <option value='year'>
                    {t('reports.filters.period.year')}
                  </option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label className='text-sm'>
                  {t('reports.filters.minRevenue.label')}
                </Label>
                <Input
                  type='number'
                  placeholder={t('reports.filters.minRevenue.placeholder')}
                  value={minRevenue}
                  onChange={(e) => setMinRevenue(e.target.value)}
                  className='focus-visible:ring-blue-600'
                />
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className='p-0'>
          {viewMode === 'table' ? (
            <>
              <div className='hidden md:block overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent border-b border-gray-200 dark:border-gray-700'>
                      <TableHead className='min-w-[180px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('reports.table.headers.title')}
                      </TableHead>
                      <TableHead className='min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('reports.table.headers.period')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('reports.table.headers.createdAt')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('reports.table.headers.totalSales')}
                      </TableHead>
                      <TableHead className='w-[80px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right'>
                        {t('reports.table.headers.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='text-center py-12 text-muted-foreground'
                        >
                          <BarChart3 className='h-10 w-10 mx-auto mb-2 opacity-50' />
                          <p>{t('reports.table.empty')}</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((r) => (
                        <TableRow
                          key={r.id}
                          className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800/50'
                        >
                          <TableCell className='py-3 font-medium text-gray-900 dark:text-white'>
                            {r.title}
                          </TableCell>
                          <TableCell className='py-3'>
                            <Badge
                              variant='secondary'
                              className='rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-0'
                            >
                              {getPeriodLabel(r.period)}
                            </Badge>
                          </TableCell>
                          <TableCell className='py-3 text-gray-600 dark:text-gray-400 text-sm'>
                            {formatDate(r.createdAt)}
                          </TableCell>
                          <TableCell className='py-3 text-right font-bold text-blue-600 dark:text-blue-400'>
                            {formatCurrency(r.data.totals.totalRevenue)}
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
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuLabel>
                                  {t('reports.actions.title')}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/${tenantId}/reports/detail?id=${r.id}`
                                    )
                                  }
                                  className='cursor-pointer'
                                >
                                  <Eye className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.viewMore')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(
                                      `/${tenantId}/reports/detail?id=${r.id}`
                                    );
                                    setTimeout(() => window.print(), 1000);
                                  }}
                                  className='cursor-pointer'
                                >
                                  <Download className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.downloadPdf')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEmail(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <Mail className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.sendEmail')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleWhatsApp(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <MessageCircle className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.shareWhatsapp')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: cards */}
              <div className='md:hidden space-y-3 p-4'>
                {filteredReports.length === 0 ? (
                  <div className='text-center py-12 text-muted-foreground'>
                    <BarChart3 className='h-10 w-10 mx-auto mb-2 opacity-50' />
                    <p>{t('reports.table.empty')}</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredReports.map((r, index) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all'>
                          <CardContent className='p-4 space-y-3'>
                            <div className='flex items-start justify-between gap-2'>
                              <p className='font-semibold text-gray-900 dark:text-white truncate'>
                                {r.title}
                              </p>
                              <Badge
                                variant='secondary'
                                className='shrink-0 rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                              >
                                {getPeriodLabel(r.period)}
                              </Badge>
                            </div>
                            <p className='text-xs text-muted-foreground'>
                              {formatDate(r.createdAt)}
                            </p>
                            <p className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                              {formatCurrency(r.data.totals.totalRevenue)}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                                >
                                  {t('reports.actions.title')}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/${tenantId}/reports/detail?id=${r.id}`
                                    )
                                  }
                                  className='cursor-pointer'
                                >
                                  <Eye className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.viewMore')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEmail(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <Mail className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.sendEmail')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleWhatsApp(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <MessageCircle className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.shareWhatsapp')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          ) : (
            <div className='p-4 sm:p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredReports.length === 0 ? (
                <div className='col-span-full text-center py-12 text-muted-foreground'>
                  <BarChart3 className='h-10 w-10 mx-auto mb-2 opacity-50' />
                  <p>{t('reports.table.empty')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredReports.map((r, index) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all h-full'>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                          <CardTitle className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                            {r.title}
                          </CardTitle>
                          <Badge
                            variant='secondary'
                            className='rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-0'
                          >
                            {getPeriodLabel(r.period)}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                            {formatCurrency(r.data.totals.totalRevenue)}
                          </div>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {t('reports.grid.itemsSold').replace(
                              '{count}',
                              r.data.totals.totalItemsSold.toString()
                            )}
                          </p>
                          <div className='mt-4 flex justify-end'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                                >
                                  {t('reports.actions.title')}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/${tenantId}/reports/detail?id=${r.id}`
                                    )
                                  }
                                  className='cursor-pointer'
                                >
                                  <Eye className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.viewMore')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEmail(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <Mail className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.sendEmail')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleWhatsApp(r.id, r.data)}
                                  className='cursor-pointer'
                                >
                                  <MessageCircle className='mr-2 h-4 w-4' />{' '}
                                  {t('reports.actions.shareWhatsapp')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withAppLayout(ReportsPage, {
  requireAuth: true,
  showLoading: true,
});
