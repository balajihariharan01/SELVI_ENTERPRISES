const mongoose = require('mongoose');

/**
 * Unified Money Schema
 * 
 * Use this schema for all monetary values:
 * - Product prices
 * - Order totals
 * - Payment amounts
 * - Refunds
 */

const MoneySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: {
      values: ['INR', 'USD', 'EUR', 'GBP'],
      message: '{VALUE} is not a supported currency'
    }
  }
}, { _id: false });

// Virtual for formatted amount
MoneySchema.virtual('formatted').get(function() {
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  const symbol = currencySymbols[this.currency] || this.currency;
  
  if (this.currency === 'INR') {
    // Indian number formatting
    return `${symbol}${this.amount?.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  return `${symbol}${this.amount?.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
});

// Virtual for amount in smallest unit (paise for INR)
MoneySchema.virtual('inSmallestUnit').get(function() {
  // Convert to smallest currency unit (cents, paise, etc.)
  return Math.round(this.amount * 100);
});

/**
 * Price Breakdown Schema
 * 
 * For order totals with subtotal, discounts, tax, shipping
 */
const PriceBreakdownSchema = new mongoose.Schema({
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping']
    },
    value: Number,
    description: String
  },
  
  tax: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    rate: {
      type: Number,
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['GST', 'IGST', 'CGST_SGST', 'VAT', 'none'],
      default: 'GST'
    },
    breakdown: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 }
    },
    isInclusive: {
      type: Boolean,
      default: true
    }
  },
  
  shipping: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    method: String,
    isFree: {
      type: Boolean,
      default: false
    },
    freeAbove: Number
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // For rounding
  roundingAdjustment: {
    type: Number,
    default: 0
  }
  
}, { _id: false });

// Virtual for savings amount
PriceBreakdownSchema.virtual('savings').get(function() {
  return (this.discount?.amount || 0) + (this.shipping?.isFree ? this.shipping.amount : 0);
});

// Virtual for formatted total
PriceBreakdownSchema.virtual('formattedTotal').get(function() {
  const symbol = this.currency === 'INR' ? '₹' : '$';
  return `${symbol}${this.total?.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
});

// Static method to calculate from items
PriceBreakdownSchema.statics.calculateFromItems = function(items, options = {}) {
  const {
    taxRate = 0,
    discountCode = null,
    discountAmount = 0,
    discountType = 'fixed',
    discountValue = 0,
    shippingAmount = 0,
    freeShippingAbove = null
  } = options;
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Calculate discount
  let discount = { amount: 0, code: discountCode, type: discountType, value: discountValue };
  if (discountType === 'percentage' && discountValue > 0) {
    discount.amount = Math.round(subtotal * (discountValue / 100) * 100) / 100;
  } else if (discountType === 'fixed') {
    discount.amount = discountAmount;
  }
  
  // Calculate tax
  const taxableAmount = subtotal - discount.amount;
  const taxAmount = taxRate > 0 ? Math.round(taxableAmount * (taxRate / 100) * 100) / 100 : 0;
  
  // Calculate shipping
  const isFreeShipping = freeShippingAbove && subtotal >= freeShippingAbove;
  const finalShipping = isFreeShipping ? 0 : shippingAmount;
  
  // Calculate total
  const total = Math.round((subtotal - discount.amount + taxAmount + finalShipping) * 100) / 100;
  
  return {
    subtotal,
    discount,
    tax: {
      amount: taxAmount,
      rate: taxRate,
      type: taxRate > 0 ? 'GST' : 'none',
      isInclusive: false
    },
    shipping: {
      amount: finalShipping,
      isFree: isFreeShipping,
      freeAbove: freeShippingAbove
    },
    total,
    currency: 'INR'
  };
};

// Enable virtuals
MoneySchema.set('toJSON', { virtuals: true });
MoneySchema.set('toObject', { virtuals: true });
PriceBreakdownSchema.set('toJSON', { virtuals: true });
PriceBreakdownSchema.set('toObject', { virtuals: true });

module.exports = { MoneySchema, PriceBreakdownSchema };
