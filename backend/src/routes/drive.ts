import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { apiLimiter } from '../middleware/rateLimit';
import driveService from '../services/driveService';
import {
  SaveTripSchema,
  UpdateTripSchema,
} from '../utils/validation';
import {
  ERROR_MESSAGES,
  API_STATUS_CODE,
} from '../utils/constants';
import type { Trip } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(apiLimiter);

// Save a new trip to Google Drive
router.post(
  '/trips',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = SaveTripSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(API_STATUS_CODE.BAD_REQUEST, 'Invalid trip data');
    }

    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    const { trip } = validation.data;

    // Set user's Google credentials
    await driveService.setCredentials({ access_token: req.user.accessToken });

    const fileName = `trip-${trip.id}.json`;
    const fileId = await driveService.saveTrip(trip, fileName);

    res.status(API_STATUS_CODE.CREATED).json({ fileId, trip });
  })
);

// Get all trips from Google Drive
router.get(
  '/trips',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    await driveService.setCredentials({ access_token: req.user.accessToken });

    const files = await driveService.getTrips();
    res.json({ trips: files });
  })
);

// Get a specific trip
router.get(
  '/trips/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== 'string') {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        'Invalid file ID'
      );
    }

    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    await driveService.setCredentials({ access_token: req.user.accessToken });

    const trip = await driveService.getTrip(fileId);
    res.json(trip);
  })
);

// Update a trip
router.put(
  '/trips/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== 'string') {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        'Invalid file ID'
      );
    }

    const validation = UpdateTripSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(API_STATUS_CODE.BAD_REQUEST, 'Invalid trip data');
    }

    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    const { trip } = validation.data;

    await driveService.setCredentials({ access_token: req.user.accessToken });

    // Cast to Trip type (after Zod validation, we know the structure is valid)
    await driveService.updateTrip(fileId, trip as Trip);
    res.json({ fileId, trip });
  })
);

// Delete a trip
router.delete(
  '/trips/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;

    if (!fileId || typeof fileId !== 'string') {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        'Invalid file ID'
      );
    }

    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    await driveService.setCredentials({ access_token: req.user.accessToken });

    await driveService.deleteTrip(fileId);
    res.json({ message: 'Trip deleted successfully' });
  })
);

export default router;
