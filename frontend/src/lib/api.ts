import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add access token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('googleAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  getAuthUrl: () => apiClient.get('/auth/google/url'),
  exchangeCode: (code: string) => apiClient.post('/auth/google/callback', { code }),
  logout: () => apiClient.post('/auth/logout'),
};

export const driveAPI = {
  saveTrip: (trip: any) => apiClient.post('/drive/trips', trip),
  getTrips: () => apiClient.get('/drive/trips'),
  updateTrip: (tripId: string, trip: any) =>
    apiClient.put(`/drive/trips/${tripId}`, trip),
  deleteTrip: (tripId: string) => apiClient.delete(`/drive/trips/${tripId}`),
};

export const bookingAPI = {
  searchHotels: (query: string, dates: any) =>
    apiClient.get('/bookings/hotels', { params: { query, dates } }),
  searchFlights: (from: string, to: string, dates: any) =>
    apiClient.get('/bookings/flights', { params: { from, to, dates } }),
};
