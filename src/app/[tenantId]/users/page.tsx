'use client';

import {
  withAppLayout,
  type AppLayoutContext,
} from '@/components/hoc/withAppLayout';
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
  SheetTrigger,
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
  ChevronDown,
  Coffee,
  Edit,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Table as TableIcon,
  Trash,
  User,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UsersResponse {
  data?: User[];
  users?: User[];
}

interface UserFormData {
  name?: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'BARTENDER' | 'WAITER';
}

interface UsersPageProps {
  layout: AppLayoutContext;
}

const createUserSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().optional(),
    email: z.string().email(t('users.validation.emailInvalid')),
    password: z.string().min(6, t('users.validation.passwordMin')),
    role: z.enum(['ADMIN', 'BARTENDER', 'WAITER'], {
      errorMap: () => ({ message: t('users.validation.roleInvalid') }),
    }),
  });

const UsersPage: React.FC<UsersPageProps> = ({ layout }) => {
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'ADMIN' | 'BARTENDER' | 'WAITER'
  >('all');

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'WAITER',
  });
  const [formErrors, setFormErrors] = useState<
    Record<string, { message: string }>
  >({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('users_view_mode');
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
      localStorage.setItem('users_view_mode', mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const url = new URL(`/api/${tenantId}/users`, window.location.origin);
      if (search.trim().length > 0) {
        url.searchParams.set('query', search.trim());
      }
      fetch(url.toString(), { signal: controller.signal })
        .then((res) => res.json())
        .then((data: User[] | UsersResponse) => {
          let usersList: User[] = [];
          if (Array.isArray(data)) {
            usersList = data;
          } else if (data.data) {
            usersList = data.data;
          } else if (data.users) {
            usersList = data.users;
          }
          setUsers(usersList);
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch users', err);
          }
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [tenantId, search]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role.toUpperCase() === roleFilter);
  }, [users, roleFilter]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uId) => uId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
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

  const getRoleConfig = (role: string) => {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
      case 'ADMIN':
        return {
          label: 'ADMIN',
          icon: Shield,
          class:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        };
      case 'BARTENDER':
        return {
          label: 'BARTENDER',
          icon: Coffee,
          class:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        };
      case 'WAITER':
        return {
          label: 'WAITER',
          icon: UserCheck,
          class:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        };
      default:
        return {
          label: role,
          icon: User,
          class:
            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        };
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'WAITER',
    });
    setFormErrors({});
  };

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const validated = createUserSchema(t).parse(formData);
      if (!tenantId) return;

      const response = await fetch(`/api/${tenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });
      const data = (await response.json()) as { data?: User; error?: string };
      if (!response.ok) {
        throw new Error(data.error || t('users.toast.createError'));
      }

      if (data.data) {
        setUsers((prev) => [data.data!, ...prev]);
      }
      toast.success(t('users.toast.createSuccess'));
      setIsSheetOpen(false);
      resetForm();
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
            {t('users.title')}
          </h1>
          <p className='text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1'>
            {t('users.subtitle').replace(
              '{name}',
              tenant?.name || tenant?.id || tenantId
            )}
          </p>
        </div>
        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) resetForm();
          }}
        >
          <SheetTrigger asChild>
            <Button
              variant='default'
              className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('users.button.new')}
            </Button>
          </SheetTrigger>
          <SheetContent className='overflow-y-auto w-full sm:w-[90%] md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl'>
            <SheetHeader>
              <SheetTitle>{t('users.sheet.createTitle')}</SheetTitle>
              <SheetDescription>
                {t('users.sheet.createDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6'>
              <div className='grid gap-4 sm:gap-6'>
                <Field>
                  <FieldLabel>{t('users.form.nameLabel')}</FieldLabel>
                  <Input
                    name='name'
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    placeholder={t('users.form.namePlaceholder')}
                    className='focus-visible:ring-blue-600 h-10 sm:h-11 text-sm sm:text-base'
                  />
                  <FieldError errors={[formErrors.name]} />
                </Field>
                <Field>
                  <FieldLabel>{t('users.form.emailLabel')}</FieldLabel>
                  <Input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('users.form.emailPlaceholder')}
                    className='focus-visible:ring-blue-600 h-10 sm:h-11 text-sm sm:text-base'
                  />
                  <FieldError errors={[formErrors.email]} />
                </Field>
                <Field>
                  <FieldLabel>{t('users.form.passwordLabel')}</FieldLabel>
                  <Input
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder='********'
                    className='focus-visible:ring-blue-600 h-10 sm:h-11 text-sm sm:text-base'
                  />
                  <FieldError errors={[formErrors.password]} />
                </Field>
                <Field>
                  <FieldLabel>{t('users.form.roleLabel')}</FieldLabel>
                  <select
                    name='role'
                    value={formData.role}
                    onChange={handleInputChange}
                    className='h-10 sm:h-11 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-sm sm:text-base text-gray-900 dark:text-white focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <option value='ADMIN'>ADMIN</option>
                    <option value='BARTENDER'>BARTENDER</option>
                    <option value='WAITER'>WAITER</option>
                  </select>
                  <FieldError errors={[formErrors.role]} />
                </Field>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant='outline'
                onClick={() => setIsSheetOpen(false)}
                className='w-full sm:w-auto'
              >
                {t('users.sheet.actions.cancel')}
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isSubmitting}
                className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto'
              >
                {isSubmitting
                  ? t('users.sheet.actions.creating')
                  : t('users.sheet.actions.create')}
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
              <UsersIcon className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <CardTitle className='text-base sm:text-lg md:text-xl font-semibold'>
              {t('users.list.cardTitle')}
            </CardTitle>
            <Badge variant='secondary' className='text-xs px-2 py-0.5'>
              {filteredUsers.length}
            </Badge>
          </div>

          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-56 md:w-64 min-w-[180px] sm:min-w-[200px]'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                type='search'
                placeholder={t('users.list.searchPlaceholder')}
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
                    {roleFilter === 'all'
                      ? t('users.list.filter.all')
                      : roleFilter}
                  </span>
                  <span className='sm:hidden'>
                    {t('users.list.filter.role')}
                  </span>
                  <ChevronDown className='h-3.5 w-3.5 opacity-50' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>
                  {t('users.list.filter.label')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                  {t('users.list.filter.all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('ADMIN')}>
                  ADMIN
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('BARTENDER')}>
                  BARTENDER
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('WAITER')}>
                  WAITER
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
                aria-label={t('users.list.view.tableAria')}
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
                aria-label={t('users.list.view.gridAria')}
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
                      <TableHead className='w-[50px] pl-4 py-3'>
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.length === filteredUsers.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label={t('users.aria.selectAll')}
                        />
                      </TableHead>
                      <TableHead className='min-w-[200px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('users.table.headers.user')}
                      </TableHead>
                      <TableHead className='min-w-[200px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('users.table.headers.email')}
                      </TableHead>
                      <TableHead className='min-w-[120px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('users.table.headers.role')}
                      </TableHead>
                      <TableHead className='min-w-[140px] py-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t('users.table.headers.createdAt')}
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
                            <Skeleton className='h-4 w-48' />
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
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='h-32 text-center text-gray-500 py-8'
                        >
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <UsersIcon className='h-8 w-8 text-gray-400' />
                            <p className='text-sm'>{t('users.table.empty')}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => {
                        const roleConfig = getRoleConfig(user.role);
                        const RoleIcon = roleConfig.icon;
                        return (
                          <TableRow
                            key={user.id}
                            className='group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50'
                          >
                            <TableCell className='pl-4 py-3'>
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() =>
                                  toggleSelectUser(user.id)
                                }
                                aria-label={t('users.aria.selectUser').replace(
                                  '{name}',
                                  user.name || user.email
                                )}
                              />
                            </TableCell>
                            <TableCell className='py-3'>
                              <div className='flex items-center gap-3'>
                                <div className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-sm'>
                                  {user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className='font-semibold text-sm sm:text-base text-gray-900 dark:text-white'>
                                    {user.name || t('users.badge.noName')}
                                  </div>
                                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                                    ID: {user.id.substring(0, 8).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='py-3 text-gray-600 dark:text-gray-300 text-sm'>
                              {user.email}
                            </TableCell>
                            <TableCell className='py-3'>
                              <Badge
                                variant='secondary'
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border flex items-center gap-1.5 w-fit ${roleConfig.class}`}
                              >
                                <RoleIcon className='h-3 w-3' />
                                {roleConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='py-3'>
                              <div className='flex flex-col'>
                                <span className='text-sm text-gray-900 dark:text-gray-200'>
                                  {formatDate(user.createdAt)}
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  {formatTime(user.createdAt)}
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
                                      {t('users.actions.title')}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align='end'
                                  className='w-48'
                                >
                                  <DropdownMenuLabel>
                                    {t('users.actions.title')}
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      console.log('Update user', user.id)
                                    }
                                    className='cursor-pointer'
                                  >
                                    <Edit className='mr-2 h-4 w-4' />
                                    {t('users.actions.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      console.log('Delete user', user.id)
                                    }
                                    className='text-red-600 focus:text-red-600 cursor-pointer'
                                  >
                                    <Trash className='mr-2 h-4 w-4' />
                                    {t('users.actions.delete')}
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
                        <Skeleton className='h-24 w-full' />
                      </Card>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className='text-center text-gray-500 py-12'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <UsersIcon className='h-8 w-8 text-gray-400' />
                      <p className='text-sm'>{t('users.table.empty')}</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredUsers.map((user, idx) => {
                      const roleConfig = getRoleConfig(user.role);
                      const RoleIcon = roleConfig.icon;
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card className='border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98]'>
                            <CardContent className='p-4'>
                              <div className='flex items-start gap-3 mb-3'>
                                <div className='h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0'>
                                  {user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : user.email.charAt(0).toUpperCase()}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-center justify-between gap-2 mb-1'>
                                    <h3 className='font-semibold text-base text-gray-900 dark:text-white truncate'>
                                      {user.name || 'Sans nom'}
                                    </h3>
                                    <Badge
                                      variant='secondary'
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border flex items-center gap-1.5 shrink-0 ${roleConfig.class}`}
                                    >
                                      <RoleIcon className='h-3 w-3' />
                                      {roleConfig.label}
                                    </Badge>
                                  </div>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 truncate'>
                                    {user.email}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    ID: {user.id.substring(0, 8).toUpperCase()}
                                  </p>
                                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                    {t('users.date.createdAtWithTime')
                                      .replace(
                                        '{date}',
                                        formatDate(user.createdAt)
                                      )
                                      .replace(
                                        '{time}',
                                        formatTime(user.createdAt)
                                      )}
                                  </p>
                                </div>
                              </div>
                              <div className='flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    console.log('Update user', user.id)
                                  }
                                  className='flex-1'
                                >
                                  <Edit className='h-4 w-4 mr-2' />
                                  {t('users.actions.edit')}
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    console.log('Delete user', user.id)
                                  }
                                  className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                                >
                                  <Trash className='h-4 w-4 mr-2' />
                                  {t('users.actions.delete')}
                                </Button>
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
              ) : filteredUsers.length === 0 ? (
                <div className='col-span-full text-center text-gray-500 py-12'>
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <UsersIcon className='h-8 w-8 text-gray-400' />
                    <p className='text-sm'>{t('users.table.empty')}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredUsers.map((user, idx) => {
                    const roleConfig = getRoleConfig(user.role);
                    const RoleIcon = roleConfig.icon;
                    return (
                      <motion.div
                        key={user.id}
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
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : user.email.charAt(0).toUpperCase()}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between gap-2 mb-1'>
                                  <h3 className='font-semibold text-sm text-gray-900 dark:text-white truncate'>
                                    {user.name || 'Sans nom'}
                                  </h3>
                                  <Badge
                                    variant='secondary'
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold border flex items-center gap-1.5 shrink-0 ${roleConfig.class}`}
                                  >
                                    <RoleIcon className='h-3 w-3' />
                                    {roleConfig.label}
                                  </Badge>
                                </div>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-2'>
                                  {user.email}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                  {t('users.date.createdAt').replace(
                                    '{date}',
                                    formatDate(user.createdAt)
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  console.log('Update user', user.id)
                                }
                                className='flex-1'
                              >
                                <Edit className='h-3.5 w-3.5 mr-1.5' />
                                {t('users.actions.edit')}
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  console.log('Delete user', user.id)
                                }
                                className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2'
                              >
                                <Trash className='h-3.5 w-3.5' />
                                <span className='sr-only'>
                                  {t('users.actions.delete')}
                                </span>
                              </Button>
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
    </motion.div>
  );
};

export default withAppLayout(UsersPage, {
  requireAuth: true,
  showLoading: true,
});
