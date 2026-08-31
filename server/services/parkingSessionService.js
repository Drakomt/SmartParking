import AppError from '../errors/AppError.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import parkingPaymentRepo from '../repositories/parkingPaymentRepo.js';
import { createCheckoutCredentials } from '../utils/checkoutCredentials.js';
import { assertSupportedCurrency, formatMinorUnits } from '../utils/money.js';
import { calculateParkingPriceByLicensePlate, getPaidExitGracePeriod } from '../utils/parkingPricing.js';
import { normalizeLicensePlate } from '../utils/licensePlate.js';

export const createParkingSessionService = ({
  sessionRepo = parkingSessionRepo,
  paymentRepo = parkingPaymentRepo,
  generateCheckoutCredentials = createCheckoutCredentials,
  now = () => new Date(),
} = {}) => {
  const lookupForCheckout = async (licensePlate) => {
    if (typeof licensePlate !== 'string' || normalizeLicensePlate(licensePlate) === '') {
      throw new AppError('License plate is required', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const normalizedPlate = normalizeLicensePlate(licensePlate);
    const session = await sessionRepo.findActiveByLicensePlateWithLot(normalizedPlate);
    if (!session || !session.parkingLot) {
      throw new AppError('Active parking session not found', {
        statusCode: 404,
        code: 'PARKING_SESSION_NOT_FOUND',
      });
    }

    const { currency, name: parkingLotName } = session.parkingLot;
    const payments = session.checkoutStatus === 'pass'
      ? [] : await paymentRepo.findCompletedByParkingSession(session._id);
    const gracePeriod = getPaidExitGracePeriod({ session, payments });
    const graceExpiresAt = gracePeriod?.graceExpiresAt.toISOString() ?? null;
    const amountMinor = calculateParkingPriceByLicensePlate({ session, payments, now });
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 422,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }

    // A free/grace-period lookup must not revoke credentials needed by a receipt.
    if (amountMinor === 0) {
      return {
        checkoutId: null,
        checkoutToken: null,
        amountToPay: '0.00',
        entryTime: session.entryTime,
        parkingLotName,
        checkoutStatus: session.checkoutStatus,
        paymentRequired: false,
        graceExpiresAt,
      };
    }

    const normalizedCurrency = assertSupportedCurrency(currency);
    const existingPayment = session.checkoutId
      ? await paymentRepo.findByCheckoutId(session.checkoutId) : null;
    if (existingPayment && existingPayment.paypalPaymentStatus !== 'COMPLETED') {
      throw new AppError('Payment has already been started for this parking session', {
        statusCode: 409,
        code: 'PAYMENT_ALREADY_STARTED',
      });
    }

    const checkoutCredentials = generateCheckoutCredentials({ now: now() });
    const updatedSession = await sessionRepo.updateCheckoutCredentials(
      session._id,
      checkoutCredentials,
      session.checkoutId,
    );
    if (!updatedSession) {
      throw new AppError('Checkout changed or a payment is already in progress; look up the session again', {
        statusCode: 409,
        code: 'PAYMENT_IN_PROGRESS',
      });
    }

    return {
      checkoutId: checkoutCredentials.checkoutId,
      checkoutToken: checkoutCredentials.checkoutToken,
      amountToPay: formatMinorUnits(amountMinor, normalizedCurrency),
      entryTime: updatedSession.entryTime,
      parkingLotName,
      checkoutStatus: updatedSession.checkoutStatus,
      paymentRequired: true,
      graceExpiresAt,
    };
  };

  return { lookupForCheckout };
};

export default createParkingSessionService();
