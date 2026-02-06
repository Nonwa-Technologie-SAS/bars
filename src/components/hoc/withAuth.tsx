'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WithAuthOptions {
  requiredRole?: string[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      // TODO: Vérifier l'authentification réelle avec JWT
      // Pour l'instant, on simule une vérification
      const checkAuth = async () => {
        // Simuler un délai de vérification
        await new Promise((resolve) => setTimeout(resolve, 500));

        // TODO: Remplacer par une vraie vérification
        const token = localStorage.getItem('auth_token');
        if (!token && options.requiredRole) {
          router.push(options.redirectTo || '/login');
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
