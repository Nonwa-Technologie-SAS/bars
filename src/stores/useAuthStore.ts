import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  stats?: {
    users: number;
    products: number;
    tables: number;
    orders: number;
  };
}

interface AuthState {
  // State
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  updateUser: (updates: Partial<User>) => void;
  updateTenant: (updates: Partial<Tenant>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, tenant: Tenant) => void;
  logout: () => void;
  
  // Async actions
  fetchUserAndTenant: (tenantId: string, userId: string) => Promise<void>;
  fetchCurrentSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTenant: (tenant) => set({ tenant }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      updateTenant: (updates) =>
        set((state) => ({
          tenant: state.tenant ? { ...state.tenant, ...updates } : null,
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Login
      login: (user, tenant) =>
        set({
          user,
          tenant,
          isAuthenticated: true,
          error: null,
        }),

      // Logout
      logout: () =>
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          error: null,
        }),

      // Fetch user and tenant data
      fetchUserAndTenant: async (tenantId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Fetch user
          const userRes = await fetch(`/api/${tenantId}/users/${userId}`);
          if (!userRes.ok) throw new Error('Erreur lors de la récupération de l\'utilisateur');
          const userData = await userRes.json();

          // Fetch tenant
          const tenantRes = await fetch(`/api/${tenantId}/tenant`);
          if (!tenantRes.ok) throw new Error('Erreur lors de la récupération de l\'établissement');
          const tenantData = await tenantRes.json();

          set({
            user: userData.data || null,
            tenant: tenantData.tenant || null,
            isAuthenticated: !!userData.data,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur inconnue';
          set({ error: message, isLoading: false });
        }
      },

      // Fetch current session from /api/auth/me (uses httpOnly cookie)
      fetchCurrentSession: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/me');
          if (!res.ok) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
          
          const data = await res.json();
          
          if (data.authenticated && data.user && data.tenant) {
            set({
              user: data.user,
              tenant: data.tenant,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              tenant: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching session:', error);
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            error: error instanceof Error ? error.message : 'Erreur de session',
          });
        }
      },

      // Refresh user data
      refreshUser: async () => {
        const { user, tenant } = get();
        if (!user || !tenant) return;

        try {
          const res = await fetch(`/api/${tenant.id}/users/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              set({ user: data.data });
            }
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },

      // Refresh tenant data
      refreshTenant: async () => {
        const { tenant } = get();
        if (!tenant) return;

        try {
          const res = await fetch(`/api/${tenant.id}/tenant`);
          if (res.ok) {
            const data = await res.json();
            if (data.tenant) {
              set({ tenant: data.tenant });
            }
          }
        } catch (error) {
          console.error('Error refreshing tenant:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks pour optimiser les re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useTenant = () => useAuthStore((state) => state.tenant);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
