const {
    generateToken,
    generateRefreshToken,
    ACCESS_EXPIRES_IN,
    REFRESH_EXPIRES_IN
  } = require('../config/auth');
  
  const parseMaxAge = (exp) => {
    const match = /^(\d+)([smhd])$/.exec(exp);
    if (!match) return 3600000; // fallback 1hr
    const [, num, unit] = match;
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(num) * mult[unit];
  };
  
  const setAuthCookies = (res, user) => {
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
  
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: parseMaxAge(ACCESS_EXPIRES_IN),
    });
  
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: parseMaxAge(REFRESH_EXPIRES_IN),
    });
  };
  
  const clearAuthCookies = (res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  };
  
  module.exports = {
    setAuthCookies,
    clearAuthCookies,
  };
  