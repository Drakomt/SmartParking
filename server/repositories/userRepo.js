import User from '../models/User.js';

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserById = async (id) => {
  return await User.findById(id).select('-password');
};

const createUser = async (userData) => {
  return await User.create(userData);
};

export default { findUserByEmail, findUserById, createUser };
