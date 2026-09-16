import nodemailer from 'nodemailer';
import { getEmailConfig } from '../config/email.js';
import AppError from '../errors/AppError.js';

export const createMailService = ({
  createTransport = nodemailer.createTransport,
  fetchImpl = globalThis.fetch,
  configProvider = getEmailConfig,
} = {}) => {
  let transporter;
  let config;

  const getConfig = () => {
    if (!config) {
      config = configProvider();
    }
    return config;
  };

  const getTransport = () => {
    if (!transporter) {
      const emailConfig = getConfig();
      transporter = createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        dnsTimeout: 10_000,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });
    }
    return transporter;
  };

  const sendWithSmtp = async ({ to, subject, text, html }) => {
    const emailConfig = getConfig();
    const transport = getTransport();
    try {
      return await transport.sendMail({
        from: emailConfig.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      // SMTP errors can contain email addresses, message content or credentials.
      // Log only bounded diagnostic codes, never the raw error/SMTP response.
      console.error('SMTP email delivery failed', {
        code: typeof error?.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(error.code)
          ? error.code : 'UNKNOWN',
        responseCode: Number.isInteger(error?.responseCode) ? error.responseCode : undefined,
      });

      if (error?.code === 'EAUTH') {
        throw new AppError('Email service authentication failed. The server SMTP credentials must be updated.', {
          statusCode: 503,
          code: 'EMAIL_AUTHENTICATION_FAILED',
          cause: error,
        });
      }
      if (['ETIMEDOUT', 'EDNS', 'ECONNECTION', 'ESOCKET'].includes(error?.code)) {
        throw new AppError('Unable to connect to the email service. Please try again later.', {
          statusCode: 503,
          code: 'EMAIL_CONNECTION_FAILED',
          cause: error,
        });
      }
      throw new AppError('Unable to send receipt email', {
        statusCode: 502,
        code: 'RECEIPT_DELIVERY_FAILED',
        cause: error,
      });
    }
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
