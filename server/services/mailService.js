import nodemailer from 'nodemailer';
import { getSmtpConfig } from '../config/smtp.js';
import AppError from '../errors/AppError.js';

export const createMailService = ({
  createTransport = nodemailer.createTransport,
  configProvider = getSmtpConfig,
} = {}) => {
  let transporter;
  let config;

  const getTransport = () => {
    if (!transporter) {
      config = configProvider();
      transporter = createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        dnsTimeout: 10_000,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    }
    return transporter;
  };

  const sendMail = async ({ to, subject, text, html }) => {
    const transport = getTransport();
    try {
      return await transport.sendMail({
        from: config.from,
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

  return { sendMail };
};

export default createMailService();
