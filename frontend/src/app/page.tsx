'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { t } = useTranslation('common');
  const [menuOpen, setMenuOpen] = useState(false);

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
      setMenuOpen(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(t('home.errorSigningOut'));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Plane className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className="text-xs sm:text-sm text-gray-700 max-w-[150px] truncate">
                  {t('common.welcome')}, {user?.name || user?.email}
                </span>
                <Link
                  href="/dashboard"
                  className="px-3 sm:px-6 py-2 text-xs sm:text-base text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('common.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-xs sm:text-base"
                >
                  {t('common.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 sm:px-6 py-2 text-xs sm:text-base text-gray-700 hover:text-gray-900 font-medium"
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  href="/login"
                  className="px-3 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-xs sm:text-base"
                >
                  {t('common.getStarted')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <div className="mb-4">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-gray-700 py-2">
                    {t('common.welcome')}, {user?.name || user?.email}
                  </p>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    {t('common.dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    {t('common.signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    {t('common.signIn')}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center"
                  >
                    {t('common.getStarted')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('home.pageTitle')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8">
            {t('home.pageSubtitle')}
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-base sm:text-lg transition-colors"
          >
            {isAuthenticated ? t('common.goToDashboard') : t('common.startPlanning')}
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
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
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl sm:text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
