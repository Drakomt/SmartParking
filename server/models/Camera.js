const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  cameraType: {
    type: String,
    enum: ['entry', 'exit'],
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Camera', cameraSchema);
