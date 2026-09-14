import express from 'express';
const router = express.Router();
import parkingService from '../services/parkingService.js';
import parkingSessionService from '../services/parkingSessionService.js';
import parkingReceiptService from '../services/parkingReceiptService.js';
import { protect } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import AppError from '../errors/AppError.js';
import { validateReceiptBody } from '../utils/paymentValidation.js';

const sessionLookupLimiter = createRateLimiter({
  namespace: 'parking-session-lookup',
  windowMs: 10 * 60_000,
  maxRequests: 30,
});

const receiptLimiter = createRateLimiter({
  namespace: 'parking-receipt',
  windowMs: 10 * 60_000,
  maxRequests: 10,
  keyGenerator: (req) => `${req.ip}:${req.body?.checkoutId || 'invalid'}`,
});

const parkingLotPayload = (body) => ({
  name: body.name,
  city: body.city,
  address: body.address,
  totalSpots: body.totalSpots,
  levels: body.levels,
  location: body.location,
  pricing: body.pricing,
  authorizedVehicles: body.authorizedVehicles,
  isFree: body.isFree,
  freeFirstHours: body.freeFirstHours,
  pricePerMinute: body.pricePerMinute,
  fullDayPriceMinor: body.fullDayPriceMinor,
  parkingFeeMinor: body.parkingFeeMinor,
  currency: body.currency,
});

const createParkingLotWithSpots = async (req, res) => {
  try {
    const parkingLot = await parkingService.addParkingLot(
      parkingLotPayload(req.body),
      req.user,
      req.body.spots,
    );
    return res.status(201).json(parkingLot);
  } catch (error) {
    const statusCode = error.statusCode || (error.code === 11000 ? 409 : 500);
    return res.status(statusCode).json({
      message: error.message,
      code: error.code === 11000 ? 'DUPLICATE_SPOT' : error.code,
    });
  }
};

// ==========================================
//               CITY ROUTES
// ==========================================

router.get('/cities', async (req, res) => {
  try {
    const cities = await parkingService.fetchAllCities();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ==========================================
//           PARKING LOT ROUTES
// ==========================================

router.route('/')
  // Get all lots for current admin user
  .get(protect, async (req, res) => {
    try {
      const parkingLots = await parkingService.fetchParkingLots(req.user);
      res.json(parkingLots);
    } catch (error) {
      res.status(error.statusCode || 500).json({ message: error.message, code: error.code });
    }
  })
  // Create new lot
  .post(protect, requireCsrf, createParkingLotWithSpots);

router.post(
  '/with-spots',
  protect,
  requireCsrf,
  createParkingLotWithSpots,
);

router.get('/lotsbycity', async (req, res) => {
    try {
      const cityLots = await parkingService.fetchLotsByCity(req.query.city);
      res.json(cityLots);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
});

router.get('/all', async (req, res) => {
  try {
    const lots = await parkingService.fetchAllParkingLotsWithSpots();
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/nearby', async (req, res) => {
  const latQuery = req.query.lat;
  const lngQuery = req.query.lng;
  const lat = Number(latQuery);
  const lng = Number(lngQuery);

  if (
    typeof latQuery !== 'string'
    || typeof lngQuery !== 'string'
    || latQuery.trim() === ''
    || lngQuery.trim() === ''
    || !Number.isFinite(lat)
    || !Number.isFinite(lng)
    || lat < -90
    || lat > 90
    || lng < -180
    || lng > 180
  ) {
    return res.status(400).json({
      message: 'Valid lat and lng query parameters are required',
    });
  }

  try {
    const nearbyLots = await parkingService.fetchNearbyParkingLots(lat, lng);
    return res.json(nearbyLots);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/session/lookup', sessionLookupLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const result = await parkingSessionService.lookupForCheckout(req.query.plate);
    return res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error('Parking session lookup failed');
    return res.status(500).json({
      message: 'Unable to look up parking session',
      code: 'INTERNAL_ERROR',
    });
  }
});

router.post('/session/receipt', receiptLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const receiptRequest = validateReceiptBody(req.body);
    const result = await parkingReceiptService.sendReceipt(receiptRequest);
    return res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error('Parking receipt request failed');
    return res.status(500).json({
      message: 'Unable to send receipt email',
      code: 'INTERNAL_ERROR',
    });
  }
});

router.get('/parkinglotbyid', async (req, res) => {
    try {
      if (!req.query.id) {
          return res.status(400).json({ message: 'Parking lot id not provided' });
      }
      const lot = await parkingService.fetchParkingLotById(req.query.id);
      res.json(lot);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
});

router.get('/authorized/cities', protect, async (req, res) => {
  try {
    const cities = await parkingService.fetchAuthorizedCities(req.user);
    res.json(cities);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message, code: error.code });
  }
});

router.get('/authorized/lots', protect, async (req, res) => {
  try {
    const lots = await parkingService.fetchAuthorizedLotsWithDetails(req.user);
    res.json(lots);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message, code: error.code });
  }
});

router.get('/authorized/cities/:cityId', protect, async (req, res) => {
  try {
    const cityDetails = await parkingService.fetchAuthorizedLotsByCity(req.params.cityId, req.user);
    res.json(cityDetails);
  } catch (error) {
    const statusCode = error.statusCode || (error.message.includes('not found') ? 404 : 500);
    res.status(statusCode).json({ message: error.message, code: error.code });
  }
});

router.get('/prices', async (_req, res) => {
  try {
    return res.json(await parkingService.fetchPriceList());
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/:lotId/levels', protect, requireCsrf, async (req, res) => {
  try {
    const spotInput = req.body.spots ?? req.body.spotCount;
    const result = await parkingService.addLevel(req.params.lotId, spotInput, req.user);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message, code: error.code });
  }
});

router.delete('/:lotId/levels/:level', protect, requireCsrf, async (req, res) => {
  try {
    const result = await parkingService.removeLevel(req.params.lotId, Number(req.params.level), req.user);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message, code: error.code });
  }
});

router.route('/:id')
  .put(protect, requireCsrf, async (req, res) => {
    try {
      const updateData = { ...req.body };
      const updatedLot = await parkingService.editParkingLot(req.params.id, updateData, req.user);
      res.json(updatedLot);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  })
  .delete(protect, requireCsrf, async (req, res) => {
    try {
      await parkingService.removeParkingLot(req.params.id, req.user);
      res.json({ message: 'Parking Lot removed' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ message: error.message });
    }
  });

// ==========================================
//          PARKING SPOT ROUTES
// ==========================================

router.route('/:id/spots')
  .get(async (req, res) => {
    try {
      const level = req.query.level;
      if (level) {
        // Always include the lot metadata to return totalLevels for the frontend pagination
        const spotsData = await parkingService.fetchSpotsByLotAndLevel(req.params.id, Number(level), true);
        return res.json({
          slots: spotsData.spots,
          totalLevels: spotsData.parkingLot.levels
        });
      }
      const spots = await parkingService.fetchSpotsByLot(req.params.id);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  })
  .post(protect, requireCsrf, async (req, res) => {
    try {
      const spot = await parkingService.addSpot({
        parkingLot: req.params.id,
        level: req.body.level || 1,
        spotNumber: req.body.spotNumber || null,
        status: req.body.status || 'free',
        type: req.body.type || 'regular',
        currentCarLicensePlate: req.body.currentCarLicensePlate || null
      }, req.user);
      res.status(201).json(spot);
    } catch (error) {
      const statusCode = error.statusCode || (error.code === 11000 ? 409 : 500);
      res.status(statusCode).json({ message: 'Server Error', error: error.message });
    }
  });

router.route('/spots/:spotId')
  .put(protect, requireCsrf, async (req, res) => {
    try {
      const updatedSpot = await parkingService.editSpot(req.params.spotId, req.body, req.user);
      res.json(updatedSpot);
    } catch (error) {
      res.status(error.statusCode || (error.code === 11000 ? 409 : 500)).json({ message: 'Server Error', error: error.message });
    }
  })
  .delete(protect, requireCsrf, async (req, res) => {
    try {
      await parkingService.removeSpot(req.params.spotId, req.user);
      res.json({ message: 'Parking Spot removed' });
    } catch (error) {
      res.status(error.statusCode || 500).json({ message: 'Server Error', error: error.message });
    }
  });

export default router;
