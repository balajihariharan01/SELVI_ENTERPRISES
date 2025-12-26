const jwt = require('jsonwebtoken');
const User = require('../models/User');

// AUTHORIZED ADMIN EMAIL - ONLY THIS EMAIL CAN ACCESS ADMIN ROUTES
// This must match the email in authController.js
const AUTHORIZED_ADMIN_EMAIL = 'selvienterprises.ooty@gmail.com';

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login to continue.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.'
    });
  }
};

// Admin only middleware - STRICT EMAIL + ROLE VALIDATION
exports.adminOnly = (req, res, next) => {
  // Check role first
  if (req.user.role !== 'admin') {
    console.warn(`Non-admin access attempt to admin route by: ${req.user.email} (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  // STRICT: Verify admin email matches exactly
  if (req.user.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    console.error(`SECURITY WARNING: Unauthorized admin access attempt by: ${req.user.email}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your account is not authorized for admin access.'
    });
  }
  
  // Log successful admin access for audit
  console.log(`Admin access granted: ${req.user.email} accessing ${req.originalUrl}`);
  
  next();
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }

    next();
  } catch (error) {
    next();
  }
};

// Export authorized admin email for use in other modules
exports.AUTHORIZED_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAIL;
