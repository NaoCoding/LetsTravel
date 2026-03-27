import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, requestId, data, error } = entry;
    const requestInfo = requestId ? ` [${requestId}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const errorStr = error ? `\n${error}` : '';
    
    return `[${timestamp}] ${level}${requestInfo}: ${message}${dataStr}${errorStr}`;
  }

  private log(entry: LogEntry): void {
    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.log(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, data?: any, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
      requestId,
    });
  }

  info(message: string, data?: any, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
      requestId,
    });
  }

  warn(message: string, data?: any, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
      requestId,
    });
  }

  error(message: string, error?: Error, data?: any, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data,
      error: error?.stack,
      requestId,
    });
  }
}

export const logger = new Logger();

/**
 * Middleware to add request ID and log HTTP requests
 */
export function requestLoggingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Generate or get request ID
  const requestId = req.get('x-request-id') || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;

  logger.debug(
    `Incoming ${req.method} ${req.path}`,
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    requestId
  );

  next();
}
