import rateLimit from 'express-rate-limit';
import { API_STATUS_CODE, ERROR_MESSAGES } from '../utils/constants';

// General rate limiter - allows more requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: ERROR_MESSAGES.RATE_LIMITED,
  statusCode: API_STATUS_CODE.RATE_LIMITED,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Auth limiter - stricter but more forgiving
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 attempts (increased from 5 to account for retries)
  message: ERROR_MESSAGES.RATE_LIMITED,
  statusCode: API_STATUS_CODE.RATE_LIMITED,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Consider using a custom key function to rate limit by user ID instead of IP
  // This would require authenticated store or mapping of IPs to user IDs
});

// API calls limiter - moderate rate
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: ERROR_MESSAGES.RATE_LIMITED,
  statusCode: API_STATUS_CODE.RATE_LIMITED,
  standardHeaders: true,
  legacyHeaders: false,
});
