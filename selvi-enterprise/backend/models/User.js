const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: function() {
      // Phone is required only for non-Google users
      return !this.googleId;
    },
    unique: true,
    sparse: true, // Allows multiple null values but unique non-null values
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only for non-Google users
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profilePicture: {
    type: String
  },
  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpire: {
    type: Date,
    select: false
  },
  // Phone Verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneOTP: {
    type: String,
    select: false
  },
  phoneOTPExpire: {
    type: Date,
    select: false
  },
  phoneOTPAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lastOTPSent: {
    type: Date,
    select: false
  },
  // Forgot Password fields
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expire time (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Token valid for 24 hours
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Generate phone OTP
userSchema.methods.generatePhoneOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP before storing
  this.phoneOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  // OTP valid for 10 minutes
  this.phoneOTPExpire = Date.now() + 10 * 60 * 1000;
  this.phoneOTPAttempts = 0;
  this.lastOTPSent = Date.now();
  
  return otp;
};

// Verify phone OTP
userSchema.methods.verifyPhoneOTP = function(enteredOTP) {
  const hashedOTP = crypto
    .createHash('sha256')
    .update(enteredOTP)
    .digest('hex');
  
  return this.phoneOTP === hashedOTP && this.phoneOTPExpire > Date.now();
};

module.exports = mongoose.model('User', userSchema);
