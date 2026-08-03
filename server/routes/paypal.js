import express from 'express';
import { protect } from '../middleware/auth.js';
import paypalCheckoutService from '../services/paypalCheckoutService.js';
import paymentLogger from '../utils/paymentLogger.js';
import {
  validateCreateOrderBody,
  validatePayPalId,
} from '../utils/paymentValidation.js';
import AppError from '../errors/AppError.js';

const router = express.Router();

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

router.post('/orders', protect, async (req, res) => {
  try {
    const parkingSessionId = validateCreateOrderBody(req.body);
    const result = await paypalCheckoutService.createOrder({
      parkingSessionId,
      user: req.user,
    });
    return res.status(201).json(result);
  } catch (error) {
    return sendError(res, error, 'create');
  }
});

router.post('/orders/:paypalOrderId/capture', protect, async (req, res) => {
  try {
    const paypalOrderId = validatePayPalId(req.params.paypalOrderId);
    const result = await paypalCheckoutService.captureOrder({
      paypalOrderId,
      user: req.user,
    });
    return res.status(result.status === 'PENDING' ? 202 : 200).json(result);
  } catch (error) {
    return sendError(res, error, 'capture');
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const result = await paypalCheckoutService.processWebhook({
      headers: req.headers,
      event: req.body,
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'webhook');
  }
});

export default router;
