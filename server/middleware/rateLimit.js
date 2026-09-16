import { createHash } from 'node:crypto';
import RateLimitBucket from '../models/RateLimitBucket.js';

const getClientAddress = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  namespace = 'default',
  keyGenerator = (req) => getClientAddress(req),
  now = () => Date.now(),
  bucketModel = RateLimitBucket,
}) => {
  return async (req, res, next) => {
    try {
    const currentTime = now();
    const currentDate = new Date(currentTime);
    const nextResetAt = new Date(currentTime + windowMs);
    const id = createHash('sha256').update(`${namespace}:${keyGenerator(req)}`).digest('hex');
    const bucket = await bucketModel.findByIdAndUpdate(
      id,
      [{
        $set: {
          count: { $cond: [{ $gt: ['$resetAt', currentDate] }, { $add: ['$count', 1] }, 1] },
          resetAt: { $cond: [{ $gt: ['$resetAt', currentDate] }, '$resetAt', nextResetAt] },
          expiresAt: { $cond: [{ $gt: ['$resetAt', currentDate] }, '$resetAt', nextResetAt] },
        },
      }],
      { upsert: true, new: true, updatePipeline: true },
    );
    const remaining = Math.max(0, maxRequests - bucket.count);
    res.setHeader('RateLimit-Limit', String(maxRequests));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        message: 'Too many payment requests. Please try again later.',
        code: 'RATE_LIMITED',
      });
    }

    return next();
    } catch (error) {
      return next(error);
    }
  };
};
