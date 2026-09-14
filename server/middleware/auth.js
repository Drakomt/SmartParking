import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getTokenFromCookie = (cookieHeader) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith('token='));

  if (!tokenCookie) return null;
  return decodeURIComponent(tokenCookie.split('=')[1]);
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req.headers.cookie);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export { getTokenFromCookie, protect };
