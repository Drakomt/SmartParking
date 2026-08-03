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
  checkoutId: {
    type: String,
    unique: true,
    sparse: true,
    immutable: true,
    match: /^[a-f0-9]{32}$/,
  },
  checkoutTokenHash: {
    type: String,
    select: false,
    immutable: true,
    match: /^[a-f0-9]{64}$/,
  },
  checkoutExpiresAt: {
    type: Date,
    immutable: true,
  },
  checkoutStatus: {
    type: String,
    enum: ['PAYABLE', 'CANCELLED', 'COMPLETED', 'EXPIRED'],
    default: 'PAYABLE',
  },
  checkoutConsumedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('ParkingSession', parkingSessionSchema);
