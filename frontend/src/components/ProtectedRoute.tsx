'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const REDIRECT_TIMEOUT = 5000; // 5 seconds timeout for redirect

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasTimeout, setHasTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isChecking && !isAuthenticated) {
        setHasTimeout(true);
      }
    }, REDIRECT_TIMEOUT);

    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/login');
    } else {
      setIsChecking(false);
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {hasTimeout && (
            <p className="text-red-600 text-sm mt-2">
              Taking longer than expected. <a href="/login" className="underline">Try logging in again</a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
