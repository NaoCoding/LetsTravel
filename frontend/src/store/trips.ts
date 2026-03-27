import { create } from 'zustand';

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

export interface Trip {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  destination: string;
  flights: Flight[];
  bookings: Booking[];
  notes: string;
}

export interface Booking {
  id: string;
  type: 'hotel' | 'airbnb' | 'activity' | 'transport' | 'other';
  name: string;
  date: Date;
  confirmationNumber?: string;
  details: string;
}

interface TripStore {
  trips: Trip[];
  currentTrip: Trip | null;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, trip: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  addFlight: (tripId: string, flight: Flight) => void;
  addBooking: (tripId: string, booking: Booking) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  currentTrip: null,
  addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  updateTrip: (tripId, updates) =>
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === tripId ? { ...trip, ...updates } : trip
      ),
    })),
  deleteTrip: (tripId) =>
    set((state) => ({
      trips: state.trips.filter((trip) => trip.id !== tripId),
    })),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  addFlight: (tripId, flight) =>
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === tripId
          ? { ...trip, flights: [...trip.flights, flight] }
          : trip
      ),
    })),
  addBooking: (tripId, booking) =>
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === tripId
          ? { ...trip, bookings: [...trip.bookings, booking] }
          : trip
      ),
    })),
}));
