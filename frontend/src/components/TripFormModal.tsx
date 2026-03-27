'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { driveAPI } from '@/lib/api';

interface TripFormData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface Trip {
  id?: string;
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

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip: Trip) => void;
  editingTrip?: Trip | null;
  isLoading?: boolean;
}

export default function TripFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingTrip,
  isLoading = false,
}: TripFormModalProps) {
  const { t } = useTranslation('common');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<TripFormData>({
    defaultValues: {
      name: editingTrip?.name || '',
      destination: editingTrip?.destination || '',
      startDate: editingTrip?.startDate?.split('T')[0] || '',
      endDate: editingTrip?.endDate?.split('T')[0] || '',
      notes: editingTrip?.notes || '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    if (editingTrip) {
      reset({
        name: editingTrip.name,
        destination: editingTrip.destination || '',
        startDate: editingTrip.startDate?.split('T')[0] || '',
        endDate: editingTrip.endDate?.split('T')[0] || '',
        notes: editingTrip.notes || '',
      });
    } else {
      reset({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        notes: '',
      });
    }
  }, [editingTrip, isOpen, reset]);

  const onSubmit = async (data: TripFormData) => {
    try {
      // Validate dates
      if (!data.startDate || !data.endDate) {
        toast.error(t('trips.datesRequired'));
        return;
      }

      const startDateObj = new Date(data.startDate);
      const endDateObj = new Date(data.endDate);

      if (endDateObj <= startDateObj) {
        toast.error(t('trips.invalidDateRange'));
        return;
      }

      const tripData: Trip = {
        id: editingTrip?.id || `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        destination: data.destination,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        notes: data.notes || '',
        flights: editingTrip?.flights || [],
        bookings: editingTrip?.bookings || [],
        userId: editingTrip?.userId || '',
      };

      if (editingTrip?.fileId) {
        // Update existing trip
        const response = await driveAPI.updateTrip(editingTrip.fileId, tripData);
        toast.success(t('trips.tripUpdated'));
        onSuccess({ ...tripData, fileId: editingTrip.fileId });
      } else {
        // Create new trip
        const response = await driveAPI.saveTrip(tripData);
        toast.success(t('trips.tripCreated'));
        onSuccess({
          ...tripData,
          fileId: response.data.fileId,
        });
      }

      reset();
      onClose();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast.error(
        editingTrip 
          ? t('trips.failedToUpdateTrip')
          : t('trips.failedToSaveTrip')
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">
            {editingTrip ? t('trips.editTrip') : t('trips.createNewTrip')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isSubmitting || isLoading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          {/* Trip Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('trips.tripName')} *
            </label>
            <input
              {...register('name', { required: t('trips.tripNameRequired') })}
              type="text"
              id="name"
              placeholder={t('trips.tripNamePlaceholder')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              {t('trips.destination')} *
            </label>
            <input
              {...register('destination', { required: t('trips.destinationRequired') })}
              type="text"
              id="destination"
              placeholder={t('trips.destinationPlaceholder')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.destination ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || isLoading}
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('trips.startDate')} *
            </label>
            <input
              {...register('startDate', { required: t('trips.startDateRequired') })}
              type="date"
              id="startDate"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || isLoading}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('trips.endDate')} *
            </label>
            <input
              {...register('endDate', { required: t('trips.endDateRequired') })}
              type="date"
              id="endDate"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || isLoading}
              min={startDate}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('trips.notes')}
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              placeholder={t('trips.notesPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              {t('trips.cancel')}
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {editingTrip ? t('trips.updateTrip') : t('trips.createTrip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
