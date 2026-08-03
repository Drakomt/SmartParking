import AppError from '../errors/AppError.js';

const DEFAULT_CHECKOUT_TOKEN_TTL_MINUTES = 1440;

export const getCheckoutConfig = (environment = process.env) => {
  const rawTtl = environment.CHECKOUT_TOKEN_TTL_MINUTES;
  const ttlMinutes = rawTtl === undefined || rawTtl === ''
    ? DEFAULT_CHECKOUT_TOKEN_TTL_MINUTES
    : Number(rawTtl);

  if (!Number.isSafeInteger(ttlMinutes) || ttlMinutes < 5 || ttlMinutes > 10_080) {
    throw new AppError('CHECKOUT_TOKEN_TTL_MINUTES must be an integer between 5 and 10080', {
      statusCode: 500,
      code: 'CHECKOUT_CONFIGURATION_ERROR',
    });
  }

  return Object.freeze({ ttlMinutes });
};

export const validateCheckoutConfig = (environment = process.env) => getCheckoutConfig(environment);
