'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { fetchCurrentSession, isAuthenticated, isLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Éviter la double initialisation en mode strict
    if (initialized.current) return;
    initialized.current = true;

    // Si déjà authentifié (données persistées dans localStorage), ne pas recharger immédiatement
    // mais vérifier quand même la session côté serveur
    const initAuth = async () => {
      try {
        // Appeler /api/auth/me qui lit le cookie httpOnly côté serveur
        await fetchCurrentSession();
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    initAuth();
  }, [fetchCurrentSession]);

  return <>{children}</>;
}
