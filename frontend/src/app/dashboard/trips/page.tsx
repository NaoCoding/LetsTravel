'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { driveAPI } from '@/lib/api';

interface Trip {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface PaginationInfo {
  pageSize: number;
  nextPageToken?: string | null;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);

  useEffect(() => {
    fetchTrips();
  }, [pageSize]);

  const fetchTrips = async (token?: string) => {
    try {
      setIsLoading(true);
      const response = await driveAPI.getTrips(pageSize, token);
      
      if (response.data) {
        setTrips(response.data.trips);
        setNextPageToken(response.data.pagination?.nextPageToken || null);
      }
    } catch (error: any) {
      console.error('Failed to fetch trips:', error);
      toast.error('Failed to load trips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (nextPageToken) {
      // Save current page token for going back
      setPreviousPageTokens([...previousPageTokens, '']);
      fetchTrips(nextPageToken);
    }
  };

  const handlePreviousPage = () => {
    if (previousPageTokens.length > 0) {
      const newPreviousTokens = [...previousPageTokens];
      newPreviousTokens.pop();
      setPreviousPageTokens(newPreviousTokens);
      
      const prevToken = newPreviousTokens.length > 0 ? newPreviousTokens[newPreviousTokens.length - 1] : undefined;
      setNextPageToken(null);
      fetchTrips(prevToken);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Trips</h1>
      
      {/* Page Size Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
          Trips per page:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setPreviousPageTokens([]);
            setNextPageToken(null);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Trips Grid */}
      {!isLoading && trips.length > 0 && (
        <div className="grid gap-6 mb-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">{trip.name || 'Untitled Trip'}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Created: {formatDate(trip.createdTime)}</p>
                <p>Modified: {formatDate(trip.modifiedTime)}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  View
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Trips State */}
      {!isLoading && trips.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">No trips yet. Create your first trip!</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && trips.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={previousPageTokens.length === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Showing {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={!nextPageToken}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
