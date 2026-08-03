const getClientAddress = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  keyGenerator = (req) => getClientAddress(req),
  now = () => Date.now(),
}) => {
  const buckets = new Map();

  return (req, res, next) => {
    const currentTime = now();
    const key = String(keyGenerator(req));
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      bucket = { count: 0, resetAt: currentTime + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
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

    if (buckets.size > 10_000) {
      for (const [bucketKey, candidate] of buckets) {
        if (candidate.resetAt <= currentTime) buckets.delete(bucketKey);
      }
      while (buckets.size > 10_000) {
        buckets.delete(buckets.keys().next().value);
      }
    }

    return next();
  };
};
