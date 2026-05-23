const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  authorizedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parkingLots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  }]
}, { timestamps: true });

module.exports = mongoose.model('City', citySchema);
