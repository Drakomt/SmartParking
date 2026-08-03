import ParkingPayment from '../models/ParkingPayment.js';

const findByParkingSession = async (parkingSessionId) => (
  ParkingPayment.findOne({ parkingSession: parkingSessionId })
);

const findByPayPalOrderId = async (paypalOrderId) => (
  ParkingPayment.findOne({ paypalOrderId })
);

const findByPayPalCaptureId = async (paypalCaptureId) => (
  ParkingPayment.findOne({ paypalCaptureId })
);

const createPayment = async (paymentData) => ParkingPayment.create(paymentData);

const claimOperation = async (paymentId, now, lockUntil) => (
  ParkingPayment.findOneAndUpdate(
    {
      _id: paymentId,
      $or: [
        { operationLockUntil: null },
        { operationLockUntil: { $lt: now } },
      ],
    },
    { $set: { operationLockUntil: lockUntil } },
    { new: true },
  )
);

const updatePayment = async (paymentId, update, additionalQuery = {}) => (
  ParkingPayment.findOneAndUpdate(
    { _id: paymentId, ...additionalQuery },
    { $set: update },
    { new: true, runValidators: true },
  )
);

const completePaymentOnce = async (paymentId, completionData) => (
  ParkingPayment.findOneAndUpdate(
    { _id: paymentId, fulfilledAt: null },
    {
      $set: {
        ...completionData,
        paypalPaymentStatus: 'COMPLETED',
        operationLockUntil: null,
      },
    },
    { new: true, runValidators: true },
  )
);

export default {
  findByParkingSession,
  findByPayPalOrderId,
  findByPayPalCaptureId,
  createPayment,
  claimOperation,
  updatePayment,
  completePaymentOnce,
};
