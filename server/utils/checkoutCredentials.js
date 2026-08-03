import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { getCheckoutConfig } from '../config/checkout.js';

export const hashCheckoutToken = (checkoutToken) => (
  createHash('sha256').update(checkoutToken, 'utf8').digest('hex')
);

export const verifyCheckoutToken = (checkoutToken, storedHash) => {
  if (typeof checkoutToken !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash || '')) {
    return false;
  }
  const candidateHash = Buffer.from(hashCheckoutToken(checkoutToken), 'hex');
  const expectedHash = Buffer.from(storedHash, 'hex');
  return candidateHash.length === expectedHash.length
    && timingSafeEqual(candidateHash, expectedHash);
};

export const createCheckoutCredentials = ({
  now = new Date(),
  ttlMinutes = getCheckoutConfig().ttlMinutes,
} = {}) => {
  const checkoutToken = randomBytes(32).toString('base64url');
  const checkoutId = randomBytes(16).toString('hex');
  const checkoutExpiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

  return {
    checkoutId,
    checkoutToken,
    checkoutTokenHash: hashCheckoutToken(checkoutToken),
    checkoutExpiresAt,
  };
};
