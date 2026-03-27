// Flight statuses
export const FLIGHT_STATUS = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  DEPARTED: 'departed',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
} as const;

export type FlightStatus = (typeof FLIGHT_STATUS)[keyof typeof FLIGHT_STATUS];

// Booking types
export const BOOKING_TYPE = {
  HOTEL: 'hotel',
  AIRBNB: 'airbnb',
  ACTIVITY: 'activity',
  TRANSPORT: 'transport',
  OTHER: 'other',
} as const;

export type BookingType = (typeof BOOKING_TYPE)[keyof typeof BOOKING_TYPE];

// Google OAuth scopes
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MISSING_AUTH_TOKEN: 'Access token required',
  INVALID_AUTH_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  MISSING_PARAMS: 'Missing required parameters',
  INVALID_GOOGLE_TOKEN: 'Invalid ID token',
  AUTH_FAILED: 'Authentication failed',
  NO_ACCESS_TOKEN: 'No access token available',
  FAILED_SIGN_IN: 'Failed to sign in',
  RATE_LIMITED: 'Too many requests, please try again later',
} as const;

// API response codes
export const API_STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
