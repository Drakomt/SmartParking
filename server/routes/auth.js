import express from 'express';
const router = express.Router();
import authService from '../services/authService.js';

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser(email, password);
    const token = authService.generateToken(userData._id);

    setAuthCookie(res, token);
    res.json({
      _id: userData._id,
      fullName: userData.fullName,
      email: userData.email,
      authorizedCities: userData.authorizedCities,
      authorizedCity: userData.authorizedCity,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const userData = await authService.registerUser(req.body);
    const token = authService.generateToken(userData._id);

    setAuthCookie(res, token);
    res.status(201).json({
      _id: userData._id,
      fullName: userData.fullName,
      email: userData.email,
      authorizedCities: userData.authorizedCities,
      authorizedCity: userData.authorizedCity,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });
  res.json({ message: 'Logged out' });
});

export default router;

