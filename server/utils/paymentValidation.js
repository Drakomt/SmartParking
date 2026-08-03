import mongoose from 'mongoose';
import AppError from '../errors/AppError.js';

const PAYPAL_ID_PATTERN = /^[A-Z0-9]{8,64}$/;
const WEBHOOK_EVENT_ID_PATTERN = /^[A-Z0-9-]{8,128}$/i;

export const validateCreateOrderBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const fields = Object.keys(body);
  if (fields.length !== 1 || fields[0] !== 'orderId') {
    throw new AppError('Only orderId may be provided', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  if (typeof body.orderId !== 'string' || !mongoose.Types.ObjectId.isValid(body.orderId)) {
    throw new AppError('orderId must be a valid parking session ID', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  return body.orderId;
};

export const validatePayPalId = (value, fieldName = 'paypalOrderId') => {
  const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!PAYPAL_ID_PATTERN.test(normalizedValue)) {
    throw new AppError(`${fieldName} is invalid`, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  return normalizedValue;
};

export const validateWebhookEvent = (event) => {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new AppError('Webhook event must be a JSON object', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  if (typeof event.id !== 'string' || !WEBHOOK_EVENT_ID_PATTERN.test(event.id)) {
    throw new AppError('Webhook event ID is invalid', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  if (typeof event.event_type !== 'string' || !event.event_type.trim()) {
    throw new AppError('Webhook event type is required', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  return event;
};

export const getWebhookHeaders = (headers) => {
  const requiredHeaders = [
    'paypal-auth-algo',
    'paypal-cert-url',
    'paypal-transmission-id',
    'paypal-transmission-sig',
    'paypal-transmission-time',
  ];
  const result = {};
  for (const headerName of requiredHeaders) {
    const value = headers[headerName];
    if (typeof value !== 'string' || !value.trim()) {
      throw new AppError(`Missing required webhook header: ${headerName}`, {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    result[headerName] = value.trim();
  }
  return result;
};
