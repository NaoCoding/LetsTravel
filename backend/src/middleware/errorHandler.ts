import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { API_STATUS_CODE, ERROR_MESSAGES } from '../utils/constants';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number = API_STATUS_CODE.INTERNAL_SERVER_ERROR,
    message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as any).requestId;
  let statusCode: number = API_STATUS_CODE.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    // Log operational errors at info level
    if (err.statusCode >= 400 && err.statusCode < 500) {
      logger.warn(`Client error: ${message}`, { path: req.path }, requestId);
    } else {
      logger.error(`Server error: ${message}`, err, { path: req.path }, requestId);
    }
  } else if (err instanceof ZodError) {
    statusCode = API_STATUS_CODE.BAD_REQUEST;
    const errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    
    logger.warn(`Validation error on ${req.path}`, { errors }, requestId);
    
    res.status(statusCode).json({
      error: 'Validation error',
      details: errors,
    });
    return;
  } else {
    // Unknown error
    logger.error(`Unexpected error: ${err.message}`, err, { path: req.path }, requestId);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { requestId }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
