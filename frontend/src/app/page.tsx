'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'i18next/react';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t } = useTranslation('common');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await authAPI.logout();

      // Clear local state
      logout();

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Revoke Google session
      if (user?.email && window.google) {
        window.google.accounts.id.revoke(user.email, () => {
          console.log('Google session revoked');
        });
      }

      toast.success(t('home.youHaveBeenSignedOut'));
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(t('home.errorSigningOut'));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
          </div>
          <div className="space-x-4 flex items-center">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">
                  {t('common.welcome')}, {user?.name || user?.email}
                </span>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('common.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  {t('common.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {t('common.getStarted')}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('home.pageTitle')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('home.pageSubtitle')}
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            {isAuthenticated ? t('common.goToDashboard') : t('common.startPlanning')}
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            {
              title: t('home.flightTracking'),
              description: t('home.flightTrackingDesc'),
              icon: '✈️',
            },
            {
              title: t('home.tripOrganization'),
              description: t('home.tripOrganizationDesc'),
              icon: '📅',
            },
            {
              title: t('home.googleDriveStorage'),
              description: t('home.googleDriveStorageDesc'),
              icon: '☁️',
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
