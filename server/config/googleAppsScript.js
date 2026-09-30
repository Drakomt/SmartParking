import AppError from '../errors/AppError.js';

const configurationError = (message) => new AppError(message, {
  statusCode: 503,
  code: 'EMAIL_CONFIGURATION_ERROR',
});

export const getGoogleAppsScriptConfig = (environment = process.env) => {
  const rawUrl = environment.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = environment.EMAIL_SERVICE_SECRET;

  if (!rawUrl || !secret?.trim()) {
    throw configurationError(
      'GOOGLE_APPS_SCRIPT_URL and EMAIL_SERVICE_SECRET are required for receipt email delivery',
    );
  }

  let endpoint;
  try {
    endpoint = new URL(rawUrl);
  } catch {
    throw configurationError('GOOGLE_APPS_SCRIPT_URL must be a valid URL');
  }

  if (
    endpoint.protocol !== 'https:'
    || endpoint.hostname !== 'script.google.com'
    || !endpoint.pathname.startsWith('/macros/s/')
    || !endpoint.pathname.endsWith('/exec')
  ) {
    throw configurationError('GOOGLE_APPS_SCRIPT_URL must be an HTTPS Google Apps Script web app URL');
  }

  return Object.freeze({
    url: endpoint.toString(),
    secret,
  });
};
