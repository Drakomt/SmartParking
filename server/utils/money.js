import AppError from '../errors/AppError.js';

const CURRENCY_DECIMAL_PLACES = Object.freeze({
  ILS: 2,
});

export const normalizeCurrency = (currency) => String(currency || '').trim().toUpperCase();

export const assertSupportedCurrency = (currency) => {
  const normalizedCurrency = normalizeCurrency(currency);
  if (!(normalizedCurrency in CURRENCY_DECIMAL_PLACES)) {
    throw new AppError('Unsupported payment currency', {
      statusCode: 422,
      code: 'UNSUPPORTED_CURRENCY',
    });
  }
  return normalizedCurrency;
};

export const formatMinorUnits = (amountMinor, currency) => {
  const normalizedCurrency = assertSupportedCurrency(currency);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new AppError('Payment amount is invalid', {
      statusCode: 422,
      code: 'INVALID_PAYMENT_AMOUNT',
    });
  }

  const decimalPlaces = CURRENCY_DECIMAL_PLACES[normalizedCurrency];
  const divisor = 10 ** decimalPlaces;
  const whole = Math.floor(amountMinor / divisor);
  const fraction = String(amountMinor % divisor).padStart(decimalPlaces, '0');
  return `${whole}.${fraction}`;
};

export const parseMajorUnits = (value, currency) => {
  const normalizedCurrency = assertSupportedCurrency(currency);
  const decimalPlaces = CURRENCY_DECIMAL_PLACES[normalizedCurrency];
  const pattern = new RegExp(`^(0|[1-9]\\d*)\\.(\\d{${decimalPlaces}})$`);
  const match = pattern.exec(String(value || ''));

  if (!match) {
    throw new AppError('PayPal returned an invalid payment amount', {
      statusCode: 502,
      code: 'INVALID_PAYPAL_RESPONSE',
    });
  }

  const amountMinor = Number(match[1]) * (10 ** decimalPlaces) + Number(match[2]);
  if (!Number.isSafeInteger(amountMinor)) {
    throw new AppError('PayPal returned an invalid payment amount', {
      statusCode: 502,
      code: 'INVALID_PAYPAL_RESPONSE',
    });
  }
  return amountMinor;
};
