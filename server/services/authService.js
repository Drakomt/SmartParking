const userRepo = require('../repositories/userRepo');
const jwt = require('jsonwebtoken');

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
      authorizedCity: user.authorizedCity,
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

  const user = await userRepo.createUser(userData);

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    authorizedCity: user.authorizedCity,
    token: generateToken(user._id),
  };
};

module.exports = {
  loginUser,
  registerUser
};
