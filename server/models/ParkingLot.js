const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  totalSpots: {
    type: Number,
    required: true,
    min: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
