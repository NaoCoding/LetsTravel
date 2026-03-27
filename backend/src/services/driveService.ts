import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../middleware/errorHandler';
import { API_STATUS_CODE } from '../utils/constants';
import { logger } from '../utils/logger';
import { FILE_SIZE_LIMITS } from '../config/env';
import type { Trip } from '../types';

// Helper for exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (attempt === retries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * GoogleDriveService - Handles Google Drive operations
 * Each instance has its own OAuth2Client to avoid concurrency issues
 */
export class GoogleDriveService {
  private drive: ReturnType<typeof google.drive>;
  private tripsFolderIdCache: string | null = null;

  constructor(private oauth2Client: OAuth2Client) {
    // Each instance has its own authorized drive client
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get or create the "LetsTravel Trips" folder in user's Google Drive
   */
  private async getOrCreateTripsFolder(): Promise<string> {
    // Return cached folder ID if available
    if (this.tripsFolderIdCache) {
      return this.tripsFolderIdCache;
    }

    try {
      // Search for existing "LetsTravel Trips" folder
      const searchRes = await retryWithBackoff(async () => {
        return await this.drive.files.list({
          q: "name='LetsTravel Trips' and mimeType='application/vnd.google-apps.folder' and trashed=false",
          spaces: 'drive',
          fields: 'files(id)',
          pageSize: 1,
        });
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        const folderId = searchRes.data.files[0].id!;
        this.tripsFolderIdCache = folderId;
        return folderId;
      }

      // Folder doesn't exist, create it
      const createRes = await retryWithBackoff(async () => {
        return await this.drive.files.create({
          requestBody: {
            name: 'LetsTravel Trips',
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
        });
      });

      if (!createRes.data.id) {
        throw new AppError(
          API_STATUS_CODE.INTERNAL_SERVER_ERROR,
          'Failed to create LetsTravel Trips folder'
        );
      }

      this.tripsFolderIdCache = createRes.data.id;
      return createRes.data.id;
    } catch (err: any) {
      logger.error('Error getting or creating trips folder', err);
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to access LetsTravel Trips folder'
      );
    }
  }

  async saveTrip(tripData: Trip, fileName: string): Promise<string> {
    try {
      // Validate file size before sending to Google Drive
      const fileContent = JSON.stringify(tripData);
      const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');
      
      if (fileSizeBytes > FILE_SIZE_LIMITS.MAX_TRIP_FILE_SIZE) {
        const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
        throw new AppError(
          API_STATUS_CODE.BAD_REQUEST,
          `Trip file size (${sizeMB}MB) exceeds maximum allowed size (10MB)`
        );
      }

      // Get or create the LetsTravel Trips folder
      const folderId = await this.getOrCreateTripsFolder();

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/json',
        body: fileContent,
      };

      const file = await retryWithBackoff(async () => {
        return await this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });
      });

      if (!file.data.id) {
        throw new AppError(
          API_STATUS_CODE.INTERNAL_SERVER_ERROR,
          'Failed to create trip file in Google Drive'
        );
      }

      return file.data.id;
    } catch (err: any) {
      logger.error('Error saving trip to Drive', err);
      
      if (err instanceof AppError) {
        throw err;
      }
      
      if (err.status === 403) {
        throw new AppError(
          API_STATUS_CODE.INTERNAL_SERVER_ERROR,
          'Google Drive quota exceeded. Please try again later.'
        );
      }
      
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to save trip to Google Drive'
      );
    }
  }

  async getTrips(
    pageSize: number = 10,
    pageToken?: string
  ): Promise<{ trips: Trip[]; nextPageToken?: string }> {
    try {
      // Get the LetsTravel Trips folder
      const folderId = await this.getOrCreateTripsFolder();

      const res = await retryWithBackoff(async () => {
        return await this.drive.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          spaces: 'drive',
          fields: 'files(id, name, createdTime, modifiedTime), nextPageToken',
          pageSize: Math.min(pageSize, 100), // Cap at 100 to respect Google Drive API limits
          pageToken,
          orderBy: 'modifiedTime desc',
        });
      });

      // Fetch the content of each trip file
      const trips: Trip[] = [];
      
      if (res.data.files && res.data.files.length > 0) {
        for (const file of res.data.files) {
          try {
            if (!file.id) continue; // Skip files without ID
            
            // Fetch the actual trip data from the file
            const tripContent = await retryWithBackoff(async () => {
              return await this.drive.files.get({
                fileId: file.id!,
                alt: 'media',
              });
            });
            
            // Add file metadata to the trip data
            const tripData = tripContent.data as Trip;
            tripData.fileId = file.id || undefined;
            if (file.createdTime) tripData.createdTime = file.createdTime;
            if (file.modifiedTime) tripData.modifiedTime = file.modifiedTime;
            
            trips.push(tripData);
          } catch (err) {
            logger.warn(`Failed to fetch content for trip file ${file.id}`, err);
            // Continue with next file instead of failing completely
          }
        }
      }

      return {
        trips,
        nextPageToken: res.data.nextPageToken || undefined,
      };
    } catch (err: any) {
      logger.error('Error fetching trips from Drive', err);
      
      if (err instanceof AppError) {
        throw err;
      }
      
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to fetch trips from Google Drive'
      );
    }
  }

  async getTrip(fileId: string): Promise<Trip> {
    try {
      const file = await retryWithBackoff(async () => {
        return await this.drive.files.get({
          fileId: fileId,
          alt: 'media',
        });
      });

      return file.data as Trip;
    } catch (err: any) {
      logger.error('Error fetching trip from Drive', err);
      
      if (err instanceof AppError) {
        throw err;
      }
      
      if (err.status === 404) {
        throw new AppError(
          API_STATUS_CODE.NOT_FOUND,
          'Trip not found in Google Drive'
        );
      }
      
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to fetch trip from Google Drive'
      );
    }
  }

  async updateTrip(fileId: string, tripData: Trip): Promise<void> {
    try {
      const fileContent = JSON.stringify(tripData);
      const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');
      
      // Validate file size
      if (fileSizeBytes > FILE_SIZE_LIMITS.MAX_TRIP_FILE_SIZE) {
        const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
        throw new AppError(
          API_STATUS_CODE.BAD_REQUEST,
          `Trip file size (${sizeMB}MB) exceeds maximum allowed size (10MB)`
        );
      }

      const media = {
        mimeType: 'application/json',
        body: fileContent,
      };

      await retryWithBackoff(async () => {
        return await this.drive.files.update({
          fileId: fileId,
          media: media,
        });
      });
    } catch (err: any) {
      logger.error('Error updating trip in Drive', err);
      
      if (err instanceof AppError) {
        throw err;
      }
      
      if (err.status === 404) {
        throw new AppError(
          API_STATUS_CODE.NOT_FOUND,
          'Trip not found in Google Drive'
        );
      }
      
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to update trip in Google Drive'
      );
    }
  }

  async deleteTrip(fileId: string): Promise<void> {
    try {
      await retryWithBackoff(async () => {
        return await this.drive.files.delete({
          fileId: fileId,
        });
      });
    } catch (err: any) {
      logger.error('Error deleting trip from Drive', err);
      
      if (err instanceof AppError) {
        throw err;
      }
      
      if (err.status === 404) {
        throw new AppError(
          API_STATUS_CODE.NOT_FOUND,
          'Trip not found in Google Drive'
        );
      }
      
      throw new AppError(
        API_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to delete trip from Google Drive'
      );
    }
  }
}
