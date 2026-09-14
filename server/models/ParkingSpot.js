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
  spotNumber: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['free', 'occupied', 'block'],
    default: 'free',
  },
  type: {
    type: String,
    enum: ['regular', 'disabled', 'dean', 'vip'],
    default: 'regular',
  },
  currentCarLicensePlate: {
    type: String,
    default: null,
  }
}, { timestamps: true });

parkingSpotSchema.index(
  { parkingLot: 1, level: 1, spotNumber: 1 },
  { unique: true },
);

export default mongoose.model('ParkingSpot', parkingSpotSchema);
