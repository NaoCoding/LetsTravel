import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Global refresh lock to prevent race conditions
let refreshPromise: Promise<any> | null = null;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending httpOnly cookies with requests
  withCredentials: true,
});

// Handle response errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - token expired or invalid
    if (error.response?.status === 401 && originalRequest) {
      // Prevent multiple refresh attempts
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        // Use global lock to prevent race conditions
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, {
                withCredentials: true,
              });
              // Retry original request with refreshed token (in httpOnly cookie)
              return apiClient(originalRequest);
            } catch (refreshError) {
              // Refresh failed, clear store and redirect to login
              const authStore = useAuthStore.getState();
              authStore.logout();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              refreshPromise = null;
            }
          })();
        }

        return refreshPromise;
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.error('Rate limited. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// Add CSRF token to requests (for state-changing operations)
apiClient.interceptors.request.use((config) => {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
    config.headers['x-csrf-token'] = csrfToken;
  }

  return config;
});


export const authAPI = {
  getAuthUrl: () => apiClient.get('/api/v1/auth/google/url'),
  exchangeCode: (credential: string) =>
    apiClient.post('/api/v1/auth/google/callback', { credential }),
  refreshToken: () => apiClient.post('/api/v1/auth/refresh', {}),
  logout: () => apiClient.post('/api/v1/auth/logout', {}),
};

export const driveAPI = {
  saveTrip: (trip: any) => apiClient.post('/api/v1/drive/trips', { trip }),
  getTrips: () => apiClient.get('/api/v1/drive/trips'),
  getTrip: (fileId: string) => apiClient.get(`/api/v1/drive/trips/${fileId}`),
  updateTrip: (fileId: string, trip: any) =>
    apiClient.put(`/api/v1/drive/trips/${fileId}`, { trip }),
  deleteTrip: (fileId: string) => apiClient.delete(`/api/v1/drive/trips/${fileId}`),
};

export const bookingAPI = {
  searchHotels: (location: string, checkIn: string, checkOut: string) =>
    apiClient.get('/api/v1/bookings/hotels', {
      params: { location, checkIn, checkOut },
    }),
  searchFlights: (from: string, to: string, date: string) =>
    apiClient.get('/api/v1/bookings/flights', {
      params: { from, to, date },
    }),
  getFlightStatus: (flightNumber: string) =>
    apiClient.get(`/api/v1/bookings/flights/${flightNumber}`),
};
