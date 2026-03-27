/* eslint-disable @next/next/no-img-element */

'use client';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <a
        href="/dashboard"
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
