import express from 'express';
const router = express.Router();
import authService from '../services/authService.js';
import { protect } from '../middleware/auth.js';
import { getCsrfCookieOptions, issueCsrfToken, requireCsrf } from '../middleware/csrf.js';

export const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production'
    || String(process.env.CLIENT_ORIGIN || '')
      .split(',')
      .some((origin) => origin.trim().startsWith('https://'));

  return {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  };
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    ...getAuthCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const serializeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  authorizedCities: user.authorizedCities || (user.authorizedCity ? [user.authorizedCity] : []),
  authorizedCity: user.authorizedCities?.[0] || user.authorizedCity || null,
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser(email, password);
    const token = authService.generateToken(userData._id);

    setAuthCookie(res, token);
    const csrfToken = issueCsrfToken(res);
    res.json({ ...serializeUser(userData), csrfToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const userData = await authService.registerUser(req.body);
    const token = authService.generateToken(userData._id);

    setAuthCookie(res, token);
    const csrfToken = issueCsrfToken(res);
    res.status(201).json({ ...serializeUser(userData), csrfToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/logout', requireCsrf, (req, res) => {
  res.clearCookie('token', getAuthCookieOptions());
  const { maxAge: _maxAge, ...csrfCookieOptions } = getCsrfCookieOptions();
  res.clearCookie('csrfToken', csrfCookieOptions);
  res.json({ message: 'Logged out' });
});

router.get('/me', protect, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(serializeUser(req.user));
});

router.get('/csrf', protect, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ csrfToken: issueCsrfToken(res) });
});

export default router;

