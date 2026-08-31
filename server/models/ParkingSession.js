import mongoose from 'mongoose';
import { normalizeLicensePlate } from '../utils/licensePlate.js';

const parkingSessionSchema = new mongoose.Schema({
  carLicensePlate: {
    type: String,
    required: true,
    set: normalizeLicensePlate,
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
    match: /^[a-f0-9]{32}$/,
  },
  checkoutTokenHash: {
    type: String,
    select: false,
    match: /^[a-f0-9]{64}$/,
  },
  checkoutExpiresAt: {
    type: Date,
  },
  checkoutStatus: {
    type: String,
    enum: ['Payable', 'paid', 'pass'],
    default: 'Payable',
  },
  // Prevent lookup from rotating credentials while an order is being created/captured.
  checkoutPaymentStarted: {
    type: Boolean,
    default: false,
  },
  checkoutConsumedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('ParkingSession', parkingSessionSchema);
