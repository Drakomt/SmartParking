import mongoose from 'mongoose';

const rateLimitBucketSchema = new mongoose.Schema({
  _id: { type: String },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RateLimitBucket', rateLimitBucketSchema);
