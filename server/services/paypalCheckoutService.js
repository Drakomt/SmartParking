import { randomUUID } from 'node:crypto';
import AppError from '../errors/AppError.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import parkingPaymentRepo from '../repositories/parkingPaymentRepo.js';
import payPalWebhookEventRepo from '../repositories/payPalWebhookEventRepo.js';
import paypalApiService from './paypalApiService.js';
import paymentLogger from '../utils/paymentLogger.js';
import {
  assertSupportedCurrency,
  formatMinorUnits,
  normalizeCurrency,
  parseMajorUnits,
} from '../utils/money.js';
import { calculateParkingPriceByLicensePlate } from '../utils/parkingPricing.js';
import { PAID_EXIT_GRACE_MINUTES } from '../utils/parkingPricing.js';
import {
  getWebhookHeaders,
  validatePayPalId,
  validateWebhookEvent,
} from '../utils/paymentValidation.js';
import { verifyCheckoutToken } from '../utils/checkoutCredentials.js';

const OPERATION_LOCK_MS = 30_000;
const NON_PAYABLE_STATUSES = new Set(['COMPLETED', 'DENIED', 'REFUNDED', 'REVERSED']);
const SUPPORTED_WEBHOOK_EVENTS = new Set([
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.PENDING',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.REFUNDED',
  'PAYMENT.CAPTURE.REVERSED',
]);

const toId = (value) => String(value?._id || value || '');

const paymentResponse = (payment) => ({
  status: payment.paypalPaymentStatus,
  orderId: payment.paypalOrderId,
  ...(payment.paypalCaptureId ? { captureId: payment.paypalCaptureId } : {}),
  ...(payment.paypalPaymentStatus === 'COMPLETED' && payment.paidAt ? {
    graceExpiresAt: new Date(
      new Date(payment.paidAt).getTime() + PAID_EXIT_GRACE_MINUTES * 60_000,
    ).toISOString(),
  } : {}),
});

export const createPayPalCheckoutService = ({
  sessionRepo = parkingSessionRepo,
  paymentRepo = parkingPaymentRepo,
  webhookEventRepo = payPalWebhookEventRepo,
  paypalApi = paypalApiService,
  logger = paymentLogger,
  createId = randomUUID,
  now = () => new Date(),
} = {}) => {
  const checkoutUnavailable = () => new AppError('Checkout is not available', {
    statusCode: 404,
    code: 'CHECKOUT_NOT_AVAILABLE',
  });

  const loadCheckout = async (checkoutId, checkoutToken, completedPayment) => {
    let parkingSession = await sessionRepo.findByCheckoutIdWithLot(checkoutId);
    if (!parkingSession && completedPayment && verifyCheckoutToken(checkoutToken, completedPayment.checkoutTokenHash)) {
      parkingSession = await sessionRepo.findSessionByIdWithLot(completedPayment.parkingSession);
      if (parkingSession?.parkingLot) return parkingSession;
    }
    if (
      !parkingSession
      || !parkingSession.parkingLot
      || !verifyCheckoutToken(checkoutToken, parkingSession.checkoutTokenHash)
    ) {
      throw checkoutUnavailable();
    }

    return parkingSession;
  };

  const assertCheckoutPayable = async (parkingSession) => {
    const expiresAt = new Date(parkingSession.checkoutExpiresAt);
    if (
      !['Payable', 'paid'].includes(parkingSession.checkoutStatus)
      || Number.isNaN(expiresAt.getTime())
      || expiresAt <= now()
    ) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 409,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }

    const { currency } = parkingSession.parkingLot;
    const payments = await paymentRepo.findCompletedByParkingSession(parkingSession._id);
    const amountMinor = calculateParkingPriceByLicensePlate({
      session: parkingSession,
      payments,
      now,
    });
    if (!currency || !Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 422,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }
    return {
      parkingSession,
      parkingLot: parkingSession.parkingLot,
      amountMinor,
      currency: assertSupportedCurrency(currency),
    };
  };

  const getOrCreatePayment = async ({ parkingSession, parkingLot, amountMinor, currency }) => {
    let payment = await paymentRepo.findByCheckoutId(parkingSession.checkoutId);
    if (payment) {
      if (payment.checkoutId !== parkingSession.checkoutId) {
        throw checkoutUnavailable();
      }
      return payment;
    }

    try {
      payment = await paymentRepo.createPayment({
        parkingSession: parkingSession._id,
        parkingLot: parkingLot._id,
        checkoutId: parkingSession.checkoutId,
        checkoutTokenHash: parkingSession.checkoutTokenHash,
        amountMinor,
        currency,
        paymentProvider: 'paypal',
        paypalPaymentStatus: 'CREATED',
        paypalCreateRequestId: `create-${createId()}`,
        paypalCaptureRequestId: `capture-${createId()}`,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      payment = await paymentRepo.findByCheckoutId(parkingSession.checkoutId);
      if (!payment) {
        throw error;
      }
      if (payment.checkoutId !== parkingSession.checkoutId) {
        throw checkoutUnavailable();
      }
    }
    return payment;
  };

  const acquirePaymentLock = async (payment) => {
    const lockStartedAt = now();
    const lockUntil = new Date(lockStartedAt.getTime() + OPERATION_LOCK_MS);
    return paymentRepo.claimOperation(payment._id, lockStartedAt, lockUntil);
  };

  const releasePaymentLock = async (paymentId, update = {}) => (
    paymentRepo.updatePayment(paymentId, { ...update, operationLockUntil: null })
  );

  const createOrder = async ({ checkoutId, checkoutToken }) => {
    const parkingSession = await loadCheckout(checkoutId, checkoutToken);
    const existingPayment = await paymentRepo.findByCheckoutId(checkoutId);
    if (
      existingPayment
      && toId(existingPayment.parkingSession) !== toId(parkingSession)
    ) {
      throw checkoutUnavailable();
    }
    if (existingPayment?.paypalPaymentStatus === 'COMPLETED') {
      throw new AppError('Payment has already been completed', {
        statusCode: 409,
        code: 'PAYMENT_ALREADY_COMPLETED',
      });
    }
    const sessionDetails = await assertCheckoutPayable(parkingSession);
    const claimedCheckout = await sessionRepo.claimCheckoutForPayment(parkingSession._id, checkoutId);
    if (!claimedCheckout) throw checkoutUnavailable();
    let payment = existingPayment || await getOrCreatePayment(sessionDetails);

    if (payment.paypalPaymentStatus === 'COMPLETED') {
      throw new AppError('Payment has already been completed', {
        statusCode: 409,
        code: 'PAYMENT_ALREADY_COMPLETED',
      });
    }
    if (NON_PAYABLE_STATUSES.has(payment.paypalPaymentStatus)) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 409,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }
    if (payment.paypalOrderId) {
      return { orderId: payment.paypalOrderId };
    }

    const lockedPayment = await acquirePaymentLock(payment);
    if (!lockedPayment) {
      payment = await paymentRepo.findByCheckoutId(checkoutId);
      if (payment?.paypalOrderId) {
        return { orderId: payment.paypalOrderId };
      }
      throw new AppError('Payment operation is already in progress', {
        statusCode: 409,
        code: 'PAYMENT_IN_PROGRESS',
      });
    }

    try {
      const paypalOrder = await paypalApi.createOrder({
        localOrderId: checkoutId,
        amount: formatMinorUnits(payment.amountMinor, payment.currency),
        currency: payment.currency,
        requestId: payment.paypalCreateRequestId,
      });
      const paypalOrderId = validatePayPalId(paypalOrder.id);
      payment = await releasePaymentLock(payment._id, {
        paypalOrderId,
        paypalPaymentStatus: paypalOrder.status === 'APPROVED' ? 'APPROVED' : 'CREATED',
      });
      logger.info('PayPal order created', {
        localOrderId: toId(parkingSession),
        paypalOrderId,
      });
      return { orderId: paypalOrderId };
    } catch (error) {
      await releasePaymentLock(payment._id).catch(() => {});
      throw error;
    }
  };

  const extractCapture = (paypalOrder, payment) => {
    const purchaseUnits = Array.isArray(paypalOrder?.purchase_units) ? paypalOrder.purchase_units : [];
    const matchingUnit = purchaseUnits.find((unit) => (
      unit.custom_id === payment.checkoutId
      || unit.reference_id === payment.checkoutId
    ));
    const captures = matchingUnit?.payments?.captures;
    if (!matchingUnit || !Array.isArray(captures) || captures.length === 0) {
      throw new AppError('PayPal returned an invalid capture response', {
        statusCode: 502,
        code: 'INVALID_PAYPAL_RESPONSE',
      });
    }
    const capture = captures[0];
    return {
      capture,
      captureId: validatePayPalId(capture.id, 'paypalCaptureId'),
      status: String(capture.status || '').toUpperCase(),
    };
  };

  const verifyCaptureAmount = (amount, payment) => {
    const currency = normalizeCurrency(amount?.currency_code);
    if (currency !== payment.currency) {
      throw new AppError('Payment currency did not match the order', {
        statusCode: 422,
        code: 'PAYMENT_CURRENCY_MISMATCH',
      });
    }
    if (parseMajorUnits(amount?.value, currency) !== payment.amountMinor) {
      throw new AppError('Payment amount did not match the order', {
        statusCode: 422,
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }
  };

  const activateCheckoutOnce = async (payment) => {
    if (payment?.paypalPaymentStatus !== 'COMPLETED') return;
    await sessionRepo.completeCheckoutOnce(
      payment.parkingSession,
      payment.paidAt || now(),
      payment.checkoutId,
    );
  };

  const completePaymentAndCheckout = async (payment, completionData) => {
    let completedPayment = await paymentRepo.completePaymentOnce(payment._id, completionData);
    if (!completedPayment) {
      completedPayment = await paymentRepo.findByPayPalOrderId(payment.paypalOrderId);
    }
    await activateCheckoutOnce(completedPayment);
    return completedPayment;
  };

  const captureOrder = async ({ paypalOrderId, checkoutId, checkoutToken }) => {
    let payment = await paymentRepo.findByPayPalOrderId(paypalOrderId);
    if (!payment) {
      throw checkoutUnavailable();
    }
    const parkingSession = await loadCheckout(
      checkoutId, checkoutToken, payment.paypalPaymentStatus === 'COMPLETED' ? payment : null,
    );
    if (
      payment.checkoutId !== checkoutId
      || toId(payment.parkingSession) !== toId(parkingSession)
    ) {
      throw checkoutUnavailable();
    }

    if (payment.paypalPaymentStatus === 'COMPLETED') {
      await activateCheckoutOnce(payment);
      return paymentResponse(payment);
    }
    if (['DENIED', 'REFUNDED', 'REVERSED'].includes(payment.paypalPaymentStatus)) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 409,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }

    await assertCheckoutPayable(parkingSession);
    const lockedPayment = await acquirePaymentLock(payment);
    if (!lockedPayment) {
      payment = await paymentRepo.findByPayPalOrderId(paypalOrderId);
      if (payment?.paypalPaymentStatus === 'COMPLETED') {
        await activateCheckoutOnce(payment);
        return paymentResponse(payment);
      }
      throw new AppError('Payment operation is already in progress', {
        statusCode: 409,
        code: 'PAYMENT_IN_PROGRESS',
      });
    }

    try {
      const paypalOrder = await paypalApi.captureOrder({
        paypalOrderId,
        requestId: payment.paypalCaptureRequestId,
      });
      if (validatePayPalId(paypalOrder?.id) !== payment.paypalOrderId) {
        throw new AppError('PayPal returned an invalid capture response', {
          statusCode: 502,
          code: 'INVALID_PAYPAL_RESPONSE',
        });
      }
      const { capture, captureId, status } = extractCapture(paypalOrder, payment);

      if (status === 'PENDING') {
        payment = await releasePaymentLock(payment._id, {
          paypalCaptureId: captureId,
          paypalPaymentStatus: 'PENDING',
        });
        return paymentResponse(payment);
      }
      if (status === 'DENIED' || status === 'DECLINED') {
        await releasePaymentLock(payment._id, {
          paypalCaptureId: captureId,
          paypalPaymentStatus: 'DENIED',
        });
        throw new AppError('PayPal denied the payment', {
          statusCode: 422,
          code: 'PAYMENT_DENIED',
        });
      }
      if (status !== 'COMPLETED' || paypalOrder.status !== 'COMPLETED') {
        await releasePaymentLock(payment._id, {
          paypalCaptureId: captureId,
          paypalPaymentStatus: 'FAILED',
        });
        throw new AppError('Unable to capture PayPal payment', {
          statusCode: 502,
          code: 'INVALID_PAYPAL_RESPONSE',
        });
      }

      try {
        verifyCaptureAmount(capture.amount, payment);
      } catch (error) {
        await releasePaymentLock(payment._id, {
          paypalCaptureId: captureId,
          paypalPaymentStatus: 'FAILED',
        });
        throw error;
      }
      const paidAt = capture.create_time ? new Date(capture.create_time) : now();
      payment = await completePaymentAndCheckout(payment, {
        paypalCaptureId: captureId,
        paidAt,
        fulfilledAt: paidAt,
      });
      logger.info('PayPal payment completed', {
        localOrderId: toId(payment.parkingSession),
        paypalOrderId,
        paypalCaptureId: captureId,
      });
      return paymentResponse(payment);
    } catch (error) {
      await releasePaymentLock(payment._id).catch(() => {});
      throw error;
    }
  };

  const findPaymentForWebhook = async (event) => {
    const resource = event.resource || {};
    const relatedIds = resource.supplementary_data?.related_ids || {};
    if (relatedIds.order_id) {
      return paymentRepo.findByPayPalOrderId(String(relatedIds.order_id).toUpperCase());
    }
    if (relatedIds.capture_id) {
      return paymentRepo.findByPayPalCaptureId(String(relatedIds.capture_id).toUpperCase());
    }
    if (resource.id && event.event_type.startsWith('PAYMENT.CAPTURE.')) {
      const payment = await paymentRepo.findByPayPalCaptureId(String(resource.id).toUpperCase());
      if (payment) return payment;
    }
    if (resource.custom_id) {
      return paymentRepo.findByCheckoutId(resource.custom_id);
    }
    return null;
  };

  const processKnownWebhook = async (event, payment) => {
    const resource = event.resource || {};
    const eventType = event.event_type;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      verifyCaptureAmount(resource.amount, payment);
      const captureId = validatePayPalId(resource.id, 'paypalCaptureId');
      const paidAt = resource.create_time ? new Date(resource.create_time) : now();
      return completePaymentAndCheckout(payment, {
        paypalCaptureId: captureId,
        paidAt,
        fulfilledAt: paidAt,
      });
    }

    if (eventType === 'PAYMENT.CAPTURE.PENDING') {
      if (payment.paypalPaymentStatus === 'COMPLETED') return payment;
      return paymentRepo.updatePayment(payment._id, {
        paypalCaptureId: validatePayPalId(resource.id, 'paypalCaptureId'),
        paypalPaymentStatus: 'PENDING',
      });
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED') {
      if (payment.paypalPaymentStatus === 'COMPLETED') return payment;
      return paymentRepo.updatePayment(payment._id, {
        paypalCaptureId: validatePayPalId(resource.id, 'paypalCaptureId'),
        paypalPaymentStatus: 'DENIED',
      });
    }

    const nextStatus = eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'REFUNDED' : 'REVERSED';
    return paymentRepo.updatePayment(payment._id, { paypalPaymentStatus: nextStatus });
  };

  const processWebhook = async ({ headers, event }) => {
    validateWebhookEvent(event);
    const webhookHeaders = getWebhookHeaders(headers);
    const isVerified = await paypalApi.verifyWebhook({ headers: webhookHeaders, event });
    if (!isVerified) {
      throw new AppError('PayPal webhook verification failed', {
        statusCode: 400,
        code: 'PAYPAL_WEBHOOK_VERIFICATION_FAILED',
      });
    }

    const startedAt = now();
    const eventLockUntil = new Date(startedAt.getTime() + OPERATION_LOCK_MS);
    const claimedEvent = await webhookEventRepo.claimEvent({
      paypalEventId: event.id,
      eventType: event.event_type,
      now: startedAt,
      lockUntil: eventLockUntil,
    });
    if (!claimedEvent) {
      return { received: true, duplicate: true };
    }

    try {
      if (!SUPPORTED_WEBHOOK_EVENTS.has(event.event_type)) {
        logger.info('Ignored unsupported PayPal webhook event', {
          paypalEventId: event.id,
          eventType: event.event_type,
        });
      } else {
        const payment = await findPaymentForWebhook(event);
        if (payment) {
          await processKnownWebhook(event, payment);
        } else {
          logger.warn('PayPal webhook did not match a local payment', {
            paypalEventId: event.id,
            eventType: event.event_type,
          });
        }
      }
      await webhookEventRepo.markProcessed(event.id, now());
      return { received: true };
    } catch (error) {
      await webhookEventRepo.markFailed(event.id).catch(() => {});
      throw error;
    }
  };

  return { createOrder, captureOrder, processWebhook };
};

export default createPayPalCheckoutService();
