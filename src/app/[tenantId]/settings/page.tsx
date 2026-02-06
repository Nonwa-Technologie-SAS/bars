'use client';

import { withAppLayout } from '@/components/hoc/withAppLayout';
import type { TenantContext } from '@/components/hoc/withTenant';
import { useI18n } from '@/components/providers/I18nProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Building2,
  Camera,
  Check,
  Clock,
  CreditCard,
  Globe,
  HelpCircle,
  Info,
  Languages,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  TrendingUp,
  User as UserIcon,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

// ======================
// Schemas Zod
// ======================
const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().nullable(),
  bio: z
    .string()
    .max(500, 'La bio ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
});

const tenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug invalide (lettres minuscules, chiffres et tirets uniquement)',
    ),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .email('Email invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z
    .string()
    .url('URL invalide')
    .optional()
    .nullable()
    .or(z.literal('')),
  description: z.string().max(1000).optional().nullable(),
});

interface SettingsPageProps {
  tenant: TenantContext;
}

interface NotificationPreferences {
  newOrders: boolean;
  orderStatusChanges: boolean;
  orderCancellations: boolean;
  lowStockAlerts: boolean;
  outOfStockAlerts: boolean;
  restockNotifications: boolean;
  paymentReceived: boolean;
  paymentFailed: boolean;
  refundProcessed: boolean;
  promotionalEmails: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
  maintenanceNotices: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'lb' | 'ar' | 'zh';
  timezone: string;
  compactMode: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// ======================
// Composant EditableField
// ======================
interface EditableFieldProps {
  label: string;
  value: string;
  field: string;
  icon: React.ReactNode;
  onSave: (field: string, value: string) => Promise<void>;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  field,
  icon,
  onSave,
  type = 'text',
  placeholder,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync editValue when value changes from store
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(field, editValue);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  return (
    <motion.div
      layout
      className='group flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40 hover:border-border hover:bg-muted/30 transition-all'
    >
      <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
        {icon}
      </div>
      <div className='flex-1 w-full min-w-0'>
        <Label className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>
          {label}
        </Label>
        <AnimatePresence mode='wait'>
          {isEditing ? (
            <motion.div
              key='editing'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className='mt-2 space-y-2'
            >
              {type === 'textarea' ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className='min-h-[100px] resize-none'
                  disabled={saving}
                />
              ) : (
                <Input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  disabled={saving}
                  className='h-10'
                />
              )}
              {error && <p className='text-xs text-destructive'>{error}</p>}
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  onClick={handleSave}
                  disabled={saving}
                  className='gap-2 bg-blue-600 hover:bg-blue-700 text-white'
                >
                  {saving ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    <Check className='h-3 w-3' />
                  )}
                  Enregistrer
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={handleCancel}
                  disabled={saving}
                  className='hover:bg-gray-100 dark:hover:bg-gray-800'
                >
                  <X className='h-3 w-3 mr-1' />
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='display'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='mt-1 flex flex-wrap items-center justify-between gap-2'
            >
              <p className='text-sm font-medium truncate min-w-0 flex-1'>
                {value || (
                  <span className='text-muted-foreground italic'>
                    Non renseigné
                  </span>
                )}
              </p>
              {!disabled && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setIsEditing(true)}
                  className='opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0'
                >
                  <Pencil className='h-3 w-3 mr-1' />
                  Modifier
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ======================
// Composant NotificationSwitch
// ======================
interface NotificationSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
}

const NotificationSwitch: React.FC<NotificationSwitchProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}) => (
  <motion.div
    whileHover={{ scale: 1.005 }}
    className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40 hover:border-border transition-all'
  >
    <div className='flex items-start gap-3 min-w-0'>
      <div className='h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5'>
        {icon}
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>{label}</p>
        <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} className='shrink-0' />
  </motion.div>
);

// ======================
// Page Settings
// ======================
const SettingsPage: React.FC<SettingsPageProps> = ({
  tenant: tenantContext,
}) => {
  const { locale, setLocale, t } = useI18n();
  const [activeTab, setActiveTab] = useState('profile');

  // Store Zustand
  const {
    user,
    tenant,
    isLoading,
    updateUser,
    updateTenant,
    refreshUser,
    refreshTenant,
    fetchCurrentSession,
  } = useAuthStore();

  // Notification preferences (localStorage)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    newOrders: true,
    orderStatusChanges: true,
    orderCancellations: true,
    lowStockAlerts: true,
    outOfStockAlerts: true,
    restockNotifications: false,
    paymentReceived: true,
    paymentFailed: true,
    refundProcessed: true,
    promotionalEmails: false,
    weeklyReports: true,
    monthlyReports: true,
    securityAlerts: true,
    systemUpdates: true,
    maintenanceNotices: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  // App preferences (localStorage)
  const [appPrefs, setAppPrefs] = useState<AppPreferences>({
    theme: 'system',
    language: locale,
    timezone: 'Africa/Douala',
    compactMode: false,
    soundEnabled: true,
    autoRefresh: true,
    refreshInterval: 30,
  });

  // Load preferences from localStorage
  useEffect(() => {
    if (!tenantContext?.tenantId) return;

    const savedNotifs = localStorage.getItem(
      `notif_prefs_${tenantContext.tenantId}`,
    );
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch {}
    }

    const savedAppPrefs = localStorage.getItem(
      `app_prefs_${tenantContext.tenantId}`,
    );
    if (savedAppPrefs) {
      try {
        setAppPrefs(JSON.parse(savedAppPrefs));
      } catch {}
    }
  }, [tenantContext?.tenantId]);

  // Si pas de données dans le store, essayer de les charger via l'API
  useEffect(() => {
    if (!user && !tenant && !isLoading) {
      fetchCurrentSession();
    }
  }, [user, tenant, isLoading, fetchCurrentSession]);

  // Save profile field
  const saveProfileField = useCallback(
    async (field: string, value: string) => {
      if (!user || !tenant)
        throw new Error('Données utilisateur non disponibles');

      const currentProfile = {
        name: user.name || '',
        email: user.email,
        phone: user.phone,
        bio: user.bio,
      };
      const updatedProfile = { ...currentProfile, [field]: value };

      const result = profileSchema.safeParse(updatedProfile);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const res = await fetch(`/api/${tenant.id}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour le store
      updateUser({ [field]: value });
    },
    [user, tenant, updateUser],
  );

  // Save tenant field
  const saveTenantField = useCallback(
    async (field: string, value: string) => {
      if (!tenant) throw new Error('Données établissement non disponibles');

      const currentTenant = {
        name: tenant.name,
        slug: tenant.slug,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
        website: tenant.website,
        description: tenant.description,
      };
      const updatedTenant = { ...currentTenant, [field]: value };

      const result = tenantSchema.safeParse(updatedTenant);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const res = await fetch(`/api/${tenant.id}/tenant`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour le store
      updateTenant({ [field]: value });
    },
    [tenant, updateTenant],
  );

  // Save notifications
  const saveNotifications = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      const updated = { ...notifications, [key]: value };
      setNotifications(updated);
      localStorage.setItem(
        `notif_prefs_${tenantContext?.tenantId}`,
        JSON.stringify(updated),
      );
    },
    [notifications, tenantContext?.tenantId],
  );

  // Save app preferences
  const saveAppPrefs = useCallback(
    (key: keyof AppPreferences, value: unknown) => {
      const updated = { ...appPrefs, [key]: value };
      setAppPrefs(updated);
      localStorage.setItem(
        `app_prefs_${tenantContext?.tenantId}`,
        JSON.stringify(updated),
      );

      if (
        key === 'language' &&
        (value === 'fr' ||
          value === 'en' ||
          value === 'lb' ||
          value === 'ar' ||
          value === 'zh')
      ) {
        setLocale(value as 'fr' | 'en' | 'lb' | 'ar' | 'zh');
      }

      // Appliquer le thème immédiatement
      if (key === 'theme') {
        const root = document.documentElement;
        if (value === 'dark') {
          root.classList.add('dark');
        } else if (value === 'light') {
          root.classList.remove('dark');
        } else {
          const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
          ).matches;
          root.classList.toggle('dark', prefersDark);
        }
      }
    },
    [appPrefs, tenantContext?.tenantId, setLocale],
  );

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // Loading state
  if (isLoading || (!user && !tenant)) {
    return (
      <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded-2xl' />
          <div className='space-y-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
        <Skeleton className='h-12 w-full max-w-2xl' />
        <div className='grid gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
      >
        <div className='flex items-start gap-4 min-w-0'>
          <div className='h-12 w-12 shrink-0 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
            <Settings className='h-6 w-6' />
          </div>
          <div className='min-w-0'>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate'>
              {t('settings.title')}
            </h1>
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2 sm:line-clamp-none'>
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            refreshUser();
            refreshTenant();
          }}
          className='gap-2 w-full sm:w-auto shrink-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
        >
          <RefreshCw className='h-4 w-4' />
          Actualiser
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='bg-muted/50 p-1.5 sm:p-1 rounded-xl h-auto flex flex-wrap gap-1.5 sm:gap-1 text-gray-700 dark:text-gray-300 w-full sm:w-auto'>
          <TabsTrigger
            value='profile'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <UserIcon className='h-4 w-4' />
            {t('settings.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger
            value='preferences'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <Bell className='h-4 w-4' />
            {t('settings.tabs.preferences')}
          </TabsTrigger>
          <TabsTrigger
            value='tenant'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <Building2 className='h-4 w-4' />
            {t('settings.tabs.tenant')}
          </TabsTrigger>
          <TabsTrigger
            value='privacy'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <ShieldCheck className='h-4 w-4' />
            <span className='hidden sm:inline'>
              {t('settings.tabs.privacy')}
            </span>
            <span className='sm:hidden'>Données</span>
          </TabsTrigger>
          <TabsTrigger
            value='faq'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <HelpCircle className='h-4 w-4' />
            {t('settings.tabs.faq')}
          </TabsTrigger>
          <TabsTrigger
            value='contact'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <Mail className='h-4 w-4' />
            {t('settings.tabs.contact')}
          </TabsTrigger>
          <TabsTrigger
            value='about'
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 gap-2'
          >
            <Info className='h-4 w-4' />
            <span className='hidden sm:inline'>À propos de nous</span>
            <span className='sm:hidden'>À propos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Profil */}
        <AnimatePresence mode='wait'>
          <TabsContent key='profile' value='profile' className='space-y-6 mt-0'>
            <motion.div
              key='profile'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              {/* Avatar Section */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Camera className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    Photo de profil
                  </CardTitle>
                  <CardDescription>
                    Votre photo sera visible par les autres membres de
                    l&apos;équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'>
                    <Avatar className='h-24 w-24 shrink-0 border-4 border-white dark:border-gray-800 shadow-lg'>
                      <AvatarImage
                        src={user?.avatarUrl || ''}
                        alt={user?.name || ''}
                      />
                      <AvatarFallback className='text-2xl font-bold bg-blue-600 text-white'>
                        {user?.name?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='space-y-2 w-full min-w-0'>
                      <div>
                        <p className='font-semibold text-lg break-words'>
                          {user?.name || t('settings.profile.user.fallback')}
                        </p>
                        <p className='text-sm text-muted-foreground break-all'>
                          {user?.email}
                        </p>
                        <Badge variant='secondary' className='mt-1'>
                          {user?.role === 'ADMIN'
                            ? t('settings.profile.badge.admin')
                            : user?.role === 'BARTENDER'
                              ? t('settings.profile.badge.bartender')
                              : t('settings.profile.badge.waiter')}
                        </Badge>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-2 w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                      >
                        <Camera className='h-4 w-4' />
                        {t('settings.profile.photo.change')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Fields */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <UserIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.profile.info.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.profile.info.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <EditableField
                    label={t('settings.profile.fields.fullName')}
                    value={user?.name || ''}
                    field='name'
                    icon={<UserIcon className='h-4 w-4' />}
                    onSave={saveProfileField}
                    placeholder={t('settings.profile.placeholders.fullName')}
                  />
                  <EditableField
                    label={t('settings.profile.fields.email')}
                    value={user?.email || ''}
                    field='email'
                    icon={<Mail className='h-4 w-4' />}
                    onSave={saveProfileField}
                    type='email'
                    placeholder={t('settings.profile.placeholders.email')}
                  />
                  <EditableField
                    label={t('settings.profile.fields.phone')}
                    value={user?.phone || ''}
                    field='phone'
                    icon={<Phone className='h-4 w-4' />}
                    onSave={saveProfileField}
                    type='tel'
                    placeholder={t('settings.profile.placeholders.phone')}
                  />
                  <EditableField
                    label={t('settings.profile.fields.bio')}
                    value={user?.bio || ''}
                    field='bio'
                    icon={<MessageSquare className='h-4 w-4' />}
                    onSave={saveProfileField}
                    type='textarea'
                    placeholder={t('settings.profile.placeholders.bio')}
                  />
                </CardContent>
              </Card>

              {/* Security */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Shield className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.security.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.security.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className='h-10 w-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center'>
                        <Shield className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium'>
                          {t('settings.security.password.label')}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {t('settings.security.password.helper')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full sm:w-auto shrink-0 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                    >
                      {t('settings.security.password.change')}
                    </Button>
                  </div>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40'>
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className='h-10 w-10 shrink-0 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center'>
                        <Smartphone className='h-5 w-5' />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium'>
                          {t('settings.security.mfa.label')}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {t('settings.security.mfa.helper')}
                        </p>
                      </div>
                    </div>
                    <Badge variant='secondary' className='w-fit shrink-0'>
                      {t('settings.security.mfa.badge')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: Préférences */}
          <TabsContent key='preferences' value='preferences' className='space-y-6 mt-0'>
            <motion.div
              key='preferences'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              {/* Appearance */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Sun className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.preferences.appearance.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.preferences.appearance.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {[
                      {
                        value: 'light',
                        label: t(
                          'settings.preferences.appearance.theme.light',
                        ),
                        icon: Sun,
                      },
                      {
                        value: 'dark',
                        label: t(
                          'settings.preferences.appearance.theme.dark',
                        ),
                        icon: Moon,
                      },
                      {
                        value: 'system',
                        label: t(
                          'settings.preferences.appearance.theme.system',
                        ),
                        icon: Settings,
                      },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() =>
                          saveAppPrefs(
                            'theme',
                            theme.value as 'light' | 'dark' | 'system',
                          )
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          appPrefs.theme === theme.value
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <theme.icon
                          className={`h-6 w-6 ${appPrefs.theme === theme.value ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
                        />
                        <span
                          className={`text-sm font-medium ${appPrefs.theme === theme.value ? 'text-blue-600 dark:text-blue-400' : ''}`}
                        >
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Separator />
                  <div className='space-y-3'>
                    <NotificationSwitch
                      label={t('settings.preferences.compact.label')}
                      description={t(
                        'settings.preferences.compact.description',
                      )}
                      checked={appPrefs.compactMode}
                      onCheckedChange={(v) => saveAppPrefs('compactMode', v)}
                      icon={<Settings className='h-4 w-4' />}
                    />
                    <NotificationSwitch
                      label={t('settings.preferences.sound.label')}
                      description={t(
                        'settings.preferences.sound.description',
                      )}
                      checked={appPrefs.soundEnabled}
                      onCheckedChange={(v) => saveAppPrefs('soundEnabled', v)}
                      icon={<Volume2 className='h-4 w-4' />}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Language & Region */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Languages className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.preferences.languageRegion.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm'>
                        {t('settings.language.label')}
                      </Label>
                      <select
                        value={appPrefs.language}
                        onChange={(e) =>
                          saveAppPrefs('language', e.target.value)
                        }
                        className='w-full h-10 rounded-lg border border-input bg-background px-3 text-sm'
                      >
                        <option value='fr'>{t('settings.language.fr')}</option>
                        <option value='en'>{t('settings.language.en')}</option>
                        <option value='lb'>{t('settings.language.lb')}</option>
                        <option value='ar'>{t('settings.language.ar')}</option>
                        <option value='zh'>{t('settings.language.zh')}</option>
                      </select>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-sm'>Fuseau horaire</Label>
                      <select
                        value={appPrefs.timezone}
                        onChange={(e) =>
                          saveAppPrefs('timezone', e.target.value)
                        }
                        className='w-full h-10 rounded-lg border border-input bg-background px-3 text-sm'
                      >
                        <option value='Africa/Douala'>Douala (UTC+1)</option>
                        <option value='Africa/Lagos'>Lagos (UTC+1)</option>
                        <option value='Europe/Paris'>Paris (UTC+1/2)</option>
                        <option value='UTC'>UTC</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Channels */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Bell className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.notifications.channels.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.notifications.channels.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <NotificationSwitch
                      label={t('settings.notifications.email.label')}
                      description={t(
                        'settings.notifications.email.description',
                      )}
                    checked={notifications.emailNotifications}
                    onCheckedChange={(v) =>
                      saveNotifications('emailNotifications', v)
                    }
                    icon={<Mail className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                      label={t('settings.notifications.push.label')}
                      description={t(
                        'settings.notifications.push.description',
                      )}
                    checked={notifications.pushNotifications}
                    onCheckedChange={(v) =>
                      saveNotifications('pushNotifications', v)
                    }
                    icon={<Bell className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                      label={t('settings.notifications.sms.label')}
                      description={t(
                        'settings.notifications.sms.description',
                      )}
                    checked={notifications.smsNotifications}
                    onCheckedChange={(v) =>
                      saveNotifications('smsNotifications', v)
                    }
                    icon={<Smartphone className='h-4 w-4' />}
                  />
                </CardContent>
              </Card>

              {/* Order Notifications */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Package className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.notifications.orders.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <NotificationSwitch
                    label={t('settings.notifications.orders.new.label')}
                    description={t(
                      'settings.notifications.orders.new.description',
                    )}
                    checked={notifications.newOrders}
                    onCheckedChange={(v) => saveNotifications('newOrders', v)}
                    icon={<Package className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.orders.status.label')}
                    description={t(
                      'settings.notifications.orders.status.description',
                    )}
                    checked={notifications.orderStatusChanges}
                    onCheckedChange={(v) =>
                      saveNotifications('orderStatusChanges', v)
                    }
                    icon={<TrendingUp className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.orders.cancel.label')}
                    description={t(
                      'settings.notifications.orders.cancel.description',
                    )}
                    checked={notifications.orderCancellations}
                    onCheckedChange={(v) =>
                      saveNotifications('orderCancellations', v)
                    }
                    icon={<X className='h-4 w-4' />}
                  />
                </CardContent>
              </Card>

              {/* Stock Notifications */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.notifications.stock.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <NotificationSwitch
                    label={t('settings.notifications.stock.low.label')}
                    description={t(
                      'settings.notifications.stock.low.description',
                    )}
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(v) =>
                      saveNotifications('lowStockAlerts', v)
                    }
                    icon={<AlertTriangle className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.stock.out.label')}
                    description={t(
                      'settings.notifications.stock.out.description',
                    )}
                    checked={notifications.outOfStockAlerts}
                    onCheckedChange={(v) =>
                      saveNotifications('outOfStockAlerts', v)
                    }
                    icon={<Package className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.stock.restock.label')}
                    description={t(
                      'settings.notifications.stock.restock.description',
                    )}
                    checked={notifications.restockNotifications}
                    onCheckedChange={(v) =>
                      saveNotifications('restockNotifications', v)
                    }
                    icon={<TrendingUp className='h-4 w-4' />}
                  />
                </CardContent>
              </Card>

              {/* Payment Notifications */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <CreditCard className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.notifications.payments.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <NotificationSwitch
                    label={t('settings.notifications.payments.received.label')}
                    description={t(
                      'settings.notifications.payments.received.description',
                    )}
                    checked={notifications.paymentReceived}
                    onCheckedChange={(v) =>
                      saveNotifications('paymentReceived', v)
                    }
                    icon={<Check className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.payments.failed.label')}
                    description={t(
                      'settings.notifications.payments.failed.description',
                    )}
                    checked={notifications.paymentFailed}
                    onCheckedChange={(v) =>
                      saveNotifications('paymentFailed', v)
                    }
                    icon={<X className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.payments.refund.label')}
                    description={t(
                      'settings.notifications.payments.refund.description',
                    )}
                    checked={notifications.refundProcessed}
                    onCheckedChange={(v) =>
                      saveNotifications('refundProcessed', v)
                    }
                    icon={<CreditCard className='h-4 w-4' />}
                  />
                </CardContent>
              </Card>

              {/* Reports */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.notifications.reports.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <NotificationSwitch
                    label={t('settings.notifications.reports.weekly.label')}
                    description={t(
                      'settings.notifications.reports.weekly.description',
                    )}
                    checked={notifications.weeklyReports}
                    onCheckedChange={(v) =>
                      saveNotifications('weeklyReports', v)
                    }
                    icon={<Clock className='h-4 w-4' />}
                  />
                  <NotificationSwitch
                    label={t('settings.notifications.reports.monthly.label')}
                    description={t(
                      'settings.notifications.reports.monthly.description',
                    )}
                    checked={notifications.monthlyReports}
                    onCheckedChange={(v) =>
                      saveNotifications('monthlyReports', v)
                    }
                    icon={<TrendingUp className='h-4 w-4' />}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: Tenant */}
          <TabsContent key='tenant' value='tenant' className='space-y-6 mt-0'>
            <motion.div
              key='tenant'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              {/* Logo */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Building2 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.tenant.logo.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.tenant.logo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'>
                    <div className='h-24 w-24 shrink-0 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden'>
                      {tenant?.logoUrl ? (
                        <img
                          src={tenant.logoUrl}
                          alt={tenant.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Building2 className='h-10 w-10 text-muted-foreground' />
                      )}
                    </div>
                    <div className='space-y-2 w-full min-w-0'>
                      <div>
                        <p className='font-semibold text-lg break-words'>{tenant?.name}</p>
                        <p className='text-sm text-muted-foreground'>
                          /{tenant?.slug}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-2 w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                      >
                        <Camera className='h-4 w-4' />
                        {t('settings.tenant.logo.change')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Info */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Building2 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.tenant.info.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.tenant.info.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                    <EditableField
                    label={t('settings.tenant.fields.name')}
                    value={tenant?.name || ''}
                    field='name'
                    icon={<Building2 className='h-4 w-4' />}
                    onSave={saveTenantField}
                    placeholder={t('settings.tenant.placeholders.name')}
                  />
                  <EditableField
                    label={t('settings.tenant.fields.slug')}
                    value={tenant?.slug || ''}
                    field='slug'
                    icon={<Globe className='h-4 w-4' />}
                    onSave={saveTenantField}
                    placeholder={t('settings.tenant.placeholders.slug')}
                    disabled
                  />
                  <EditableField
                    label={t('settings.tenant.fields.address')}
                    value={tenant?.address || ''}
                    field='address'
                    icon={<MapPin className='h-4 w-4' />}
                    onSave={saveTenantField}
                    placeholder={t('settings.tenant.placeholders.address')}
                  />
                  <EditableField
                    label={t('settings.tenant.fields.phone')}
                    value={tenant?.phone || ''}
                    field='phone'
                    icon={<Phone className='h-4 w-4' />}
                    onSave={saveTenantField}
                    type='tel'
                    placeholder={t('settings.tenant.placeholders.phone')}
                  />
                  <EditableField
                    label={t('settings.tenant.fields.email')}
                    value={tenant?.email || ''}
                    field='email'
                    icon={<Mail className='h-4 w-4' />}
                    onSave={saveTenantField}
                    type='email'
                    placeholder={t('settings.tenant.placeholders.email')}
                  />
                  <EditableField
                    label={t('settings.tenant.fields.website')}
                    value={tenant?.website || ''}
                    field='website'
                    icon={<Globe className='h-4 w-4' />}
                    onSave={saveTenantField}
                    type='url'
                    placeholder={t('settings.tenant.placeholders.website')}
                  />
                  <EditableField
                    label={t('settings.tenant.fields.description')}
                    value={tenant?.description || ''}
                    field='description'
                    icon={<MessageSquare className='h-4 w-4' />}
                    onSave={saveTenantField}
                    type='textarea'
                    placeholder={t(
                      'settings.tenant.placeholders.description',
                    )}
                  />
                </CardContent>
              </Card>

              {/* Stats */}
              {tenant?.stats && (
                <Card className='border-border/50'>
                  <CardHeader className='pb-4'>
                      <CardTitle className='text-lg flex items-center gap-2'>
                      <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                      {t('settings.tenant.stats.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                      <div className='p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30'>
                        <div className='flex items-center gap-2 text-blue-600 dark:text-blue-400'>
                          <Users className='h-4 w-4' />
                          <span className='text-xs font-medium'>
                            {t('settings.tenant.stats.members')}
                          </span>
                        </div>
                        <p className='text-2xl font-bold mt-1'>
                          {tenant.stats.users}
                        </p>
                      </div>
                      <div className='p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30'>
                        <div className='flex items-center gap-2 text-green-600 dark:text-green-400'>
                          <Package className='h-4 w-4' />
                          <span className='text-xs font-medium'>
                            {t('settings.tenant.stats.products')}
                          </span>
                        </div>
                        <p className='text-2xl font-bold mt-1'>
                          {tenant.stats.products}
                        </p>
                      </div>
                      <div className='p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30'>
                        <div className='flex items-center gap-2 text-purple-600 dark:text-purple-400'>
                          <MapPin className='h-4 w-4' />
                          <span className='text-xs font-medium'>
                            {t('settings.tenant.stats.tables')}
                          </span>
                        </div>
                        <p className='text-2xl font-bold mt-1'>
                          {tenant.stats.tables}
                        </p>
                      </div>
                      <div className='p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30'>
                        <div className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
                          <CreditCard className='h-4 w-4' />
                          <span className='text-xs font-medium'>
                            {t('settings.tenant.stats.orders')}
                          </span>
                        </div>
                        <p className='text-2xl font-bold mt-1'>
                          {tenant.stats.orders}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team */}
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Users className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        {t('settings.tenant.team.title')}
                      </CardTitle>
                      <CardDescription>
                        {t('settings.tenant.team.description')}
                      </CardDescription>
                    </div>
                    <Button
                      size='sm'
                      className='gap-2 w-full sm:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white'
                      asChild
                    >
                      <a href={`/${tenantContext?.tenantId}/users`}>
                        <Users className='h-4 w-4' />
                        {t('settings.tenant.team.button')}
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50'>
                    <div className='flex -space-x-3 shrink-0'>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className='h-10 w-10 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-sm font-medium'
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      {(tenant?.stats?.users || 0) > 3 && (
                        <div className='h-10 w-10 rounded-full bg-muted border-2 border-white dark:border-gray-900 flex items-center justify-center text-sm font-medium text-muted-foreground'>
                          +{(tenant?.stats?.users || 0) - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium'>
                        {tenant?.stats?.users || 0}{' '}
                        {t('settings.tenant.team.members.count')}
                        {(tenant?.stats?.users || 0) > 1 ? 's' : ''}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {t('settings.tenant.team.members.helper')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription */}
              <Card className='border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20'>
                <CardHeader className='pb-4'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <CreditCard className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        {t('settings.subscription.title')}
                      </CardTitle>
                      <CardDescription>
                        {t('settings.subscription.description')}
                      </CardDescription>
                    </div>
                    <Badge className='w-fit shrink-0 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'>
                      {t('settings.subscription.badge')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid sm:grid-cols-3 gap-4'>
                    <div className='p-4 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-border/50'>
                      <p className='text-xs text-muted-foreground'>
                        {t('settings.subscription.currentPlan.label')}
                      </p>
                      <p className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                        {t('settings.subscription.currentPlan.value')}
                      </p>
                    </div>
                    <div className='p-4 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-border/50'>
                      <p className='text-xs text-muted-foreground'>
                        {t('settings.subscription.nextInvoice.label')}
                      </p>
                      <p className='text-lg font-bold'>15 000 XOF</p>
                    </div>
                    <div className='p-4 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-border/50'>
                      <p className='text-xs text-muted-foreground'>
                        {t('settings.subscription.renewal.label')}
                      </p>
                      <p className='text-lg font-bold'>15 Fév 2026</p>
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <Button
                      variant='outline'
                      className='flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30'
                    >
                      {t('settings.subscription.actions.invoices')}
                    </Button>
                    <Button className='flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white'>
                      <TrendingUp className='h-4 w-4' />
                      {t('settings.subscription.actions.upgrade')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: Politique de protection des données */}
          <TabsContent key='privacy' value='privacy' className='space-y-6 mt-0'>
            <motion.div
              key='privacy'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <ShieldCheck className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    Politique de protection des données
                  </CardTitle>
                  <CardDescription>
                    Comment nous collectons, utilisons et protégeons vos données
                    personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <section>
                    <h3 className='font-semibold text-foreground mb-2'>
                      1. Données collectées
                    </h3>
                    <p>
                      Nous collectons les informations que vous nous fournissez
                      (nom, email, téléphone, informations de votre
                      établissement) ainsi que les données d&apos;utilisation
                      nécessaires au fonctionnement du service (commandes,
                      stocks, logs techniques).
                    </p>
                  </section>
                  <Separator />
                  <section>
                    <h3 className='font-semibold text-foreground mb-2'>
                      2. Utilisation des données
                    </h3>
                    <p>
                      Vos données sont utilisées pour fournir et améliorer le
                      service Bars (prise de commande, gestion des stocks,
                      facturation), personnaliser votre expérience et vous
                      envoyer des notifications que vous avez acceptées.
                    </p>
                  </section>
                  <Separator />
                  <section>
                    <h3 className='font-semibold text-foreground mb-2'>
                      3. Conservation et sécurité
                    </h3>
                    <p>
                      Les données sont conservées pendant la durée du contrat et
                      selon les obligations légales. Nous mettons en œuvre des
                      mesures techniques et organisationnelles pour protéger vos
                      données contre tout accès non autorisé.
                    </p>
                  </section>
                  <Separator />
                  <section>
                    <h3 className='font-semibold text-foreground mb-2'>
                      4. Vos droits
                    </h3>
                    <p>
                      Conformément au RGPD et aux lois applicables, vous
                      disposez d&apos;un droit d&apos;accès, de rectification,
                      de suppression et de portabilité de vos données.
                      Contactez-nous pour exercer ces droits.
                    </p>
                  </section>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent key='faq' value='faq' className='space-y-6 mt-0'>
            <motion.div
              key='faq'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <HelpCircle className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    Foire aux questions
                  </CardTitle>
                  <CardDescription>
                    Réponses aux questions les plus fréquentes
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {[
                    {
                      q: 'Comment modifier les informations de mon établissement ?',
                      a: "Allez dans l'onglet Établissement, puis cliquez sur « Modifier » à côté du champ à modifier. Enregistrez vos changements.",
                    },
                    {
                      q: 'Comment gérer les stocks de mes produits ?',
                      a: "Utilisez la page Stocks depuis le menu. Vous pouvez ajuster les quantités, consulter l'historique des mouvements et définir des alertes de stock faible.",
                    },
                    {
                      q: 'Comment ajouter un membre à mon équipe ?',
                      a: "Cliquez sur « Gérer l'équipe » dans l'onglet Établissement, puis sur « Ajouter un utilisateur ». Définissez le rôle (Admin, Barman, Serveur).",
                    },
                    {
                      q: 'Comment désactiver les notifications ?',
                      a: "Dans l'onglet Préférences, section Canaux de notification et Notifications de commandes, désactivez les options souhaitées.",
                    },
                    {
                      q: 'Comment contacter le support ?',
                      a: "Utilisez l'onglet « Contactez-nous » ou envoyez un email à l'adresse indiquée. Nous répondons sous 48 h ouvrées.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className='p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40'
                    >
                      <p className='font-semibold text-foreground mb-2'>
                        {item.q}
                      </p>
                      <p className='text-sm text-muted-foreground'>{item.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: Contactez-nous */}
          <TabsContent key='contact' value='contact' className='space-y-6 mt-0'>
            <motion.div
              key='contact'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Mail className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.contact.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.contact.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid sm:grid-cols-2 gap-4'>
                    <div className='flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40'>
                      <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
                        <Mail className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>
                          {t('settings.contact.email.label')}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          support@bars-app.com
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white/60 dark:bg-gray-900/40'>
                      <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
                        <Phone className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>
                          {t('settings.contact.phone.label')}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          +237 XXX XXX XXX
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {t('settings.contact.footer')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab: À propos de nous */}
          <TabsContent key='about' value='about' className='space-y-6 mt-0'>
            <motion.div
              key='about'
              variants={tabVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.2 }}
            >
              <Card className='border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Info className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    {t('settings.about.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('settings.about.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 text-sm text-muted-foreground'>
                  <p>{t('settings.about.appDescription')}</p>
                  <Separator />
                  <p>
                    {t('settings.about.version.label')}{' '}
                    <strong className='text-foreground'>
                      {t('settings.about.version.value')}
                    </strong>
                    {' — '}
                    Développée avec Next.js, TypeScript et une architecture
                    multi-tenant.
                  </p>
                  <p>
                    © {new Date().getFullYear()} Bars.{' '}
                    {t('settings.about.rights')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default withAppLayout(SettingsPage);
