const mongoose = require('mongoose');

/**
 * Unified Contact Schema
 * 
 * Use this schema for storing contact information:
 * - Email addresses (primary, secondary)
 * - Phone numbers (mobile, landline)
 * - Social media handles
 * - WhatsApp numbers
 */

const ContactSchema = new mongoose.Schema({
  // Type of contact
  type: {
    type: String,
    required: [true, 'Contact type is required'],
    enum: {
      values: ['email', 'phone', 'mobile', 'landline', 'whatsapp', 'website', 'social'],
      message: '{VALUE} is not a valid contact type'
    }
  },
  
  // Contact value (email address, phone number, etc.)
  value: {
    type: String,
    required: [true, 'Contact value is required'],
    trim: true
  },
  
  // Label for this contact
  label: {
    type: String,
    enum: ['primary', 'secondary', 'work', 'personal', 'support', 'sales', 'other'],
    default: 'primary'
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  
  // Primary flag
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional metadata based on type
  metadata: {
    // For phone/whatsapp
    countryCode: {
      type: String,
      default: '+91'
    },
    // For social media
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'other']
    },
    username: String,
    profileUrl: String,
    
    // Display name
    displayName: String
  }
  
}, { 
  _id: true,
  timestamps: true
});

// Virtual for formatted contact
ContactSchema.virtual('formatted').get(function() {
  switch (this.type) {
    case 'phone':
    case 'mobile':
    case 'whatsapp':
      return `${this.metadata?.countryCode || '+91'} ${this.value}`;
    case 'social':
      return this.metadata?.profileUrl || `@${this.value}`;
    default:
      return this.value;
  }
});

// Virtual for WhatsApp link
ContactSchema.virtual('whatsappLink').get(function() {
  if (this.type !== 'whatsapp' && this.type !== 'phone' && this.type !== 'mobile') {
    return null;
  }
  const number = this.value.replace(/\D/g, '');
  const countryCode = (this.metadata?.countryCode || '+91').replace('+', '');
  return `https://wa.me/${countryCode}${number}`;
});

// Virtual for tel link
ContactSchema.virtual('telLink').get(function() {
  if (!['phone', 'mobile', 'landline'].includes(this.type)) {
    return null;
  }
  return `tel:${this.metadata?.countryCode || '+91'}${this.value}`;
});

// Virtual for mailto link
ContactSchema.virtual('mailtoLink').get(function() {
  if (this.type !== 'email') return null;
  return `mailto:${this.value}`;
});

// Validation for email type
ContactSchema.path('value').validate(function(value) {
  if (this.type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  return true;
}, 'Please provide a valid email address');

// Validation for phone types
ContactSchema.path('value').validate(function(value) {
  if (['phone', 'mobile', 'whatsapp'].includes(this.type)) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10;
  }
  return true;
}, 'Please provide a valid 10-digit phone number');

// Enable virtuals in JSON
ContactSchema.set('toJSON', { virtuals: true });
ContactSchema.set('toObject', { virtuals: true });

module.exports = ContactSchema;
