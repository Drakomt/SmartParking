import express from 'express';
const router = express.Router();
import parkingService from '../services/parkingService.js';
import { protect } from '../middleware/auth.js';

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
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  })
  // Create new lot
  .post(protect, async (req, res) => {
    try {
      const parkingLot = await parkingService.addParkingLot({
        name: req.body.name,
        city: req.body.city,
        address: req.body.address,
        totalSpots: req.body.totalSpots,
        levels: req.body.levels
      }, req.user);
      res.status(201).json(parkingLot);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  });

router.get('/lotsbycity', async (req, res) => {
    try {
      const cityLots = await parkingService.fetchLotsByCity(req.query.city);
      res.json(cityLots);
    } catch (error) {
      res.status(404).json({ message: error.message });
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
    const statusCode = error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

router.get('/authorized/lots', protect, async (req, res) => {
  try {
    const lots = await parkingService.fetchParkingLots(req.user);
    res.json(lots);
  } catch (error) {
    const statusCode = error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

router.get('/authorized/cities/:cityId', protect, async (req, res) => {
  try {
    const cityDetails = await parkingService.fetchAuthorizedLotsByCity(req.params.cityId, req.user);
    res.json(cityDetails);
  } catch (error) {
    const statusCode = error.message.includes('authorized') ? 403 : error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
});

router.route('/:id')
  .put(protect, async (req, res) => {
    try {
      const updateData = { ...req.body };
      const updatedLot = await parkingService.editParkingLot(req.params.id, updateData, req.user);
      res.json(updatedLot);
    } catch (error) {
      const statusCode = error.message.includes('authorized') ? 403 : 404;
      res.status(statusCode).json({ message: error.message });
    }
  })
  .delete(protect, async (req, res) => {
    try {
      await parkingService.removeParkingLot(req.params.id, req.user);
      res.json({ message: 'Parking Lot removed' });
    } catch (error) {
      const statusCode = error.message.includes('authorized') ? 403 : 404;
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
        const includeLot = req.query.includeLot === 'true';
        const spots = await parkingService.fetchSpotsByLotAndLevel(req.params.id, Number(level), includeLot);
        return res.json(spots);
      }
      const spots = await parkingService.fetchSpotsByLot(req.params.id);
      res.json(spots);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  })
  .post(protect, async (req, res) => {
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
      const statusCode = error.message.includes('authorized') ? 403 : 500;
      res.status(statusCode).json({ message: 'Server Error', error: error.message });
    }
  });

router.route('/spots/:spotId')
  .put(protect, async (req, res) => {
    try {
      const updatedSpot = await parkingService.editSpot(req.params.spotId, req.body, req.user);
      res.json(updatedSpot);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  })
  .delete(protect, async (req, res) => {
    try {
      await parkingService.removeSpot(req.params.spotId, req.user);
      res.json({ message: 'Parking Spot removed' });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  });

export default router;
