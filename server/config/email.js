import AppError from '../errors/AppError.js';
import { getSmtpConfig } from './smtp.js';

const getRequiredValue = (environment, name) => {
  const value = environment[name]?.trim();
  if (!value) {
    throw new AppError(`Missing required email configuration: ${name}`, {
      statusCode: 503,
      code: 'EMAIL_CONFIGURATION_ERROR',
    });
  }
  return value;
};

export const getEmailConfig = (environment = process.env) => {
  const provider = (environment.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

  if (provider === 'smtp') {
    return Object.freeze({
      provider,
      ...getSmtpConfig(environment),
    });
  }

  if (provider === 'brevo') {
    return Object.freeze({
      provider,
      apiKey: getRequiredValue(environment, 'BREVO_API_KEY'),
      fromEmail: getRequiredValue(environment, 'BREVO_FROM_EMAIL'),
      fromName: environment.BREVO_FROM_NAME?.trim() || 'Smart Parking',
    });
  }

  throw new AppError('EMAIL_PROVIDER must be either smtp or brevo', {
    statusCode: 503,
    code: 'EMAIL_CONFIGURATION_ERROR',
  });
};
