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
      });
    }

    return responseData;
  };

  const sendWithBrevo = async ({ to, subject, text, html }) => {
    const emailConfig = getConfig();

    if (typeof fetchImpl !== 'function') {
      throw new AppError('The server runtime does not support HTTPS email delivery', {
        statusCode: 503,
        code: 'EMAIL_CONFIGURATION_ERROR',
      });
    }

    let response;
    try {
      response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': emailConfig.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: emailConfig.fromEmail,
            name: emailConfig.fromName,
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
    } catch (error) {
      // Network errors may include request details. Keep production logs bounded.
      console.error('Email API connection failed', {
        provider: 'brevo',
        code: typeof error?.cause?.code === 'string'
          && /^[A-Z0-9_]{1,40}$/.test(error.cause.code)
          ? error.cause.code : 'UNKNOWN',
      });
      throw new AppError('Unable to connect to the email service. Please try again later.', {
        statusCode: 503,
        code: 'EMAIL_CONNECTION_FAILED',
        cause: error,
      });
    }

    if (!response.ok) {
      console.error('Email API delivery failed', {
        provider: 'brevo',
        status: response.status,
      });

      if (response.status === 401 || response.status === 403) {
        throw new AppError('Email service authentication failed. The server email API credentials or sender must be updated.', {
          statusCode: 503,
          code: 'EMAIL_AUTHENTICATION_FAILED',
        });
      }

      throw new AppError('Unable to send receipt email', {
        statusCode: 502,
        code: 'RECEIPT_DELIVERY_FAILED',
      });
    }

    // Brevo returns a messageId. Parsing is optional so a successful empty response
    // would not incorrectly turn a delivered request into an application error.
    return response.json().catch(() => ({}));
  };

  const sendMail = async (message) => {
    const emailConfig = getConfig();
    // Config providers injected by existing callers may not yet include `provider`;
    // preserve the former SMTP behaviour for those callers.
    return emailConfig.provider === 'brevo'
      ? sendWithBrevo(message)
      : sendWithSmtp(message);
  };

  return { sendMail };
};

export default createMailService();
