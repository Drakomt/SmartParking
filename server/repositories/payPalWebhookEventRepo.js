import PayPalWebhookEvent from '../models/PayPalWebhookEvent.js';

const claimEvent = async ({ paypalEventId, eventType, now, lockUntil }) => {
  try {
    return await PayPalWebhookEvent.findOneAndUpdate(
      {
        paypalEventId,
        $or: [
          { processingStatus: 'FAILED' },
          { processingStatus: 'PROCESSING', lockUntil: { $lt: now } },
        ],
      },
      {
        $setOnInsert: { paypalEventId, eventType },
        $set: { processingStatus: 'PROCESSING', lockUntil, processedAt: null },
      },
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return null;
    }
    throw error;
  }
};

const findByEventId = async (paypalEventId) => (
  PayPalWebhookEvent.findOne({ paypalEventId })
);

const markProcessed = async (paypalEventId, processedAt) => (
  PayPalWebhookEvent.findOneAndUpdate(
    { paypalEventId },
    { $set: { processingStatus: 'PROCESSED', processedAt, lockUntil: null } },
    { new: true },
  )
);

const markFailed = async (paypalEventId) => (
  PayPalWebhookEvent.findOneAndUpdate(
    { paypalEventId },
    { $set: { processingStatus: 'FAILED', lockUntil: null } },
    { new: true },
  )
);

export default { claimEvent, findByEventId, markProcessed, markFailed };
