import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { API_STATUS_CODE } from '../utils/constants';
import { AppError } from './errorHandler';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to provide CSRF token in cookies
 */
export function csrfTokenProvider(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate CSRF token if not already present
  let csrfToken = _req.cookies[CSRF_TOKEN_COOKIE];
  
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false, // Allow JavaScript to read CSRF token
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
  }
  
  next();
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

  const cookieToken = req.cookies[CSRF_TOKEN_COOKIE];
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
