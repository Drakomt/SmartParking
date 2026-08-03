import mongoose from 'mongoose';

const payPalWebhookEventSchema = new mongoose.Schema({
  paypalEventId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  eventType: {
    type: String,
    required: true,
    immutable: true,
  },
  processingStatus: {
    type: String,
    enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
    default: 'PROCESSING',
  },
  processedAt: {
    type: Date,
    default: null,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('PayPalWebhookEvent', payPalWebhookEventSchema);
