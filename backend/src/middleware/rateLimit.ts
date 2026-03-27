import rateLimit from 'express-rate-limit';
import { API_STATUS_CODE, ERROR_MESSAGES } from '../utils/constants';

// General rate limiter
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

// Auth limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: ERROR_MESSAGES.RATE_LIMITED,
  statusCode: API_STATUS_CODE.RATE_LIMITED,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// API calls limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: ERROR_MESSAGES.RATE_LIMITED,
  statusCode: API_STATUS_CODE.RATE_LIMITED,
  standardHeaders: true,
  legacyHeaders: false,
});
