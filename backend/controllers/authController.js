const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with 1 uppercase letter and 1 number'
      });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        field: 'email'
      });
    }

    // Check if phone exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists',
        field: 'phone'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      address,
      emailVerified: false,
      phoneVerified: false
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Selvi Enterprise!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hi ${user.name}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for registering. Please verify your email to unlock all features:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Link expires in 24 hours.</p>
        </div>
      </div>
    `;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Selvi Enterprise" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Welcome! Please Verify Your Email - Selvi Enterprise',
        html: message
      });
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// AUTHORIZED ADMIN EMAIL - ONLY THIS EMAIL CAN HAVE ADMIN ACCESS
const AUTHORIZED_ADMIN_EMAIL = 'selvienterprises.ooty@gmail.com';

// @desc    Google OAuth Login/Register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    console.log('Google auth request received');
    console.log('Credential present:', !!credential);
    console.log('GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server'
      });
    }

    // Verify Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token. Please try again.'
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('Google user info:', { email, name, googleId: googleId.substring(0, 10) + '...' });

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email already exists with local auth
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        // Link Google account to existing user
        if (existingUser.authProvider === 'local') {
          console.log('Linking Google account to existing user:', email);
          existingUser.googleId = googleId;
          existingUser.profilePicture = picture;
          await existingUser.save({ validateBeforeSave: false });
          user = existingUser;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Email already registered with different provider'
          });
        }
      } else {
        // Determine role - ONLY authorized email gets admin role
        const userRole = email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
        console.log('Creating new Google user:', email, 'with role:', userRole);
        
        // Create new user with Google
        user = await User.create({
          name,
          email,
          googleId,
          authProvider: 'google',
          profilePicture: picture,
          role: userRole
        });
        console.log('New user created successfully:', user._id);
      }
    } else {
      console.log('Existing Google user found:', email);
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.authProvider,
        profilePicture: user.profilePicture,
        emailVerified: true, // Google emails are pre-verified
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({
        success: false,
        message: 'Google login expired. Please try again.'
      });
    }
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profileImage: user.profilePicture,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified || user.authProvider === 'google',
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    // Name validation
    if (name && name.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters',
        field: 'name'
      });
    }

    // Check if phone is being changed and if it's unique
    if (phone) {
      const existingPhone = await User.findOne({ 
        phone, 
        _id: { $ne: req.user.id } 
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists',
          field: 'phone'
        });
      }
    }

    const user = await User.findById(req.user.id);

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (profileImage) updateData.profilePicture = profileImage;
    
    // If phone is changing, reset phone verification
    if (phone && phone !== user.phone) {
      updateData.phone = phone;
      updateData.phoneVerified = false;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        address: updatedUser.address,
        profileImage: updatedUser.profilePicture,
        emailVerified: updatedUser.emailVerified || updatedUser.authProvider === 'google',
        phoneVerified: updatedUser.phoneVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check if user uses Google auth
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Google authenticated users cannot change password. Please use Google login.'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user uses Google auth
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Selvi Enterprise</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Steel & Cement</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Hi ${user.name},
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #4338ca; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link will expire in <strong>15 minutes</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            For security, this request was received from your account. 
            If you have concerns, please contact us at selvienterprises.ooty@gmail.com
          </p>
        </div>
      </div>
    `;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Selvi Enterprise" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset - Selvi Enterprise',
        html: message
      });

      // Log password reset attempt for security audit
      console.log(`Password reset requested for: ${user.email} at ${new Date().toISOString()}`);

      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and confirmation'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token and find user
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log successful password reset
    console.log(`Password reset successful for: ${user.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset token (check if valid before showing reset form)
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if email is available
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email already registered' : 'Email is available'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if phone is available
// @route   POST /api/auth/check-phone
// @access  Public
exports.checkPhoneAvailability = async (req, res, next) => {
  try {
    const { phone, excludeUserId } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const query = { phone };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Phone number already exists' : 'Phone number is available'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send email verification
// @route   POST /api/auth/send-verification-email
// @access  Private
exports.sendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+emailVerificationToken +emailVerificationExpire');

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check rate limiting (max 3 emails per hour)
    if (user.emailVerificationExpire && user.emailVerificationExpire > Date.now() - 55 * 60 * 1000) {
      const timeLeft = Math.ceil((user.emailVerificationExpire.getTime() - Date.now() + 55 * 60 * 1000) / 60000);
      if (timeLeft > 0 && timeLeft < 60) {
        // Allow resend after 5 minutes
      }
    }

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Selvi Enterprise</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Steel & Cement</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Hi ${user.name},
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for registering! Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            This link will expire in <strong>24 hours</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Selvi Enterprise" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Verify Your Email - Selvi Enterprise',
        html: message
      });

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send phone OTP
// @route   POST /api/auth/send-phone-otp
// @access  Private
exports.sendPhoneOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+phoneOTP +phoneOTPExpire +lastOTPSent');

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please add a phone number first'
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Rate limiting: 60 seconds between OTP requests
    if (user.lastOTPSent && Date.now() - user.lastOTPSent.getTime() < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - user.lastOTPSent.getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP`,
        waitTime
      });
    }

    // Generate OTP
    const otp = user.generatePhoneOTP();
    await user.save({ validateBeforeSave: false });

    // In production, integrate with SMS service (Twilio, MSG91, etc.)
    // For now, we'll send via email as a fallback and log to console
    console.log(`[DEV] Phone OTP for ${user.phone}: ${otp}`);

    // Send OTP via email as fallback (in production, use SMS API)
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Selvi Enterprise" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Phone Verification OTP - Selvi Enterprise',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Selvi Enterprise</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; text-align: center;">
              <h2 style="color: #1f2937;">Phone Verification OTP</h2>
              <p style="color: #4b5563;">Your OTP for phone verification is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #4338ca; letter-spacing: 8px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This OTP is valid for 10 minutes. Do not share it with anyone.
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('OTP email error:', emailError);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone OTP
// @route   POST /api/auth/verify-phone-otp
// @access  Private
exports.verifyPhoneOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const user = await User.findById(req.user.id).select('+phoneOTP +phoneOTPExpire +phoneOTPAttempts');

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    if (!user.phoneOTP || !user.phoneOTPExpire) {
      return res.status(400).json({
        success: false,
        message: 'Please request a new OTP'
      });
    }

    // Check attempts (max 5)
    if (user.phoneOTPAttempts >= 5) {
      user.phoneOTP = undefined;
      user.phoneOTPExpire = undefined;
      user.phoneOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (!user.verifyPhoneOTP(otp)) {
      user.phoneOTPAttempts += 1;
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        attemptsLeft: 5 - user.phoneOTPAttempts
      });
    }

    // Mark phone as verified
    user.phoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpire = undefined;
    user.phoneOTPAttempts = 0;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification status
// @route   GET /api/auth/verification-status
// @access  Private
exports.getVerificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      emailVerified: user.emailVerified || user.authProvider === 'google',
      phoneVerified: user.phoneVerified,
      hasPhone: !!user.phone
    });
  } catch (error) {
    next(error);
  }
};

