import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending cookies with requests
  withCredentials: true,
});

// Add access token to requests (fallback for Authorization header)
// Most requests will use httpOnly cookies, but header is kept for flexibility
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - token expired or invalid
    if (error.response?.status === 401) {
      // Try to refresh token
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshResponse = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, {
            withCredentials: true,
          });

          if (refreshResponse.data.token) {
            // Update stored token
            localStorage.setItem('token', refreshResponse.data.token);

            // Retry original request with new token
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // If retry already attempted, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.error('Rate limited. Please try again later.');
    }

    return Promise.reject(error);
  }
);

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
