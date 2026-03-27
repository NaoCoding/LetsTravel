import React from 'react';

interface TripsPageProps {}

export default function TripsPage({}: TripsPageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Trips</h1>
      <div className="grid gap-6">
        {/* Trip cards will be rendered here */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">No trips yet. Create your first trip!</p>
        </div>
      </div>
    </div>
  );
}
