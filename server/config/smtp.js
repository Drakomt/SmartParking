import AppError from '../errors/AppError.js';

const parseSecure = (value, port) => {
  if (value === undefined || value === '') {
    return port === 465;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw new AppError('SMTP_SECURE must be either true or false', {
      statusCode: 503,
      code: 'EMAIL_CONFIGURATION_ERROR',
    });
  }
  return normalized === 'true';
};

export const getSmtpConfig = (environment = process.env) => {
  const missingVariables = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
    .filter((name) => !environment[name]?.trim());

  if (missingVariables.length > 0) {
    throw new AppError(`Missing required email configuration: ${missingVariables.join(', ')}`, {
      statusCode: 503,
      code: 'EMAIL_CONFIGURATION_ERROR',
    });
  }

  const port = environment.SMTP_PORT ? Number(environment.SMTP_PORT) : 587;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new AppError('SMTP_PORT must be a valid port number', {
      statusCode: 503,
      code: 'EMAIL_CONFIGURATION_ERROR',
    });
  }

  return Object.freeze({
    host: environment.SMTP_HOST.trim(),
    port,
    secure: parseSecure(environment.SMTP_SECURE, port),
    user: environment.SMTP_USER.trim(),
    pass: environment.SMTP_PASS,
    from: environment.SMTP_FROM.trim(),
  });
};
