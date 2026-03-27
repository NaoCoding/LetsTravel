import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import driveService from '../services/driveService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Save a new trip to Google Drive
router.post('/trips', async (req: Request, res: Response) => {
  try {
    const { trip } = req.body;

    if (!req.user?.accessToken) {
      res.status(401).json({ error: 'No access token' });
    } else {
      // Set user's Google credentials
      await driveService.setCredentials({ access_token: req.user.accessToken });

      const fileName = `trip-${trip.id}.json`;
      const fileId = await driveService.saveTrip(trip, fileName);

      res.json({ fileId, trip });
    }
  } catch (err) {
    console.error('Error saving trip:', err);
    res.status(500).json({ error: 'Failed to save trip' });
  }
});

// Get all trips from Google Drive
router.get('/trips', async (req: Request, res: Response) => {
  try {
    if (!req.user?.accessToken) {
      res.status(401).json({ error: 'No access token' });
    } else {
      await driveService.setCredentials({ access_token: req.user.accessToken });

      const files = await driveService.getTrips();
      res.json({ trips: files });
    }
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get a specific trip
router.get('/trips/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    if (!req.user?.accessToken) {
      res.status(401).json({ error: 'No access token' });
    } else {
      await driveService.setCredentials({ access_token: req.user.accessToken });

      const trip = await driveService.getTrip(fileId);
      res.json(trip);
    }
  } catch (err) {
    console.error('Error fetching trip:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Update a trip
router.put('/trips/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { trip } = req.body;

    if (!req.user?.accessToken) {
      res.status(401).json({ error: 'No access token' });
    } else {
      await driveService.setCredentials({ access_token: req.user.accessToken });

      await driveService.updateTrip(fileId, trip);
      res.json({ fileId, trip });
    }
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete a trip
router.delete('/trips/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    if (!req.user?.accessToken) {
      res.status(401).json({ error: 'No access token' });
    } else {
      await driveService.setCredentials({ access_token: req.user.accessToken });

      await driveService.deleteTrip(fileId);
      res.json({ message: 'Trip deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting trip:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
