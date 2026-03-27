'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">Something went wrong!</h1>
        <p className="text-gray-600 mt-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
