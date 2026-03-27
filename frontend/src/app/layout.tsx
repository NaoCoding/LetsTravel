import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootLayoutClient } from '@/components/RootLayoutClient';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'LetsTravel - Trip Planning Made Easy',
  description: 'Plan your trips with flight tracking, hotel bookings, and more',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <script async src="https://accounts.google.com/gsi/client"></script>
      </head>
      <body className="bg-gray-50 text-gray-900">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
