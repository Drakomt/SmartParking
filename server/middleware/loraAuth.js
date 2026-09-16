import { timingSafeEqual } from 'node:crypto';

const requireLoraApiKey = (req, res, next) => {
  const configuredKey = process.env.LORA_API_KEY;
  const suppliedKey = req.get('x-api-key');
  if (!configuredKey) {
    return res.status(503).json({ message: 'LoRa integration is not configured' });
  }
  if (!suppliedKey) {
    return res.status(401).json({ message: 'Invalid LoRa credentials' });
  }
  const expected = Buffer.from(configuredKey);
  const actual = Buffer.from(suppliedKey);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return res.status(401).json({ message: 'Invalid LoRa credentials' });
  }
  return next();
};

export { requireLoraApiKey };
