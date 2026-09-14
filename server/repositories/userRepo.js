import User from '../models/User.js';

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserById = async (id) => {
  return await User.findById(id).select('-password');
};

const findUsersByAuthorizedCity = async (cityId) => {
  return await User.find({ authorizedCities: cityId }).select('_id');
};

const createUser = async (userData) => {
  return await User.create(userData);
};

export default { findUserByEmail, findUserById, findUsersByAuthorizedCity, createUser };
