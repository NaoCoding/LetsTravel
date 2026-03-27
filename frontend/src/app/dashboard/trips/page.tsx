'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { driveAPI } from '@/lib/api';
import TripFormModal from '@/components/TripFormModal';

interface Trip {
  id: string;
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  flights?: any[];
  bookings?: any[];
  userId?: string;
  fileId?: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface PaginationInfo {
  pageSize: number;
  nextPageToken?: string | null;
}

export default function TripsPage() {
  const { t } = useTranslation('common');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [previousPageTokens, setPreviousPageTokens] = useState<string[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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
      toast.error(t('trips.failedToLoadTrips'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (nextPageToken) {
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

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setIsFormOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsFormOpen(true);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    if (!trip.fileId) {
      toast.error(t('trips.invalidTrip'));
      return;
    }

    const confirmed = window.confirm(
      t('trips.confirmDeleteTrip', { name: trip.name })
    );

    if (!confirmed) return;

    try {
      setIsDeletingId(trip.fileId);
      await driveAPI.deleteTrip(trip.fileId);
      setTrips(trips.filter(t => t.fileId !== trip.fileId));
      toast.success(t('trips.tripDeleted'));
    } catch (error: any) {
      console.error('Failed to delete trip:', error);
      toast.error(t('trips.failedToDeleteTrip'));
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleFormSuccess = (trip: any) => {
    if (editingTrip) {
      // Update existing trip in list
      setTrips(
        trips.map((t) =>
          t.fileId === trip.fileId ? { ...t, ...trip } : t
        )
      );
    } else {
      // Add new trip to list
      setTrips([trip, ...trips]);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const getDaysUntilTrip = (startDate?: string) => {
    if (!startDate) return null;
    try {
      const start = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      const days = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days;
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('trips.title')}</h1>
        <button
          onClick={handleCreateTrip}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + {t('trips.newTrip')}
        </button>
      </div>
      
      {/* Page Size Selector */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
          {t('trips.tripsPerPage')}
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
        <div className="grid gap-4 sm:gap-6 mb-6">
          {trips.map((trip) => {
            const daysUntil = getDaysUntilTrip(trip.startDate);
            return (
              <div 
                key={trip.fileId || trip.id} 
                className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      {trip.name || t('trips.untitledTrip')}
                    </h3>
                    {trip.destination && (
                      <p className="text-sm text-gray-700 mb-2">
                        📍 <span className="font-medium">{trip.destination}</span>
                      </p>
                    )}
                  </div>
                  {daysUntil !== null && daysUntil >= 0 && (
                    <div className="bg-blue-50 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                      {daysUntil === 0 
                        ? t('trips.today')
                        : daysUntil === 1 
                        ? t('trips.tomorrow')
                        : t('trips.daysUntil', { days: daysUntil })
                      }
                    </div>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-gray-600 space-y-1 mb-4 grid grid-cols-2 gap-2">
                  {trip.startDate && (
                    <p>📅 {t('trips.startDate')}: {formatDate(trip.startDate)}</p>
                  )}
                  {trip.endDate && (
                    <p>📅 {t('trips.endDate')}: {formatDate(trip.endDate)}</p>
                  )}
                  {trip.createdTime && (
                    <p className="col-span-2">{t('trips.created')} {formatDate(trip.createdTime)}</p>
                  )}
                </div>

                {trip.notes && (
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-xs sm:text-sm text-gray-700">{trip.notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEditTrip(trip)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition"
                  >
                    {t('trips.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteTrip(trip)}
                    disabled={isDeletingId === trip.fileId}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-sm font-medium transition flex items-center justify-center gap-2"
                  >
                    {isDeletingId === trip.fileId ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {t('trips.deleting')}
                      </>
                    ) : (
                      t('trips.delete')
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Trips State */}
      {!isLoading && trips.length === 0 && (
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-md text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-4">{t('trips.noTrips')}</p>
          <button
            onClick={handleCreateTrip}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {t('trips.createFirstTrip')}
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && trips.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={previousPageTokens.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {t('trips.previous')}
          </button>
          
          <span className="text-xs sm:text-sm text-gray-600">
            {t('trips.showing', { count: trips.length })}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={!nextPageToken}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {t('trips.next')}
          </button>
        </div>
      )}

      {/* Trip Form Modal */}
      <TripFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTrip(null);
        }}
        onSuccess={handleFormSuccess}
        editingTrip={editingTrip || undefined}
      />
    </div>
  );
}
