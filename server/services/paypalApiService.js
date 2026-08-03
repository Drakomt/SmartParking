import AppError from '../errors/AppError.js';
import { getPayPalConfig } from '../config/paypal.js';
import paymentLogger from '../utils/paymentLogger.js';

const parseResponseBody = async (response) => {
  const responseText = await response.text();
  if (!responseText) {
    return {};
  }
  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
};

export const createPayPalApiService = ({
  config = getPayPalConfig(),
  fetchImpl = globalThis.fetch,
  logger = paymentLogger,
  now = () => Date.now(),
} = {}) => {
  if (typeof fetchImpl !== 'function') {
    throw new AppError('The server runtime does not provide fetch', {
      statusCode: 500,
      code: 'PAYPAL_CONFIGURATION_ERROR',
    });
  }

  let cachedAccessToken = null;
  let accessTokenExpiresAt = 0;
  let tokenRefreshPromise = null;

  const fetchWithTimeout = async (url, options, operation) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      return await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      const isTimeout = error?.name === 'AbortError';
      logger.error(isTimeout ? 'PayPal request timed out' : 'PayPal connection failed', { operation });
      throw new AppError(
        isTimeout ? 'PayPal request timed out' : 'Unable to connect to PayPal',
        {
          statusCode: 502,
          code: isTimeout ? 'PAYPAL_TIMEOUT' : 'PAYPAL_CONNECTION_ERROR',
          cause: error,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  };

  const requestAccessToken = async () => {
    const authorization = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const response = await fetchWithTimeout(`${config.apiBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    }, 'oauth');
    const responseBody = await parseResponseBody(response);
    const paypalDebugId = response.headers.get('paypal-debug-id');

    if (!response.ok || typeof responseBody.access_token !== 'string') {
      logger.error('OAuth token request failed', {
        operation: 'oauth',
        statusCode: response.status,
        paypalDebugId,
      });
      throw new AppError('Unable to authenticate with PayPal', {
        statusCode: 502,
        code: 'PAYPAL_API_ERROR',
      });
    }

    const parsedExpiresInSeconds = Number(responseBody.expires_in);
    const expiresInSeconds = Number.isFinite(parsedExpiresInSeconds) && parsedExpiresInSeconds > 0
      ? parsedExpiresInSeconds
      : 300;
    const refreshBufferSeconds = Math.max(5, Math.min(60, Math.floor(expiresInSeconds * 0.1)));
    cachedAccessToken = responseBody.access_token;
    accessTokenExpiresAt = now() + Math.max(0, expiresInSeconds - refreshBufferSeconds) * 1000;
    return cachedAccessToken;
  };

  const getAccessToken = async () => {
    if (cachedAccessToken && now() < accessTokenExpiresAt) {
      return cachedAccessToken;
    }
    if (!tokenRefreshPromise) {
      tokenRefreshPromise = requestAccessToken().finally(() => {
        tokenRefreshPromise = null;
      });
    }
    return tokenRefreshPromise;
  };

  const apiRequest = async (path, {
    method = 'POST',
    body,
    requestId,
    operation,
    retryUnauthorized = true,
  } = {}) => {
    const accessToken = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (requestId) {
      headers['PayPal-Request-Id'] = requestId;
    }

    const response = await fetchWithTimeout(`${config.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }, operation);
    const responseBody = await parseResponseBody(response);
    const paypalDebugId = response.headers.get('paypal-debug-id');

    if (response.status === 401 && retryUnauthorized) {
      cachedAccessToken = null;
      accessTokenExpiresAt = 0;
      return apiRequest(path, { method, body, requestId, operation, retryUnauthorized: false });
    }

    if (!response.ok) {
      logger.error('PayPal API request failed', {
        operation,
        statusCode: response.status,
        paypalDebugId,
      });
      const publicMessages = {
        capture: 'Unable to capture PayPal payment',
        create: 'Unable to create PayPal order',
        'webhook-verification': 'PayPal webhook verification failed',
      };
      throw new AppError(publicMessages[operation] || 'PayPal request failed', {
        statusCode: 502,
        code: 'PAYPAL_API_ERROR',
      });
    }

    return responseBody;
  };

  const createOrder = async ({ localOrderId, amount, currency, requestId }) => {
    const result = await apiRequest('/v2/checkout/orders', {
      operation: 'create',
      requestId,
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: localOrderId,
          custom_id: localOrderId,
          amount: {
            currency_code: currency,
            value: amount,
          },
        }],
      },
    });
    if (typeof result.id !== 'string' || !['CREATED', 'APPROVED'].includes(result.status)) {
      throw new AppError('PayPal returned an invalid order response', {
        statusCode: 502,
        code: 'INVALID_PAYPAL_RESPONSE',
      });
    }
    return result;
  };

  const captureOrder = async ({ paypalOrderId, requestId }) => (
    apiRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      operation: 'capture',
      requestId,
      body: {},
    })
  );

  const verifyWebhook = async ({ headers, event }) => {
    if (!config.webhookId) {
      throw new AppError('PayPal webhook processing is not configured', {
        statusCode: 503,
        code: 'PAYPAL_WEBHOOK_NOT_CONFIGURED',
      });
    }
    const result = await apiRequest('/v1/notifications/verify-webhook-signature', {
      operation: 'webhook-verification',
      body: {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: config.webhookId,
        webhook_event: event,
      },
    });
    return result.verification_status === 'SUCCESS';
  };

  return { getAccessToken, createOrder, captureOrder, verifyWebhook };
};

let defaultService;
const getDefaultService = () => {
  if (!defaultService) {
    defaultService = createPayPalApiService();
  }
  return defaultService;
};

export default {
  createOrder: (...args) => getDefaultService().createOrder(...args),
  captureOrder: (...args) => getDefaultService().captureOrder(...args),
  verifyWebhook: (...args) => getDefaultService().verifyWebhook(...args),
};
