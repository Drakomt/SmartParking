import { randomBytes, timingSafeEqual } from 'node:crypto';
import { getTokenFromCookie } from './auth.js';

const CSRF_COOKIE_NAME = 'csrfToken';

const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  const item = cookieHeader.split(';').find((cookie) => cookie.trim().startsWith(prefix));
  return item ? decodeURIComponent(item.trim().slice(prefix.length)) : null;
};

const getCsrfCookieOptions = () => {
  const usesHttpsClient = String(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .some((origin) => origin.trim().startsWith('https://'));
  const secure = process.env.NODE_ENV === 'production' || usesHttpsClient;
  return { httpOnly: false, sameSite: secure ? 'none' : 'lax', secure, maxAge: 24 * 60 * 60 * 1000 };
};

const issueCsrfToken = (res) => {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
};

const requireCsrf = (req, res, next) => {
  if (!getTokenFromCookie(req.headers.cookie)) return next();
  const cookieToken = getCookie(req.headers.cookie, CSRF_COOKIE_NAME);
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ message: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
    return res.status(403).json({ message: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }
  return next();
};

export { getCsrfCookieOptions, issueCsrfToken, requireCsrf };
