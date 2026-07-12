import { Request, Response, NextFunction } from 'express';
import { ApiError } from './apiError.util.js';
import logger from './logger.js';
import { isDbUnreachableError } from '../lib/db-health.js';

const AsyncHandler = (
  requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error: any) => {
      // CRITICAL: Let DB connectivity errors pass through UNTOUCHED to the global handler.
      // The global handler will return a clean 503 or serve cached data.
      // Do NOT wrap these in ApiError — that destroys the original error info.
      if (isDbUnreachableError(error)) {
        return next(error);
      }

      if (error instanceof ApiError) {
        if (error.statusCode >= 500) {
          logger.error('AsyncHandler', { message: error.message, stack: error.stack, url: req.originalUrl });
        } else {
          logger.warn('Client error', { statusCode: error.statusCode, message: error.message, url: req.originalUrl });
        }
        return next(error);
      }
      logger.error('Unhandled error in AsyncHandler', { message: error?.message, stack: error?.stack, url: req.originalUrl });
      
      const message = process.env.NODE_ENV === 'development' 
        ? (error?.message || 'Internal Server Error')
        : 'Internal Server Error';
        
      next(new ApiError(500, message));
    });
  };
};

export default AsyncHandler;

// Named export alias for new routes
export { AsyncHandler as asyncHandler };
