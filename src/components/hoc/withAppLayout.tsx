'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore, type Tenant, type User } from '@/stores/useAuthStore';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '../dashboard/Header';
import { MobileNav } from '../dashboard/MobileNav';
import { Sidebar } from '../dashboard/Sidebar';

export interface AppLayoutContext {
  tenantId: string;
  user: User;
  tenant: Tenant;
  isLoading: boolean;
  error: string | null;
}

export interface WithAppLayoutOptions {
  /**
   * Si true, redirige vers /auth/login si l'utilisateur n'est pas authentifié
   * @default true
   */
  requireAuth?: boolean;

  /**
   * Si true, affiche un skeleton de chargement pendant l'initialisation
   * @default true
   */
  showLoading?: boolean;

  /**
   * Rôles autorisés à accéder à cette page (vide = tous les rôles)
   * @default []
   */
  allowedRoles?: string[];
}

/**
 * HOC qui enveloppe toutes les pages de l'application avec :
 * - Layout commun (Sidebar + Header)
 * - Gestion de l'authentification
 * - Fourniture des données user/tenant
 * - Gestion des états de chargement et erreurs
 */
export function withAppLayout<P extends object>(
  Component: React.ComponentType<P & { layout: AppLayoutContext }>,
  options: WithAppLayoutOptions = {},
) {
  const { requireAuth = true, showLoading = true, allowedRoles = [] } = options;

  return function AppLayoutComponent(props: P) {
    const params = useParams();
    const router = useRouter();
    const {
      user,
      tenant,
      isLoading,
      error,
      fetchCurrentSession,
      isAuthenticated,
    } = useAuthStore();
    const [isInitializing, setIsInitializing] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);

    const tenantId = params?.tenantId as string;

    // Initialisation : charger la session si nécessaire
    useEffect(() => {
      const init = async () => {
        if (!tenantId) {
          setInitError('Tenant ID manquant');
          setIsInitializing(false);
          return;
        }

        // Si pas de données dans le store, charger la session
        if (!user || !tenant) {
          try {
            await fetchCurrentSession();
          } catch (err) {
            setInitError(
              err instanceof Error
                ? err.message
                : 'Erreur lors du chargement de la session',
            );
          }
        }

        setIsInitializing(false);
      };

      init();
    }, [tenantId, user, tenant, fetchCurrentSession]);

    // Vérification de l'authentification
    useEffect(() => {
      if (!isInitializing && requireAuth) {
        if (!isAuthenticated || !user || !tenant) {
          router.push('/auth/login');
        } else if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(user.role)
        ) {
          router.push(`/${tenantId}/dashboard`);
        }
      }
    }, [
      isInitializing,
      requireAuth,
      isAuthenticated,
      user,
      tenant,
      allowedRoles,
      tenantId,
      router,
    ]);

    // État de chargement
    if (isInitializing || (showLoading && isLoading)) {
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='space-y-4'>
                <Skeleton className='h-8 w-64' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-64 w-full' />
              </div>
            </main>
          </div>
        </div>
      );
    }

    // Erreur d'initialisation
    if (initError || error) {
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  {initError || error || 'Une erreur est survenue'}
                </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      );
    }

    // Vérification des données requises (seulement si requireAuth est true)
    if (requireAuth && (!user || !tenant)) {
      // Si on attend l'authentification mais qu'on n'a pas encore les données,
      // on affiche un loader (la redirection se fera via le useEffect)
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <Alert>
                <Loader2 className='h-4 w-4 animate-spin' />
                <AlertTitle>Chargement...</AlertTitle>
                <AlertDescription>
                  Chargement de vos informations...
                </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      );
    }

    // Vérification du tenant ID
    if (!tenantId) {
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Tenant introuvable</AlertTitle>
              <AlertDescription>
                  L&apos;identifiant du tenant est manquant dans l&apos;URL.
              </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      );
    }

    // Vérification des permissions (rôles)
    if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Accès refusé</AlertTitle>
                <AlertDescription>
                  Vous n&apos;avez pas les permissions nécessaires pour accéder à
                  cette page.
              </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      );
    }

    // Layout complet avec Sidebar + Header + Contenu
    // Si requireAuth est true, user et tenant doivent être définis et valides
    // Si requireAuth est false, on peut avoir des valeurs par défaut pour les pages publiques
    if (requireAuth && (!user || !tenant)) {
      // Double vérification de sécurité avant de rendre
      return (
        <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
          <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
          <div className='flex-1 flex flex-col overflow-hidden'>
            <Header />
            <main className='flex-1 overflow-y-auto p-6'>
              <Alert>
                <Loader2 className='h-4 w-4 animate-spin' />
                <AlertTitle>Chargement...</AlertTitle>
                <AlertDescription>
                  Chargement de vos informations...
                </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      );
    }

    // À ce point, si requireAuth est true, user et tenant sont garantis d'être définis
    // Pour requireAuth false, on peut avoir des objets vides
    const layoutContext: AppLayoutContext = {
      tenantId,
      user: user || ({} as User),
      tenant: tenant || ({} as Tenant),
      isLoading,
      error: initError || error,
    };

    return (
      <div className='flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden'>
        <MobileNav />
        <Sidebar className='hidden md:flex w-64 flex-shrink-0' />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Header />
          <main className='flex-1 overflow-y-auto'>
            <Component {...props} layout={layoutContext} />
          </main>
        </div>
      </div>
    );
  };
}
