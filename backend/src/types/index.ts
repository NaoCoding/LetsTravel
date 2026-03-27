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
  startDate: Date;
  endDate: Date;
  flights: Flight[];
  bookings: Booking[];
  notes: string;
  fileId?: string; // Google Drive file ID
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departure: Date;
  arrival: Date;
  from: string;
  to: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
}

export interface Booking {
  id: string;
  type: 'hotel' | 'airbnb' | 'activity' | 'transport' | 'other';
  name: string;
  date: Date;
  confirmationNumber?: string;
  details: string;
  externalId?: string; // For integration with booking services
}
