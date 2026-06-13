import mongoose from 'mongoose';

const parkingSpotSchema = new mongoose.Schema({
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  level: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['free', 'occupied'],
    default: 'free',
  },
  currentCarLicensePlate: {
    type: String,
    default: null,
  }
}, { timestamps: true });

export default mongoose.model('ParkingSpot', parkingSpotSchema);
