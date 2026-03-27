import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Global variables for CSRF token management
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;
let refreshPromise: Promise<any> | null = null;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending httpOnly cookies with requests
  withCredentials: true,
  // Add timeout configuration (10 seconds)
  timeout: 10000,
});

// Function to fetch CSRF token from backend
async function fetchCSRFToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  // Prevent multiple simultaneous requests
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/csrf-token`, {
        withCredentials: true,
      });
      csrfToken = response.data.csrfToken;
      if (!csrfToken) {
        throw new Error('No CSRF token in response');
      }
      return csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return await csrfTokenPromise;
}

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
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      console.warn(`Rate limited. Please retry after ${waitTime}ms`);
    }

    return Promise.reject(error);
  }
);

// Add CSRF token to requests (for state-changing operations)
apiClient.interceptors.request.use(async (config) => {
  // For state-changing operations, include CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
    try {
      const token = await fetchCSRFToken();
      config.headers['x-csrf-token'] = token;
    } catch (error) {
      console.error('Failed to include CSRF token:', error);
    }
  }

  return config;
});


export const authAPI = {
  getAuthUrl: () => apiClient.get('/api/v1/auth/google/url'),
  exchangeCode: (code: string) =>
    apiClient.post('/api/v1/auth/google/callback', { code }),
  refreshToken: () => apiClient.post('/api/v1/auth/refresh', {}),
  logout: () => apiClient.post('/api/v1/auth/logout', {}),
};

export const driveAPI = {
  saveTrip: (trip: any) => apiClient.post('/api/v1/drive/trips', { trip }),
  getTrips: (pageSize: number = 10, pageToken?: string) => 
    apiClient.get('/api/v1/drive/trips', {
      params: {
        ...(pageSize && { pageSize }),
        ...(pageToken && { pageToken }),
      }
    }),
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
