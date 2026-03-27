'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Verify auth state by checking if we have valid session cookies
    // If httpOnly cookie is valid, the first authenticated request will work
    // If invalid, it will trigger a 401 and redirect to login
    // This approach relies on cookie-based auth rather than localStorage
  }, [setUser, logout]);

  return <>{children}</>;
}
