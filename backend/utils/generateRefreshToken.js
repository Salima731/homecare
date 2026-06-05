const jwt = require('jsonwebtoken');

/**
 * Generate long-lived refresh token (7d default)
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
};

/**
 * Send refresh token as HTTP-only cookie
 */
const sendRefreshToken = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh-token',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = { generateRefreshToken, sendRefreshToken };
