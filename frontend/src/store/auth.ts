import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (token, refreshToken) =>
    set({ token, refreshToken, isAuthenticated: true }),
  logout: () => set({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  }),
}));
