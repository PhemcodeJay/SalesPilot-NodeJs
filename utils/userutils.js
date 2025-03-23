const User = require('../models/User');

const findUserByEmail = async (email) => {
    if (!email) {
        console.error("Error: Email parameter is missing or undefined.");
        return null;
    }
    try {
        const user = await User.findOne({ where: { email } });
        return user;
    } catch (error) {
        console.error("Database Error in findUserByEmail:", error);
        throw error;
    }
};

const findUserById = async (id) => {
    if (!id) {
        console.error("Error: ID parameter is missing or undefined.");
        return null;
    }
    try {
        const user = await User.findByPk(id);
        return user;
    } catch (error) {
        console.error("Database Error in findUserById:", error);
        throw error;
    }
};

module.exports = { findUserByEmail, findUserById };
