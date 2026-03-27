'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { t } = useTranslation('common');

  const handleLogout = () => {
    logout();
    window.google?.accounts.id.revoke(user?.email || '', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
  };

  const navigationItems = [
    { href: '/dashboard', label: t('navigation.dashboard') },
    { href: '/dashboard/trips', label: t('navigation.myTrips') },
    { href: '/dashboard/flights', label: t('navigation.flights') },
    { href: '/dashboard/bookings', label: t('navigation.bookings') },
    { href: '/dashboard/settings', label: t('navigation.settings') },
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col md:grid md:grid-cols-[250px_1fr] min-h-screen">
        {/* Mobile header with hamburger */}
        <div className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
          <h1 className="text-lg font-bold">{t('common.appName')}</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-0 z-40 md:z-auto
            bg-gray-900 text-white p-6 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            w-[250px] min-h-screen
          `}
        >
          <h2 className="text-xl font-bold mb-8 hidden md:block">{t('dashboard.navigation')}</h2>
          <nav className="space-y-4 flex-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-blue-400 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-700 pt-4">
            <div className="mb-4">
              <LanguageSwitcher />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t('navigation.signedInAs')}<br />
              <span className="text-white font-medium truncate">{user?.name || user?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm md:text-base"
            >
              <LogOut className="w-4 h-4" />
              {t('common.signOut')}
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
