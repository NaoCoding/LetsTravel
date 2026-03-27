'use client';

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/AuthProvider';
import { I18nProvider } from '@/lib/i18n';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <I18nProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </I18nProvider>
      <Toaster position="top-right" />
    </>
  );
}
