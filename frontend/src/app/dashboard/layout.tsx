'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogOut, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.google?.accounts.id.revoke(user?.email || '', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
  };

  return (
    <ProtectedRoute>
      <div className="grid grid-cols-[250px_1fr]">
        <aside className="bg-gray-900 text-white p-6 min-h-screen flex flex-col">
          <h2 className="text-xl font-bold mb-8">Navigation</h2>
          <nav className="space-y-4 flex-1">
            <Link href="/dashboard" className="block hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/trips" className="block hover:text-blue-400 transition-colors">
              My Trips
            </Link>
            <Link href="/dashboard/flights" className="block hover:text-blue-400 transition-colors">
              Flights
            </Link>
            <Link href="/dashboard/bookings" className="block hover:text-blue-400 transition-colors">
              Bookings
            </Link>
            <Link href="/dashboard/settings" className="block hover:text-blue-400 transition-colors">
              Settings
            </Link>
          </nav>
          
          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-4">
              Signed in as<br />
              <span className="text-white font-medium">{user?.name || user?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>
        <main className="p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
