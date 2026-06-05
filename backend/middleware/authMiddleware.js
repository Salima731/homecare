const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Protect routes — verifies JWT from HTTP-only cookie or Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Try cookie first
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Fallback: Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized — user not found');
    }

    if (req.user.isBanned) {
      res.status(403);
      throw new Error('Your account has been banned. Contact support.');
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Token expired — please refresh');
    }
    res.status(401);
    throw new Error(error.message || 'Not authorized — invalid token');
  }
});

module.exports = { protect };
