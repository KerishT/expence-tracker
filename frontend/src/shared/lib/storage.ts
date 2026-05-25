// Zustand persist (key='auth') stores: { state: { token, user, isAuthenticated }, version }
const PERSIST_KEY = 'auth';

export const storage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
      return parsed?.state?.token ?? null;
    } catch {
      return null;
    }
  },
};
