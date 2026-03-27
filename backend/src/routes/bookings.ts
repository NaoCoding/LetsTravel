import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { apiLimiter } from '../middleware/rateLimit';
import { flightAPIService, hotelAPIService } from '../services/bookingService';
import {
  FlightSearchSchema,
  HotelSearchSchema,
} from '../utils/validation';
import {
  ERROR_MESSAGES,
  API_STATUS_CODE,
} from '../utils/constants';

const router = Router();

router.use(authenticateToken);
router.use(apiLimiter);

// Search flights
router.get(
  '/flights',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = FlightSearchSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_PARAMS
      );
    }

    const { from, to, date } = validation.data;

    const flights = await flightAPIService.searchFlights(from, to, new Date(date));
    res.json({ flights });
  })
);

// Get flight status
router.get(
  '/flights/:flightNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { flightNumber } = req.params;

    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        'Invalid flight number'
      );
    }

    const status = await flightAPIService.getFlightStatus(flightNumber);
    res.json(status);
  })
);

// Search hotels
router.get(
  '/hotels',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = HotelSearchSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_PARAMS
      );
    }

    const { location, checkIn, checkOut } = validation.data;

    const hotels = await hotelAPIService.searchHotels(
      location,
      new Date(checkIn),
      new Date(checkOut)
    );

    res.json({ hotels });
  })
);

export default router;
