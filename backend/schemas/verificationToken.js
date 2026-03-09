const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Unified Verification Token Schema
 * 
 * Use this schema for all verification tokens:
 * - Email verification
 * - Phone OTP
 * - Password reset
 * - Two-factor authentication
 * - Magic links
 */

const VerificationTokenSchema = new mongoose.Schema({
  // Token type
  type: {
    type: String,
    required: [true, 'Token type is required'],
    enum: {
      values: [
        'email_verification',
        'phone_otp',
        'password_reset',
        '2fa',
        'magic_link',
        'api_key',
        'refresh_token'
      ],
      message: '{VALUE} is not a valid token type'
    }
  },
  
  // The hashed token (never store plain tokens)
  token: {
    type: String,
    required: true,
    select: false
  },
  
  // Expiration time
  expiresAt: {
    type: Date,
    required: true
  },
  
  // Usage tracking
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  
  // Status
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  
  // Creation time
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    channel: {
      type: String,
      enum: ['email', 'sms', 'app', 'web']
    },
    deviceInfo: String
  }
  
}, { _id: true });

// Instance method to check if token is valid
VerificationTokenSchema.methods.isValid = function() {
  return !this.isUsed && 
         new Date() < this.expiresAt && 
         this.attempts < this.maxAttempts;
};

// Instance method to check if expired
VerificationTokenSchema.methods.isExpired = function() {
  return new Date() >= this.expiresAt;
};

// Instance method to check if max attempts reached
VerificationTokenSchema.methods.isMaxAttemptsReached = function() {
  return this.attempts >= this.maxAttempts;
};

// Instance method to verify token
VerificationTokenSchema.methods.verify = function(plainToken) {
  if (!this.isValid()) {
    return { valid: false, reason: this.getInvalidReason() };
  }
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  
  if (hashedToken !== this.token) {
    this.attempts += 1;
    return { valid: false, reason: 'invalid_token' };
  }
  
  this.isUsed = true;
  this.usedAt = new Date();
  return { valid: true };
};

// Instance method to get invalid reason
VerificationTokenSchema.methods.getInvalidReason = function() {
  if (this.isUsed) return 'already_used';
  if (this.isExpired()) return 'expired';
  if (this.isMaxAttemptsReached()) return 'max_attempts';
  return 'unknown';
};

// Static method to generate a new token
VerificationTokenSchema.statics.generate = function(type, options = {}) {
  const {
    expiresInMinutes = 60,
    maxAttempts = 3,
    channel = 'email',
    ipAddress,
    userAgent
  } = options;
  
  // Generate random token
  const plainToken = type === 'phone_otp' 
    ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
    : crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  
  return {
    plainToken, // Return to send to user
    tokenDoc: {
      type,
      token: hashedToken,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      maxAttempts,
      metadata: {
        channel,
        ipAddress,
        userAgent
      }
    }
  };
};

// Static method for default expiration times by type
VerificationTokenSchema.statics.getDefaultExpiration = function(type) {
  const expirations = {
    'email_verification': 24 * 60,  // 24 hours
    'phone_otp': 10,                // 10 minutes
    'password_reset': 15,           // 15 minutes
    '2fa': 5,                       // 5 minutes
    'magic_link': 30,               // 30 minutes
    'api_key': 365 * 24 * 60,       // 1 year
    'refresh_token': 7 * 24 * 60    // 7 days
  };
  return expirations[type] || 60;
};

module.exports = VerificationTokenSchema;
