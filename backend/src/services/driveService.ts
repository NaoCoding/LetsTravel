import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../middleware/errorHandler';
import { API_STATUS_CODE } from '../utils/constants';
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

  constructor(private oauth2Client: OAuth2Client) {
    // Each instance has its own authorized drive client
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async saveTrip(tripData: Trip, fileName: string): Promise<string> {
    try {
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: ['appDataFolder'],
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(tripData),
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
      console.error('Error saving trip to Drive:', err);
      
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

  async getTrips(): Promise<Trip[]> {
    try {
      const res = await retryWithBackoff(async () => {
        return await this.drive.files.list({
          spaces: 'appDataFolder',
          fields: 'files(id, name, createdTime, modifiedTime)',
          pageSize: 100,
        });
      });

      return (res.data.files || []) as Trip[];
    } catch (err: any) {
      console.error('Error fetching trips from Drive:', err);
      
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
      console.error('Error fetching trip from Drive:', err);
      
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
      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(tripData),
      };

      await retryWithBackoff(async () => {
        return await this.drive.files.update({
          fileId: fileId,
          media: media,
        });
      });
    } catch (err: any) {
      console.error('Error updating trip in Drive:', err);
      
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
      console.error('Error deleting trip from Drive:', err);
      
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
