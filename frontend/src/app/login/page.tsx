'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation('common');

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
          </Link>
          <div className="space-x-4 flex items-center">
            <LanguageSwitcher />
            <Link
              href="/"
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </nav>
      </header>

      {/* Login Section */}
      <section className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
              <p className="text-gray-600">
                {t('login.subtitle')}
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-t border-gray-200 pt-6">
                <GoogleSignIn />
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('common.browseAsGuest')}</span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full block px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 text-center transition-colors"
              >
                {t('common.browseAsGuest')}
              </Link>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              {t('common.bySigningIn')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                {t('common.termsOfService')}
              </a>{' '}
              {t('common.and')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                {t('common.privacyPolicy')}
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
