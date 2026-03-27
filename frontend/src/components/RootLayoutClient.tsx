'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        {children}
      </AuthProvider>
      <Toaster position="top-right" />
    </>
  );
}
