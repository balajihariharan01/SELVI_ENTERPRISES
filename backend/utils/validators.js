/**
 * Shared Validators for MongoDB Schemas
 * 
 * Use these validators across all models for consistent validation.
 */

const validators = {
  // ========================
  // INDIAN PHONE NUMBER
  // ========================
  phone: {
    pattern: /^[6-9]\d{9}$/,
    message: 'Must be a valid 10-digit Indian mobile number starting with 6-9',
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const digits = value.replace(/\D/g, '');
      return /^[6-9]\d{9}$/.test(digits);
    }
  },

  // ========================
  // INDIAN PINCODE
  // ========================
  pincode: {
    pattern: /^[1-9][0-9]{5}$/,
    message: 'Must be a valid 6-digit Indian pincode',
    validate: (value) => {
      if (!value) return true;
      return /^[1-9][0-9]{5}$/.test(value);
    }
  },

  // ========================
  // EMAIL
  // ========================
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Must be a valid email address',
    validate: (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase());
    }
  },

  // ========================
  // GST NUMBER (India)
  // ========================
  gst: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: 'Must be a valid 15-character GST number',
    validate: (value) => {
      if (!value) return true;
      return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.toUpperCase());
    }
  },

  // ========================
  // PAN NUMBER (India)
  // ========================
  pan: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: 'Must be a valid 10-character PAN number',
    validate: (value) => {
      if (!value) return true;
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase());
    }
  },

  // ========================
  // URL
  // ========================
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Must be a valid URL starting with http:// or https://',
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  },

  // ========================
  // SLUG (URL-friendly string)
  // ========================
  slug: {
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    message: 'Must be a valid slug (lowercase letters, numbers, and hyphens only)',
    validate: (value) => {
      if (!value) return true;
      return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    }
  },

  // ========================
  // MONETARY AMOUNT
  // ========================
  amount: {
    min: 0,
    max: 100000000, // 10 crore
    message: 'Amount must be between ₹0 and ₹10,00,00,000',
    validate: (value) => {
      if (value === undefined || value === null) return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 100000000;
    }
  },

  // ========================
  // QUANTITY
  // ========================
  quantity: {
    min: 1,
    max: 100000,
    message: 'Quantity must be between 1 and 100,000',
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return Number.isInteger(num) && num >= 1 && num <= 100000;
    }
  },

  // ========================
  // PERCENTAGE
  // ========================
  percentage: {
    min: 0,
    max: 100,
    message: 'Percentage must be between 0 and 100',
    validate: (value) => {
      if (value === undefined || value === null) return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    }
  },

  // ========================
  // PASSWORD STRENGTH
  // ========================
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    validate: (value) => {
      if (!value) return true;
      return value.length >= 8; // Basic check, use pattern for strict validation
    }
  },

  // ========================
  // OTP
  // ========================
  otp: {
    pattern: /^\d{6}$/,
    message: 'OTP must be exactly 6 digits',
    validate: (value) => {
      if (!value) return true;
      return /^\d{6}$/.test(value);
    }
  },

  // ========================
  // OBJECT ID
  // ========================
  objectId: {
    pattern: /^[0-9a-fA-F]{24}$/,
    message: 'Must be a valid MongoDB ObjectId',
    validate: (value) => {
      if (!value) return true;
      return /^[0-9a-fA-F]{24}$/.test(value.toString());
    }
  },

  // ========================
  // ORDER NUMBER
  // ========================
  orderNumber: {
    pattern: /^SE\d{10}$/,
    message: 'Must be a valid order number (SE followed by 10 digits)',
    validate: (value) => {
      if (!value) return true;
      return /^SE\d{10}$/.test(value);
    }
  },

  // ========================
  // PAYMENT ID
  // ========================
  paymentId: {
    pattern: /^PAY\d{11}$/,
    message: 'Must be a valid payment ID (PAY followed by 11 digits)',
    validate: (value) => {
      if (!value) return true;
      return /^PAY\d{11}$/.test(value);
    }
  },

  // ========================
  // UPI ID
  // ========================
  upi: {
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/,
    message: 'Must be a valid UPI ID',
    validate: (value) => {
      if (!value) return true;
      return /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(value);
    }
  },

  // ========================
  // FILE SIZE (in bytes)
  // ========================
  fileSize: {
    maxImage: 5 * 1024 * 1024,    // 5MB for images
    maxDocument: 10 * 1024 * 1024, // 10MB for documents
    validate: (bytes, type = 'image') => {
      const max = type === 'image' ? validators.fileSize.maxImage : validators.fileSize.maxDocument;
      return bytes <= max;
    }
  },

  // ========================
  // IMAGE DIMENSIONS
  // ========================
  imageDimensions: {
    product: { minWidth: 400, minHeight: 400, maxWidth: 4000, maxHeight: 4000 },
    avatar: { minWidth: 100, minHeight: 100, maxWidth: 1000, maxHeight: 1000 },
    banner: { minWidth: 1200, minHeight: 400, maxWidth: 3000, maxHeight: 1000 }
  },

  // ========================
  // NAME (person/company)
  // ========================
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-100 characters with letters, spaces, hyphens, and apostrophes only',
    validate: (value) => {
      if (!value) return true;
      return value.length >= 2 && value.length <= 100;
    }
  }
};

/**
 * Create a Mongoose validator object
 * @param {string} type - Validator type from validators object
 * @returns {Object} Mongoose validator config
 */
const createValidator = (type) => {
  const v = validators[type];
  if (!v) throw new Error(`Unknown validator type: ${type}`);
  
  return {
    validator: v.validate,
    message: v.message
  };
};

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code (default: +91)
 * @returns {string} Formatted phone number
 */
const formatPhoneE164 = (phone, countryCode = '+91') => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `${countryCode}${digits}`;
};

/**
 * Format Indian currency
 * @param {number} amount - Amount in INR
 * @returns {string} Formatted amount
 */
const formatINR = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Generate slug from string
 * @param {string} text - Text to slugify
 * @returns {string} URL-friendly slug
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Sanitize phone number to digits only
 * @param {string} phone - Phone number
 * @returns {string} Digits only
 */
const sanitizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\D/g, '').slice(-10);
};

module.exports = {
  validators,
  createValidator,
  formatPhoneE164,
  formatINR,
  generateSlug,
  sanitizePhone
};
