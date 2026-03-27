import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { flightAPIService, hotelAPIService } from '../services/bookingService';

const router = Router();

router.use(authenticateToken);

// Search flights (placeholder)
router.get('/flights', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      res.status(400).json({ error: 'Missing required parameters' });
    } else {
      const flights = await flightAPIService.searchFlights(
        from as string,
        to as string,
        new Date(date as string)
      );

      res.json({ flights });
    }
  } catch (err) {
    console.error('Error searching flights:', err);
    res.status(500).json({ error: 'Failed to search flights' });
  }
});

// Get flight status
router.get('/flights/:flightNumber', async (req: Request, res: Response) => {
  try {
    const { flightNumber } = req.params;

    const status = await flightAPIService.getFlightStatus(flightNumber);
    res.json(status);
  } catch (err) {
    console.error('Error fetching flight status:', err);
    res.status(500).json({ error: 'Failed to fetch flight status' });
  }
});

// Search hotels (placeholder)
router.get('/hotels', async (req: Request, res: Response) => {
  try {
    const { location, checkIn, checkOut } = req.query;

    if (!location || !checkIn || !checkOut) {
      res.status(400).json({ error: 'Missing required parameters' });
    } else {
      const hotels = await hotelAPIService.searchHotels(
        location as string,
        new Date(checkIn as string),
        new Date(checkOut as string)
      );

      res.json({ hotels });
    }
  } catch (err) {
    console.error('Error searching hotels:', err);
    res.status(500).json({ error: 'Failed to search hotels' });
  }
});

export default router;
