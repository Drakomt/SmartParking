const allowedContextFields = new Set([
  'localOrderId',
  'paypalOrderId',
  'paypalCaptureId',
  'paypalEventId',
  'paypalDebugId',
  'eventType',
  'statusCode',
  'operation',
]);

const sanitizeContext = (context = {}) => Object.fromEntries(
  Object.entries(context).filter(([key, value]) => allowedContextFields.has(key) && value != null),
);

const info = (message, context) => console.info(`[paypal] ${message}`, sanitizeContext(context));
const warn = (message, context) => console.warn(`[paypal] ${message}`, sanitizeContext(context));
const error = (message, context) => console.error(`[paypal] ${message}`, sanitizeContext(context));

export default { info, warn, error };
