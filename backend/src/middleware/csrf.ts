import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { API_STATUS_CODE } from '../utils/constants';
import { AppError } from './errorHandler';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to provide CSRF token in httpOnly cookie
 * The token value is also stored in res.locals for endpoint that returns it
 */
export function csrfTokenProvider(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get existing token from cookie or generate new one
  let csrfToken = req.cookies['csrf-token'];
  
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
  }

  // Set httpOnly cookie (JavaScript cannot read CSRF token)
  res.cookie('csrf-token', csrfToken, {
    httpOnly: true,        // JavaScript cannot access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',    // Only send same-site requests
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  // Store in res.locals for getCsrfToken endpoint
  res.locals.csrfToken = csrfToken;

  next();
}

/**
 * GET endpoint to retrieve CSRF token for frontend
 */
export function getCsrfToken(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.json({ csrfToken: res.locals.csrfToken });
}

/**
 * Middleware to verify CSRF token (for state-changing requests)
 */
export function verifyCSRFToken(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for auth endpoints (they use Google's signed token)
  if (req.path.includes('/auth/')) {
    return next();
  }

  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    throw new AppError(
      API_STATUS_CODE.FORBIDDEN,
      'CSRF token missing'
    );
  }

  if (cookieToken !== headerToken) {
    throw new AppError(
      API_STATUS_CODE.FORBIDDEN,
      'CSRF token mismatch'
    );
  }

  next();
}
