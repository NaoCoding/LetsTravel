import {
  type FlightStatus,
  type BookingType,
} from '../utils/constants';

export interface User {
  id: string;
  email: string;
  googleId: string;
  accessToken: string;
  refreshToken?: string;
  createdAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  flights: Flight[];
  bookings: Booking[];
  notes: string;
  fileId?: string; // Google Drive file ID
  createdTime?: string; // Google Drive creation time
  modifiedTime?: string; // Google Drive modification time
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departure: Date | string;
  arrival: Date | string;
  from: string;
  to: string;
  status: FlightStatus;
}

export interface Booking {
  id: string;
  type: BookingType;
  name: string;
  date: Date | string;
  confirmationNumber?: string;
  details: string;
  externalId?: string; // For integration with booking services
}
