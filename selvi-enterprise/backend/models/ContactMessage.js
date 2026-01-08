const mongoose = require('mongoose');

/**
 * Contact Message Schema
 * Stores contact form submissions from website visitors
 */
const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v.replace(/\D/g, ''));
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  subject: {
    type: String,
    trim: true,
    default: 'General Inquiry'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  emailSentToAdmin: {
    type: Boolean,
    default: false
  },
  emailSentToCustomer: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    trim: true
  },
  repliedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ email: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
