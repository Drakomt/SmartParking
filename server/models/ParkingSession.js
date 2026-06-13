import mongoose from 'mongoose';

const parkingSessionSchema = new mongoose.Schema({
  carLicensePlate: {
    type: String,
    required: true,
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  parkingSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpot',
    default: null, // Nullable if not tracked at spot level during entry
  },
  entryTime: {
    type: Date,
    default: Date.now,
  },
  exitTime: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  }
}, { timestamps: true });

export default mongoose.model('ParkingSession', parkingSessionSchema);
