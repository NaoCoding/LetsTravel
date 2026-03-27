import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { apiLimiter } from '../middleware/rateLimit';
import { GoogleDriveService } from '../services/driveService';
import { env } from '../config/env';
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

/**
 * Helper: Create a GoogleDriveService instance for the current user
 */
function createUserDriveService(userAccessToken: string): GoogleDriveService {
  // Create a new OAuth2Client for this user
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  // Set this user's credentials
  oauth2Client.setCredentials({ access_token: userAccessToken });

  // Return a new service instance for this user
  return new GoogleDriveService(oauth2Client);
}

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

    // Create service instance for this user
    const driveService = createUserDriveService(req.user.accessToken);

    const fileName = `trip-${trip.id}.json`;
    const fileId = await driveService.saveTrip(trip, fileName);

    res.status(API_STATUS_CODE.CREATED).json({ fileId, trip });
  })
);

// Get all trips from Google Drive with pagination
router.get(
  '/trips',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.accessToken) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        ERROR_MESSAGES.NO_ACCESS_TOKEN
      );
    }

    // Create service instance for this user
    const driveService = createUserDriveService(req.user.accessToken);

    // Extract pagination parameters from query
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 100);
    const pageToken = req.query.pageToken as string | undefined;

    const { trips, nextPageToken } = await driveService.getTrips(pageSize, pageToken);
    res.json({ 
      trips, 
      pagination: {
        pageSize,
        nextPageToken: nextPageToken || null,
      }
    });
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

    // Create service instance for this user
    const driveService = createUserDriveService(req.user.accessToken);

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

    // Create service instance for this user
    const driveService = createUserDriveService(req.user.accessToken);

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

    // Create service instance for this user
    const driveService = createUserDriveService(req.user.accessToken);

    await driveService.deleteTrip(fileId);
    res.json({ message: 'Trip deleted successfully' });
  })
);

export default router;
