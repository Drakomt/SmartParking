import express from 'express';
import paypalCheckoutService from '../services/paypalCheckoutService.js';
import paymentLogger from '../utils/paymentLogger.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  validateCreateOrderBody,
  validatePayPalId,
} from '../utils/paymentValidation.js';
import AppError from '../errors/AppError.js';

const sendError = (res, error, operation) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
  }
  paymentLogger.error('Unexpected PayPal checkout error', { operation });
  return res.status(500).json({
    message: 'Unable to process PayPal payment',
    code: 'INTERNAL_ERROR',
  });
};

const defaultCreateOrderLimiter = createRateLimiter({
  windowMs: 10 * 60_000,
  maxRequests: 20,
  keyGenerator: (req) => `${req.ip}:${req.body?.checkoutId || 'invalid'}`,
});

const defaultCaptureOrderLimiter = createRateLimiter({
  windowMs: 10 * 60_000,
  maxRequests: 30,
  keyGenerator: (req) => `${req.ip}:${req.params?.paypalOrderId || 'invalid'}`,
});

export const createPayPalRouter = ({
  checkoutService = paypalCheckoutService,
  createOrderLimiter = defaultCreateOrderLimiter,
  captureOrderLimiter = defaultCaptureOrderLimiter,
} = {}) => {
  const router = express.Router();

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  router.post('/orders', createOrderLimiter, async (req, res) => {
    try {
      const checkoutCredentials = validateCreateOrderBody(req.body);
      const result = await checkoutService.createOrder({
        ...checkoutCredentials,
      });
      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error, 'create');
    }
  });

  router.post('/orders/:paypalOrderId/capture', captureOrderLimiter, async (req, res) => {
    try {
      const paypalOrderId = validatePayPalId(req.params.paypalOrderId);
      const checkoutCredentials = validateCreateOrderBody(req.body);
      const result = await checkoutService.captureOrder({
        paypalOrderId,
        ...checkoutCredentials,
      });
      return res.status(result.status === 'PENDING' ? 202 : 200).json(result);
    } catch (error) {
      return sendError(res, error, 'capture');
    }
  });

  router.post('/webhooks', async (req, res) => {
    try {
      const result = await checkoutService.processWebhook({
        headers: req.headers,
        event: req.body,
      });
      return res.status(200).json(result);
    } catch (error) {
      return sendError(res, error, 'webhook');
    }
  });

  return router;
};

export default createPayPalRouter();
