import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/entities/user/model/types';
import type { AuthResponse } from '@/shared/api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
}

interface AuthActions {
  setSession: (response: AuthResponse) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setSession: ({ accessToken, user }) =>
        set({ token: accessToken, user, isAuthenticated: true }),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
