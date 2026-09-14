import { timingSafeEqual } from 'node:crypto';

const requireSetupApiKey = (req, res, next) => {
  const expected = process.env.DB_SETUP_API_KEY;
  const supplied = req.get('x-setup-api-key');
  if (!expected) return res.status(404).json({ message: 'Not found' });
  if (!supplied) return res.status(401).json({ message: 'Invalid setup credentials' });
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return res.status(401).json({ message: 'Invalid setup credentials' });
  }
  return next();
};

export { requireSetupApiKey };
