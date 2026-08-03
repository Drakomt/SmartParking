import AppError from '../errors/AppError.js';

const PAYPAL_BASE_URLS = Object.freeze({
  sandbox: 'https://api-m.sandbox.paypal.com',
  production: 'https://api-m.paypal.com',
});

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getPayPalConfig = (environment = process.env) => {
  const paypalEnvironment = (environment.PAYPAL_ENV || 'sandbox').trim().toLowerCase();
  const expectedBaseUrl = PAYPAL_BASE_URLS[paypalEnvironment];

  if (!expectedBaseUrl) {
    throw new AppError('PAYPAL_ENV must be either sandbox or production', {
      statusCode: 500,
      code: 'PAYPAL_CONFIGURATION_ERROR',
    });
  }

  const missingVariables = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
    .filter((name) => !environment[name]?.trim());

  if (missingVariables.length > 0) {
    throw new AppError(`Missing required PayPal configuration: ${missingVariables.join(', ')}`, {
      statusCode: 500,
      code: 'PAYPAL_CONFIGURATION_ERROR',
    });
  }

  const configuredBaseUrl = environment.PAYPAL_API_BASE_URL
    ? trimTrailingSlash(environment.PAYPAL_API_BASE_URL.trim())
    : expectedBaseUrl;

  if (configuredBaseUrl !== expectedBaseUrl) {
    throw new AppError(
      `PAYPAL_API_BASE_URL does not match PAYPAL_ENV=${paypalEnvironment}`,
      { statusCode: 500, code: 'PAYPAL_CONFIGURATION_ERROR' },
    );
  }

  return Object.freeze({
    clientId: environment.PAYPAL_CLIENT_ID.trim(),
    clientSecret: environment.PAYPAL_CLIENT_SECRET.trim(),
    environment: paypalEnvironment,
    apiBaseUrl: expectedBaseUrl,
    webhookId: environment.PAYPAL_WEBHOOK_ID?.trim() || null,
    requestTimeoutMs: 10_000,
  });
};

export const validatePayPalConfig = (environment = process.env) => getPayPalConfig(environment);
