import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { ERROR_MESSAGES, API_STATUS_CODE, COOKIE_NAMES } from '../utils/constants';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        accessToken?: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Try to get token from httpOnly cookie first, then from Authorization header
    let token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.MISSING_AUTH_TOKEN
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      accessToken: decoded.accessToken,
    };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(API_STATUS_CODE.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_AUTH_TOKEN });
    } else {
      res.status(API_STATUS_CODE.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_AUTH_TOKEN });
    }
  }
};
