import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GoogleDriveService {
  private drive = google.drive({ version: 'v3', auth: oauth2Client });

  async setCredentials(tokens: any) {
    oauth2Client.setCredentials(tokens);
  }

  async saveTrip(tripData: any, fileName: string): Promise<string> {
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

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      return file.data.id || '';
    } catch (err) {
      console.error('Error saving trip to Drive:', err);
      throw err;
    }
  }

  async getTrips(): Promise<any[]> {
    try {
      const res = await this.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name, createdTime, modifiedTime)',
        pageSize: 100,
      });

      return res.data.files || [];
    } catch (err) {
      console.error('Error fetching trips from Drive:', err);
      throw err;
    }
  }

  async getTrip(fileId: string): Promise<any> {
    try {
      const file = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      return file.data;
    } catch (err) {
      console.error('Error fetching trip from Drive:', err);
      throw err;
    }
  }

  async updateTrip(fileId: string, tripData: any): Promise<void> {
    try {
      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(tripData),
      };

      await this.drive.files.update({
        fileId: fileId,
        media: media,
      });
    } catch (err) {
      console.error('Error updating trip in Drive:', err);
      throw err;
    }
  }

  async deleteTrip(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (err) {
      console.error('Error deleting trip from Drive:', err);
      throw err;
    }
  }
}

export default new GoogleDriveService();
