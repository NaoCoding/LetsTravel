import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { API_STATUS_CODE, ERROR_MESSAGES } from '../utils/constants';

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
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = API_STATUS_CODE.INTERNAL_SERVER_ERROR;
  let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = API_STATUS_CODE.BAD_REQUEST;
    const errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(statusCode).json({
      error: 'Validation error',
      details: errors,
    });
    return;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', {
      statusCode,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    error: message,
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
