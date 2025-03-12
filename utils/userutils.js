const User = require('../models/User');

const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

const findUserById = async (id) => {
    return await User.findByPk(id);
};

module.exports = { findUserByEmail, findUserById };
