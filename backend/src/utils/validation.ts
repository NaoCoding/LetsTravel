import { z } from 'zod';
import { FLIGHT_STATUS, BOOKING_TYPE } from './constants';

// Auth validation schemas
export const GoogleCallbackSchema = z.object({
  code: z.string().optional(),
  credential: z.string().optional(),
}).refine(
  (data) => data.code || data.credential,
  { message: 'Either code or credential is required' }
);

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Flight search validation
export const FlightSearchSchema = z.object({
  from: z.string().min(1, 'Departure airport code is required').toUpperCase(),
  to: z.string().min(1, 'Arrival airport code is required').toUpperCase(),
  date: z.string().datetime('Invalid date format'),
});

// Hotel search validation
export const HotelSearchSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  checkIn: z.string().datetime('Invalid check-in date format'),
  checkOut: z.string().datetime('Invalid check-out date format'),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: 'Check-out date must be after check-in date' }
);

// Trip validation schemas
export const FlightSchema = z.object({
  id: z.string(),
  flightNumber: z.string().min(1, 'Flight number is required'),
  airline: z.string().min(1, 'Airline is required'),
  departure: z.string().datetime().or(z.date()),
  arrival: z.string().datetime().or(z.date()),
  from: z.string().min(1, 'Departure location is required'),
  to: z.string().min(1, 'Arrival location is required'),
  status: z.enum([
    FLIGHT_STATUS.SCHEDULED,
    FLIGHT_STATUS.BOARDING,
    FLIGHT_STATUS.DEPARTED,
    FLIGHT_STATUS.ARRIVED,
    FLIGHT_STATUS.CANCELLED,
  ]).default(FLIGHT_STATUS.SCHEDULED),
});

export const BookingSchema = z.object({
  id: z.string(),
  type: z.enum([
    BOOKING_TYPE.HOTEL,
    BOOKING_TYPE.AIRBNB,
    BOOKING_TYPE.ACTIVITY,
    BOOKING_TYPE.TRANSPORT,
    BOOKING_TYPE.OTHER,
  ]),
  name: z.string().min(1, 'Booking name is required'),
  date: z.string().datetime().or(z.date()),
  confirmationNumber: z.string().optional(),
  details: z.string().min(1, 'Booking details are required'),
  externalId: z.string().optional(),
});

export const TripBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, 'Trip name is required'),
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  flights: z.array(FlightSchema).default([]),
  bookings: z.array(BookingSchema).default([]),
  notes: z.string().default(''),
  fileId: z.string().optional(),
});

export const TripSchema = TripBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date' }
);

export const SaveTripSchema = z.object({
  trip: TripSchema,
});

export const UpdateTripSchema = z.object({
  trip: TripBaseSchema.partial().refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: 'End date must be after start date' }
  ),
});

// Type exports
export type GoogleCallbackInput = z.infer<typeof GoogleCallbackSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type FlightSearchInput = z.infer<typeof FlightSearchSchema>;
export type HotelSearchInput = z.infer<typeof HotelSearchSchema>;
export type TripInput = z.infer<typeof TripSchema>;
export type SaveTripInput = z.infer<typeof SaveTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
export type FlightInput = z.infer<typeof FlightSchema>;
export type BookingInput = z.infer<typeof BookingSchema>;
