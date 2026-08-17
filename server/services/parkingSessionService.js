import AppError from '../errors/AppError.js';
import parkingSessionRepo from '../repositories/parkingSessionRepo.js';
import parkingPaymentRepo from '../repositories/parkingPaymentRepo.js';
import { createCheckoutCredentials } from '../utils/checkoutCredentials.js';
import { assertSupportedCurrency, formatMinorUnits } from '../utils/money.js';

export const createParkingSessionService = ({
  sessionRepo = parkingSessionRepo,
  paymentRepo = parkingPaymentRepo,
  generateCheckoutCredentials = createCheckoutCredentials,
} = {}) => {
  const lookupForCheckout = async (licensePlate) => {
    if (typeof licensePlate !== 'string' || licensePlate.trim() === '') {
      throw new AppError('License plate is required', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const normalizedPlate = licensePlate.trim();
    const session = await sessionRepo.findActiveByLicensePlateWithLot(normalizedPlate);
    if (!session || !session.parkingLot) {
      throw new AppError('Active parking session not found', {
        statusCode: 404,
        code: 'PARKING_SESSION_NOT_FOUND',
      });
    }

    const { parkingFeeMinor, currency, name: parkingLotName } = session.parkingLot;
    const normalizedCurrency = assertSupportedCurrency(currency);
    if (!Number.isSafeInteger(parkingFeeMinor) || parkingFeeMinor <= 0) {
      throw new AppError('Payment is not currently eligible', {
        statusCode: 422,
        code: 'PAYMENT_NOT_ELIGIBLE',
      });
    }

    const existingPayment = await paymentRepo.findByParkingSession(session._id);
    if (existingPayment) {
      throw new AppError('Payment has already been started for this parking session', {
        statusCode: 409,
        code: 'PAYMENT_ALREADY_STARTED',
      });
    }

    const checkoutCredentials = generateCheckoutCredentials();
    const updatedSession = await sessionRepo.updateCheckoutCredentials(
      session._id,
      checkoutCredentials,
    );
    if (!updatedSession) {
      throw new AppError('Active parking session not found', {
        statusCode: 404,
        code: 'PARKING_SESSION_NOT_FOUND',
      });
    }

    return {
      checkoutId: checkoutCredentials.checkoutId,
      checkoutToken: checkoutCredentials.checkoutToken,
      amountToPay: formatMinorUnits(parkingFeeMinor, normalizedCurrency),
      entryTime: updatedSession.entryTime,
      parkingLotName,
    };
  };

  return { lookupForCheckout };
};

export default createParkingSessionService();
