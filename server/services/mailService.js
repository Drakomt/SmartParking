import { getGoogleAppsScriptConfig } from '../config/googleAppsScript.js';
import AppError from '../errors/AppError.js';

const DEFAULT_TIMEOUT_MS = 12_000;

const safeProviderError = (value) => (
  typeof value === 'string' && /^[A-Z0-9_-]{1,64}$/i.test(value)
    ? value
    : 'UNKNOWN'
);

export const createMailService = ({
  fetchImpl = globalThis.fetch,
  configProvider = getGoogleAppsScriptConfig,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
  const sendMail = async ({ to, subject, text, html }) => {
    if (typeof fetchImpl !== 'function') {
      throw new AppError('HTTPS email delivery is unavailable in this server runtime', {
        statusCode: 503,
        code: 'EMAIL_CONFIGURATION_ERROR',
      });
    }

    const config = configProvider();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let responseData;

    try {
      response = await fetchImpl(config.url, {
        method: 'POST',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          secret: config.secret,
          to,
          subject,
          html,
          text,
        }),
      });

      try {
        responseData = await response.json();
      } catch (error) {
        throw new AppError('Email service returned an invalid response', {
          statusCode: 502,
          code: 'EMAIL_SERVICE_INVALID_RESPONSE',
          cause: error,
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
        console.error('Google Apps Script email request timed out');
        throw new AppError('Email service timed out. Please try again later.', {
          statusCode: 504,
          code: 'EMAIL_SERVICE_TIMEOUT',
          cause: error,
        });
      }

      console.error('Google Apps Script email connection failed', {
        code: safeProviderError(error?.cause?.code || error?.code),
      });
      throw new AppError('Unable to connect to the email service. Please try again later.', {
        statusCode: 503,
        code: 'EMAIL_CONNECTION_FAILED',
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok || responseData?.success !== true) {
      console.error('Google Apps Script email delivery rejected', {
        status: response.status,
        providerError: safeProviderError(responseData?.error),
      });
      throw new AppError('Unable to send receipt email', {
        statusCode: 502,
        code: 'RECEIPT_DELIVERY_FAILED',
        cause: error,
      });
    }
    
    return responseData;
  };


  return { sendMail };
};

export default createMailService();
