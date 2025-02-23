const User = require('../models/User');

const findUserByEmail = async (email) => await User.findOne({ email });
const findUserById = async (id) => await User.findById(id);

module.exports = { findUserByEmail, findUserById };
