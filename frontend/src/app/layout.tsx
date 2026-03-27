import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootLayoutClient } from '@/components/RootLayoutClient';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'LetsTravel - Trip Planning Made Easy',
  description: 'Plan your trips with flight tracking, hotel bookings, and more',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    startupImage: '/apple-touch-icon.svg',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="mask-icon" href="/mask-icon.svg" color="#3B82F6" />
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
