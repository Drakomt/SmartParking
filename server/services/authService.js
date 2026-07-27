import userRepo from '../repositories/userRepo.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const loginUser = async (email, password) => {
  const user = await userRepo.findUserByEmail(email);

  // Note: user.comparePassword is a method on the Mongoose document defined in the model
  if (user && (await user.comparePassword(password))) {
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      authorizedCities: user.authorizedCities || (user.authorizedCity ? [user.authorizedCity] : []),
      authorizedCity: user.authorizedCities?.[0] || user.authorizedCity || null,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

const registerUser = async (userData) => {
  const userExists = await userRepo.findUserByEmail(userData.email);

  if (userExists) {
    throw new Error('User already exists');
  }

  if (userData.authorizedCity && !userData.authorizedCities) {
    userData.authorizedCities = [userData.authorizedCity];
  }

  const user = await userRepo.createUser(userData);

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    authorizedCities: user.authorizedCities || (user.authorizedCity ? [user.authorizedCity] : []),
    authorizedCity: user.authorizedCities?.[0] || user.authorizedCity || null,
    token: generateToken(user._id),
  };
};

export default { generateToken, loginUser, registerUser };
