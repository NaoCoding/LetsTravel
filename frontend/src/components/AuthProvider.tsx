'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import type { AuthUser } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setTokens } = useAuthStore();

  useEffect(() => {
    // Restore auth state from localStorage
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user: AuthUser = JSON.parse(userStr);
        setUser(user);
        setTokens(token, refreshToken || undefined);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }, [setUser, setTokens]);

  return <>{children}</>;
}
