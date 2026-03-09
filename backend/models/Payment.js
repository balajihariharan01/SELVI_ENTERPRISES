const mongoose = require('mongoose');

/**
 * Generate unique payment ID
 * Format: PAY-YYMMDD-XXXXX (e.g., PAY-260108-12345)
 */
const generatePaymentId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PAY${year}${month}${day}${random}`;
};

const paymentSchema = new mongoose.Schema({
  // Unique payment identifier - auto-generated if not provided
  paymentId: {
    type: String,
    unique: true,
    required: true,
    default: generatePaymentId
  },
  
  // Reference to the order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  
  // Customer information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cod', 'upi', 'credit'],
    required: true
  },
  
  // Transaction details from payment gateway
  transactionId: {
    type: String,
    default: null
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  
  // Amount details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Gateway response
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Failure details
  failureReason: {
    type: String,
    default: null
  },
  
  // Refund details
  refundId: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: {
    type: Date,
    default: null
  },
  refundReason: {
    type: String,
    default: null
  },
  
  // Timestamps
  paymentDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-validate hook to ensure paymentId exists before validation
paymentSchema.pre('validate', function(next) {
  if (!this.paymentId) {
    this.paymentId = generatePaymentId();
  }
  next();
});

// Pre-save hook to update timestamp
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate paymentId (for use in controllers)
paymentSchema.statics.generatePaymentId = generatePaymentId;

// Index for efficient queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
