const jwt = require('jsonwebtoken');

/**
 * Generate short-lived access token (15m default)
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Send access token as HTTP-only cookie
 */
const sendAccessToken = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });
};

module.exports = { generateAccessToken, sendAccessToken };
