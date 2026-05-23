const express = require('express');
const router = express.Router();
const parkingService = require('../services/parkingService');
const { protect } = require('../middleware/auth');

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
        totalSpots: req.body.totalSpots
      });
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

router.get('/parkingsbyname', async (req, res) => {
    try {
      if (!req.query.name) {
          return res.status(400).json({ message: 'City name not provided' });
      }
      const lot = await parkingService.fetchParkingByName(req.query.name);
      res.json(lot);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
});

router.route('/:id')
  .put(protect, async (req, res) => {
    try {
      const updatedLot = await parkingService.editParkingLot(req.params.id, req.body, req.user);
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

module.exports = router;
