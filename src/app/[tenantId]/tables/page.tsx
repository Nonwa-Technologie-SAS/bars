'use client';

import {
  withAppLayout,
  type AppLayoutContext,
} from '@/components/hoc/withAppLayout';
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
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UITable,
} from '@/components/ui/table';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  LayoutGrid,
  ListFilter,
  Loader2,
  MoreHorizontal,
  PenIcon,
  Plus,
  QrCode,
  Search,
  Table as TableIcon,
  Trash2Icon,
  XCircle,
  XIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Table {
  id: string;
  label: string;
  qrCodeUrl: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface TablesResponse {
  data?: Table[];
  tables?: Table[];
}

interface TableFormData {
  label: string;
  qrCodeUrl?: string;
  isActive?: boolean;
}

interface TablesPageProps {
  layout: AppLayoutContext;
}

const createTableSchema = (t: (key: string) => string) =>
  z.object({
    label: z.string().min(2, t('tables.validation.labelMin')),
    qrCodeUrl: z.string().url(t('tables.validation.urlInvalid')).optional(),
    isActive: z.boolean().optional(),
  });

const TablesPage: React.FC<TablesPageProps> = ({ layout }) => {
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
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [current, setCurrent] = useState<Table | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    label: '',
    qrCodeUrl: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<
    Record<string, { message: string }>
  >({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tables_view_mode');
      if (saved === 'table' || saved === 'grid') {
        setViewMode(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setViewModePersist = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('tables_view_mode', mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const url = new URL(`/api/${tenantId}/tables`, window.location.origin);
      if (search.trim().length > 0) {
        url.searchParams.set('query', search.trim());
      }
      if (activeFilter !== 'all') {
        url.searchParams.set(
          'active',
          activeFilter === 'active' ? 'true' : 'false'
        );
      }
      fetch(url.toString(), { signal: controller.signal })
        .then((res) => res.json())
        .then((data: Table[] | TablesResponse) => {
          let tablesList: Table[] = [];
          if (Array.isArray(data)) {
            tablesList = data;
          } else if (data.data) {
            tablesList = data.data;
          } else if (data.tables) {
            tablesList = data.tables;
          }
          setTables(tablesList);
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch tables', err);
          }
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [tenantId, search, activeFilter, t]);

  const filteredTables = useMemo(() => {
    return tables;
  }, [tables]);

  const toggleSelectAll = () => {
    if (selected.length === filteredTables.length) {
      setSelected([]);
    } else {
      setSelected(filteredTables.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(intlLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (active: boolean) => {
    if (active) {
      return {
        label: t('tables.status.active'),
        icon: CheckCircle2,
        class:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      };
    }
    return {
      label: t('tables.status.inactive'),
      icon: XCircle,
      class:
        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    };
  };

  const downloadQR = async (table: Table, format: 'png' | 'svg' = 'png') => {
    try {
      setDownloadingId(table.id);
      const base = 'https://api.qrserver.com/v1/create-qr-code/';
      const params = new URLSearchParams();
      params.set('size', '600x600');
      params.set('data', table.qrCodeUrl);
      if (format === 'svg') params.set('format', 'svg');
      const url = `${base}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(t('tables.toast.downloadError'));
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qr-${table.label || table.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success(t('tables.toast.downloadSuccess'));
    } catch (e) {
      const error =
        e instanceof Error ? e : new Error(t('tables.toast.downloadFailed'));
      toast.error(error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    try {
      const partialSchema = z.object({
        label: z.string().min(2, t('tables.validation.labelMin')),
        isActive: z.boolean().optional(),
      });

      const validated = partialSchema.parse(formData);
      if (!tenantId) return;

      const res = await fetch(`/api/${tenantId}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
      const data = (await res.json()) as { data?: Table; error?: string };
      if (!res.ok)
        throw new Error(data?.error || t('tables.toast.createError'));

      let newTable = data.data;
      if (!newTable) return;

      const origin = window.location.origin;
      const qrCodeUrl = `${origin}/marketplace?tenantId=${tenantId}&tableId=${newTable.id}`;

      const updateRes = await fetch(`/api/${tenantId}/tables/${newTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeUrl }),
      });
      const updateData = (await updateRes.json()) as { data?: Table };
      if (updateRes.ok && updateData.data) {
        newTable = updateData.data;
      }

      setTables((prev) => [newTable, ...prev]);
      toast.success(t('tables.toast.createSuccess'));
      setIsCreateOpen(false);
      setFormData({ label: '', qrCodeUrl: '', isActive: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errs: Record<string, { message: string }> = {};
        error.errors.forEach((err) => {
          const key = err.path[0]?.toString();
          if (key) errs[key] = { message: err.message };
        });
        setFormErrors(errs);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setFormErrors({});
    try {
      const validated = createTableSchema(t).parse(formData);
      if (!tenantId || !current?.id) return;
      const res = await fetch(`/api/${tenantId}/tables/${current.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
      const data = (await res.json()) as { data?: Table; error?: string };
      if (!res.ok)
        throw new Error(data?.error || t('tables.toast.updateError'));
      if (data?.data)
        setTables((prev) =>
          prev.map((x) => (x.id === current.id ? data.data! : x))
        );
      toast.success(t('tables.toast.updateSuccess'));
      setIsEditOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errs: Record<string, { message: string }> = {};
        error.errors.forEach((err) => {
          const key = err.path[0]?.toString();
          if (key) errs[key] = { message: err.message };
        });
        setFormErrors(errs);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!tenantId) return;
    const res = await fetch(`/api/${tenantId}/tables/${tableId}`, {
      method: 'DELETE',
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(data?.error || t('tables.toast.deleteError'));
    } else {
      setTables((prev) => prev.filter((x) => x.id !== tableId));
      toast.success(t('tables.toast.deleteSuccess'));
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
            {t('tables.title')}
          </h1>
          <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1'>
            {t('tables.subtitle').replace(
              '{name}',
              tenant?.name || tenant?.id || tenantId
            )}
          </p>
        </div>
        <Sheet
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setFormData({ label: '', qrCodeUrl: '', isActive: true });
              setFormErrors({});
            }
          }}
        >
          <SheetTrigger asChild>
            <Button
              variant='default'
              className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('tables.button.new')}
            </Button>
          </SheetTrigger>
          <SheetContent className='overflow-y-auto w-full sm:w-[90%] md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl'>
            <SheetHeader>
              <SheetTitle>{t('tables.sheet.createTitle')}</SheetTitle>
              <SheetDescription>
                {t('tables.sheet.createDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6'>
              <div className='grid gap-4 sm:gap-6'>
                <Field>
                  <FieldLabel>{t('tables.sheet.fields.label')}</FieldLabel>
                  <Input
                    name='label'
                    value={formData.label}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }));
                      if (formErrors.label) {
                        setFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.label;
                          return n;
                        });
                      }
                    }}
                    placeholder={t('tables.sheet.placeholders.label')}
                    className='focus-visible:ring-blue-600 h-10 sm:h-11 text-sm sm:text-base'
                  />
                  <FieldError errors={[formErrors.label]} />
                </Field>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <Checkbox
                    id='isActive'
                    checked={Boolean(formData.isActive)}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({ ...prev, isActive: Boolean(v) }))
                    }
                  />
                  <label
                    htmlFor='isActive'
                    className='text-sm sm:text-base font-medium cursor-pointer text-gray-700 dark:text-gray-300'
                  >
                    {t('tables.sheet.fields.isActive')}
                  </label>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant='outline'
                onClick={() => setIsCreateOpen(false)}
                className='w-full sm:w-auto'
              >
                {t('tables.sheet.actions.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto'
              >
                {isSubmitting
                  ? t('tables.sheet.actions.creating')
                  : t('tables.sheet.actions.create')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Card */}
      <Card className='border-0 shadow-sm bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800'>
        <CardHeader className='p-4 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg'>
              <QrCode className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <CardTitle className='text-base sm:text-lg md:text-xl font-semibold'>
              {t('tables.list.title')}
            </CardTitle>
            <Badge variant='secondary' className='text-xs px-2 py-0.5'>
              {filteredTables.length}
            </Badge>
          </div>

          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-56 md:w-64 min-w-[180px] sm:min-w-[200px]'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                type='search'
                placeholder={t('tables.list.searchPlaceholder')}
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
                    {t('tables.list.filter.status')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>
                  {t('tables.list.filter.status')}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                  {t('tables.list.filter.all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter('active')}>
                  {t('tables.list.filter.active')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter('inactive')}>
                  {t('tables.list.filter.inactive')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className={`h-9 w-9 ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : ''
                }`}
                onClick={() => setViewModePersist('table')}
                aria-label={t('tables.list.view.tableAria')}
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
                onClick={() => setViewModePersist('grid')}
                aria-label={t('tables.list.view.gridAria')}
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
                <UITable>
                  <TableHeader className='bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10'>
                    <TableRow className='hover:bg-transparent border-b border-gray-200 dark:border-gray-700'>
                      <TableHead className='w-[50px] pl-4 py-3'>
                        <Checkbox
                          checked={
                            filteredTables.length > 0 &&
                            selected.length === filteredTables.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label={t('tables.aria.selectAll')}
                        />
                      </TableHead>
                      <TableHead className='min-w-[200px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('tables.table.headers.table')}
                      </TableHead>
                      <TableHead className='min-w-[250px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('tables.table.headers.qrCode')}
                      </TableHead>
                      <TableHead className='min-w-[100px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('tables.table.headers.status')}
                      </TableHead>
                      <TableHead className='min-w-[140px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('tables.table.headers.createdAt')}
                      </TableHead>
                      <TableHead className='w-[50px] py-3'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`s-${i}`}>
                          <TableCell className='pl-4'>
                            <Skeleton className='h-4 w-4' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-40' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-64' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-5 w-20' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-32' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-8 w-8 ml-auto' />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredTables.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='h-32 text-center text-gray-500 py-8'
                        >
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <QrCode className='h-8 w-8 text-gray-400' />
                            <p className='text-sm'>{t('tables.table.empty')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTables.map((table) => {
                        const status = getStatusConfig(table.isActive);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow
                            key={table.id}
                            className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50'
                          >
                            <TableCell className='pl-4 py-3'>
                              <Checkbox
                                checked={selected.includes(table.id)}
                                onCheckedChange={() => toggleSelect(table.id)}
                                aria-label={t(
                                  'tables.aria.selectTable'
                                ).replace('{label}', table.label)}
                              />
                            </TableCell>
                            <TableCell className='py-3'>
                              <div className='flex items-center gap-3'>
                                <div className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-sm'>
                                  {table.label
                                    ? table.label.charAt(0).toUpperCase()
                                    : 'T'}
                                </div>
                                <div>
                                  <div className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                    {table.label}
                                  </div>
                                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                                    ID: {table.id.substring(0, 8).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='py-3 text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-mono truncate max-w-[250px]'>
                              {table.qrCodeUrl}
                            </TableCell>
                            <TableCell className='py-3'>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border flex items-center gap-1.5 w-fit ${status.class}`}
                              >
                                <StatusIcon className='h-3 w-3' />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='py-3'>
                              <div className='flex flex-col'>
                                <span className='text-sm text-gray-900 dark:text-gray-200'>
                                  {formatDate(table.createdAt)}
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  {formatTime(table.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='py-3'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                  >
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>
                                      {t('tables.actions.title')}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>
                                    {t('tables.actions.title')}
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    className='cursor-pointer'
                                    onClick={() => {
                                      setCurrent(table);
                                      setFormData({
                                        label: table.label,
                                        qrCodeUrl: table.qrCodeUrl,
                                        isActive: table.isActive,
                                      });
                                      setIsEditOpen(true);
                                    }}
                                  >
                                    <PenIcon className='mr-2 h-4 w-4' />
                                    {t('tables.actions.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='cursor-pointer'
                                    onClick={() => downloadQR(table, 'png')}
                                  >
                                    <Download className='mr-2 h-4 w-4' />
                                    {t('tables.actions.downloadQR.png')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className='cursor-pointer'
                                    onClick={() => downloadQR(table, 'svg')}
                                  >
                                    <Download className='mr-2 h-4 w-4' />
                                    {t('tables.actions.downloadQR.svg')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className='text-red-600 focus:text-red-600 cursor-pointer'
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2Icon className='mr-2 h-4 w-4' />
                                        {t('tables.actions.delete')}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {t('tables.delete.title')}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('tables.delete.description')}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          {t('tables.delete.cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(table.id)}
                                          className='bg-red-600 hover:bg-red-700 text-white'
                                        >
                                          {t('tables.delete.confirm')}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </UITable>
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
                ) : filteredTables.length === 0 ? (
                  <div className='text-center text-gray-500 py-12'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <QrCode className='h-8 w-8 text-gray-400' />
                      <p className='text-sm'>{t('tables.table.empty')}</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredTables.map((table, idx) => {
                      const status = getStatusConfig(table.isActive);
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={table.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98]'>
                            <CardContent className='p-4'>
                              <div className='flex items-start gap-3 mb-3'>
                                <div className='h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0'>
                                  {table.label
                                    ? table.label.charAt(0).toUpperCase()
                                    : 'T'}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center justify-between gap-2 mb-1'>
                                    <h3 className='font-semibold text-base text-gray-900 dark:text-white truncate'>
                                      {table.label}
                                    </h3>
                                    <Badge
                                      variant='secondary'
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border flex items-center gap-1.5 shrink-0 ${status.class}`}
                                    >
                                      <StatusIcon className='h-3 w-3' />
                                      {status.label}
                                    </Badge>
                                  </div>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono truncate'>
                                    {table.qrCodeUrl}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    ID: {table.id.substring(0, 8).toUpperCase()}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                    {t('tables.date.createdAtWithTime')
                                      .replace(
                                        '{date}',
                                        formatDate(table.createdAt)
                                      )
                                      .replace(
                                        '{time}',
                                        formatTime(table.createdAt)
                                      )}
                                  </p>
                                </div>
                              </div>
                              <div className='flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => {
                                    setCurrent(table);
                                    setFormData({
                                      label: table.label,
                                      qrCodeUrl: table.qrCodeUrl,
                                      isActive: table.isActive,
                                    });
                                    setIsEditOpen(true);
                                  }}
                                  className='flex-1'
                                >
                                  <PenIcon className='h-4 w-4 mr-2' />
                                  {t('tables.actions.edit')}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='px-2'
                                    >
                                      {downloadingId === table.id ? (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                      ) : (
                                        <Download className='h-4 w-4' />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuItem
                                      onClick={() => downloadQR(table, 'png')}
                                    >
                                      PNG
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => downloadQR(table, 'svg')}
                                    >
                                      SVG
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                                    >
                                      <Trash2Icon className='h-4 w-4' />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t('tables.delete.title')}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('tables.delete.description')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        <XIcon className='h-4 w-4 mr-2' />
                                        {t('tables.delete.cancel')}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(table.id)}
                                        className='bg-red-600 hover:bg-red-700 text-white'
                                      >
                                        <Trash2Icon className='h-4 w-4 mr-2' />
                                        {t('tables.delete.confirm')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
              ) : filteredTables.length === 0 ? (
                <div className='col-span-full text-center text-gray-500 py-12'>
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <QrCode className='h-8 w-8 text-gray-400' />
                    <p className='text-sm'>{t('tables.table.empty')}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredTables.map((table, idx) => {
                    const status = getStatusConfig(table.isActive);
                    const StatusIcon = status.icon;
                    return (
                      <motion.div
                        key={table.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ y: -2 }}
                      >
                        <Card className='h-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all'>
                          <CardContent className='p-4'>
                            <div className='flex items-start gap-3 mb-3'>
                              <div className='h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0'>
                                {table.label
                                  ? table.label.charAt(0).toUpperCase()
                                  : 'T'}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between gap-2 mb-1'>
                                  <h3 className='font-semibold text-sm text-gray-900 dark:text-white truncate'>
                                    {table.label}
                                  </h3>
                                  <Badge
                                    variant='secondary'
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold border flex items-center gap-1.5 shrink-0 ${status.class}`}
                                  >
                                    <StatusIcon className='h-3 w-3' />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className='text-xs text-gray-500 dark:text-gray-400 font-mono truncate mb-2'>
                                  {table.qrCodeUrl}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                  {t('tables.date.createdAt').replace(
                                    '{date}',
                                    formatDate(table.createdAt)
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setCurrent(table);
                                  setFormData({
                                    label: table.label,
                                    qrCodeUrl: table.qrCodeUrl,
                                    isActive: table.isActive,
                                  });
                                  setIsEditOpen(true);
                                }}
                                className='flex-1'
                              >
                                <PenIcon className='h-3.5 w-3.5 mr-1.5' />
                                {t('tables.actions.edit')}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='px-2'
                                  >
                                    {downloadingId === table.id ? (
                                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                    ) : (
                                      <Download className='h-3.5 w-3.5' />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() => downloadQR(table, 'png')}
                                  >
                                    PNG
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => downloadQR(table, 'svg')}
                                  >
                                    SVG
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2'
                                  >
                                    <Trash2Icon className='h-3.5 w-3.5' />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('tables.delete.title')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('tables.delete.description')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      <XIcon className='h-4 w-4 mr-2' />
                                      {t('tables.delete.cancel')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(table.id)}
                                      className='bg-red-600 hover:bg-red-700 text-white'
                                    >
                                      <Trash2Icon className='h-4 w-4 mr-2' />
                                      {t('tables.delete.confirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

        {/* Edit Sheet */}
        <Sheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setCurrent(null);
              setFormErrors({});
            }
          }}
        >
          <SheetContent className='overflow-y-auto w-full sm:w-[90%] md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl'>
            <SheetHeader>
              <SheetTitle>{t('tables.sheet.editTitle')}</SheetTitle>
              <SheetDescription>
                {t('tables.sheet.editDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6'>
              <div className='grid gap-4 sm:gap-6'>
                <Field>
                  <FieldLabel>{t('tables.sheet.fields.label')}</FieldLabel>
                  <Input
                    name='label'
                    value={formData.label}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }));
                      if (formErrors.label) {
                        setFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.label;
                          return n;
                        });
                      }
                    }}
                    placeholder={t('tables.sheet.placeholders.label')}
                    className='focus-visible:ring-blue-600 h-10 sm:h-11 text-sm sm:text-base'
                  />
                  <FieldError errors={[formErrors.label]} />
                </Field>
                <Field>
                  <FieldLabel>{t('tables.sheet.fields.qrCodeUrl')}</FieldLabel>
                  <Input
                    name='qrCodeUrl'
                    value={formData.qrCodeUrl || ''}
                    readOnly
                    className='bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed h-10 sm:h-11 text-xs sm:text-sm font-mono'
                  />
                </Field>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <Checkbox
                    id='isActiveEdit'
                    checked={Boolean(formData.isActive)}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({ ...prev, isActive: Boolean(v) }))
                    }
                  />
                  <label
                    htmlFor='isActiveEdit'
                    className='text-sm sm:text-base font-medium cursor-pointer text-gray-700 dark:text-gray-300'
                  >
                    {t('tables.sheet.fields.isActive')}
                  </label>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant='outline'
                onClick={() => setIsEditOpen(false)}
                className='w-full sm:w-auto'
              >
                {t('tables.sheet.actions.cancel')}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto'
              >
                {isSubmitting
                  ? t('tables.sheet.actions.saving')
                  : t('tables.sheet.actions.save')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Card>
    </motion.div>
  );
};

export default withAppLayout(TablesPage, {
  requireAuth: true,
  showLoading: true,
});
