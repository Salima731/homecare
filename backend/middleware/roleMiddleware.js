const Agency = require('../models/Agency');

/**
 * Role-based access control middleware factory
 * Usage: authorize('admin', 'agency')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied — role '${req.user.role}' is not authorized for this action`
      );
    }

    next();
  };
};

/**
 * Ensures that if the user is an agency, they are verified before performing actions
 */
const checkVerifiedAgency = async (req, res, next) => {
  if (req.user.role === 'agency') {
    const agency = await Agency.findOne({ user: req.user._id });
    
    if (!agency || agency.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access denied — Your agency profile must be approved by admin to perform this action.'
      });
    }
  }
  next();
};

const checkVerifiedHospital = async (req, res, next) => {
  if (req.user.role === 'hospital') {
    const Hospital = require('../models/Hospital'); // lazy load to prevent circular dep
    const hospital = await Hospital.findOne({ user: req.user._id });
    
    if (!hospital || hospital.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access denied — Your hospital profile must be approved by admin to perform this action.'
      });
    }
  }
  next();
};

module.exports = { authorize, checkVerifiedAgency, checkVerifiedHospital };
