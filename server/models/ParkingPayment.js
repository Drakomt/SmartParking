import mongoose from 'mongoose';

const PAYPAL_PAYMENT_STATUSES = [
  'CREATED',
  'APPROVED',
  'PENDING',
  'COMPLETED',
  'DENIED',
  'REFUNDED',
  'REVERSED',
  'FAILED',
];

const parkingPaymentSchema = new mongoose.Schema({
  parkingSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSession',
    required: true,
    index: true,
    immutable: true,
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
    immutable: true,
  },
  checkoutId: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    immutable: true,
    match: /^[a-f0-9]{32}$/,
  },
  // Preserve authentication for receipts/retries after the next checkout begins.
  checkoutTokenHash: {
    type: String,
    select: false,
    immutable: true,
    match: /^[a-f0-9]{64}$/,
  },
  amountMinor: {
    type: Number,
    required: true,
    min: 1,
    immutable: true,
    validate: {
      validator: Number.isSafeInteger,
      message: 'amountMinor must be an integer amount in minor units',
    },
  },
  currency: {
    type: String,
    required: true,
    enum: ['ILS'],
    immutable: true,
  },
  paymentProvider: {
    type: String,
    required: true,
    enum: ['paypal'],
    default: 'paypal',
    immutable: true,
  },
  paypalOrderId: {
    type: String,
    unique: true,
    sparse: true,
  },
  paypalCaptureId: {
    type: String,
    unique: true,
    sparse: true,
  },
  paypalPaymentStatus: {
    type: String,
    required: true,
    enum: PAYPAL_PAYMENT_STATUSES,
    default: 'CREATED',
  },
  paypalCreateRequestId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  paypalCaptureRequestId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  operationLockUntil: {
    type: Date,
    default: null,
  },
  paidAt: {
    type: Date,
    default: null,
  },
  fulfilledAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true, optimisticConcurrency: true });

export { PAYPAL_PAYMENT_STATUSES };
export default mongoose.model('ParkingPayment', parkingPaymentSchema);
