const mongoose = require('mongoose');

/**
 * Unified Address Schema
 * 
 * Use this schema for all address storage:
 * - User addresses (home, work)
 * - Shipping addresses
 * - Billing addresses
 * - Business locations
 */

const AddressSchema = new mongoose.Schema({
  // Address label/type
  label: {
    type: String,
    enum: {
      values: ['home', 'work', 'shipping', 'billing', 'office', 'warehouse', 'other'],
      message: '{VALUE} is not a valid address label'
    },
    default: 'home'
  },
  
  // Recipient name (for shipping)
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Phone number (for delivery contact)
  phone: {
    countryCode: {
      type: String,
      default: '+91',
      trim: true
    },
    number: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    }
  },
  
  // Address lines
  line1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: 200
  },
  line2: {
    type: String,
    trim: true,
    maxlength: 200
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Location details
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: 100
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit pincode']
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  
  // Geo-coordinates for mapping
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  // Flags
  isDefault: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Delivery instructions
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  }
  
}, { 
  _id: true,
  timestamps: true
});

// Virtual for formatted phone
AddressSchema.virtual('formattedPhone').get(function() {
  if (!this.phone?.number) return null;
  return `${this.phone.countryCode || '+91'} ${this.phone.number}`;
});

// Virtual for full address string
AddressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.line1,
    this.line2,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
    this.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for short address (city, state)
AddressSchema.virtual('shortAddress').get(function() {
  return `${this.city}, ${this.state} - ${this.pincode}`;
});

// Static method to create from legacy format
AddressSchema.statics.fromLegacy = function(legacyAddress) {
  if (!legacyAddress) return null;
  
  return {
    label: 'shipping',
    name: legacyAddress.name,
    phone: {
      countryCode: '+91',
      number: legacyAddress.phone?.replace(/\D/g, '').slice(-10)
    },
    line1: legacyAddress.street || legacyAddress.line1,
    line2: legacyAddress.line2,
    city: legacyAddress.city,
    state: legacyAddress.state,
    pincode: legacyAddress.pincode || legacyAddress.zip,
    country: legacyAddress.country || 'India'
  };
};

// Enable virtuals in JSON
AddressSchema.set('toJSON', { virtuals: true });
AddressSchema.set('toObject', { virtuals: true });

module.exports = AddressSchema;
