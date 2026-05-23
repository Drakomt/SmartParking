const express = require('express');
const router = express.Router();
const { getParkingLots, createParkingLot, updateParkingLot, deleteParkingLot } = require('../controllers/parkingLotController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getParkingLots)
  .post(protect, createParkingLot);

router.route('/:id')
  .put(protect, updateParkingLot)
  .delete(protect, deleteParkingLot);

module.exports = router;
