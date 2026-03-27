import type { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[250px_1fr]">
      <aside className="bg-gray-900 text-white p-6 min-h-screen">
        <h2 className="text-xl font-bold mb-8">Navigation</h2>
        <nav className="space-y-4">
          <a href="/dashboard" className="block hover:text-blue-400">Dashboard</a>
          <a href="/dashboard/trips" className="block hover:text-blue-400">My Trips</a>
          <a href="/dashboard/flights" className="block hover:text-blue-400">Flights</a>
          <a href="/dashboard/bookings" className="block hover:text-blue-400">Bookings</a>
          <a href="/dashboard/settings" className="block hover:text-blue-400">Settings</a>
        </nav>
      </aside>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
