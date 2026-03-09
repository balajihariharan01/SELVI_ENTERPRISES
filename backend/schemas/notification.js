const mongoose = require('mongoose');

/**
 * Unified Notification Schema
 * 
 * Use this schema for tracking all notifications:
 * - Email notifications (order confirmation, receipts, etc.)
 * - SMS notifications
 * - Push notifications
 * - WhatsApp messages
 */

const NotificationSchema = new mongoose.Schema({
  // Notification type
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: [
        // Order related
        'order_confirmation',
        'order_receipt',
        'order_status_update',
        'shipping_notification',
        'delivery_confirmation',
        'order_cancelled',
        
        // Payment related
        'payment_success',
        'payment_failed',
        'payment_reminder',
        'refund_initiated',
        'refund_completed',
        
        // Account related
        'welcome',
        'email_verification',
        'password_reset',
        'password_changed',
        'account_deactivated',
        
        // Marketing
        'promotional',
        'newsletter',
        'price_drop_alert',
        'back_in_stock',
        
        // Admin/Support
        'contact_acknowledgment',
        'support_response',
        'admin_alert'
      ],
      message: '{VALUE} is not a valid notification type'
    }
  },
  
  // Delivery channel
  channel: {
    type: String,
    required: [true, 'Channel is required'],
    enum: {
      values: ['email', 'sms', 'push', 'whatsapp', 'in_app'],
      message: '{VALUE} is not a valid channel'
    }
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked', 'unsubscribed'],
    default: 'pending'
  },
  
  // Recipient details
  recipient: {
    email: String,
    phone: String,
    deviceToken: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Timing
  scheduledAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  
  // Retry tracking
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastAttemptAt: Date,
  nextRetryAt: Date,
  
  // Error tracking
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // External references
  externalId: String,          // Message ID from provider (SendGrid, Twilio, etc.)
  provider: {
    type: String,
    enum: ['nodemailer', 'sendgrid', 'ses', 'twilio', 'firebase', 'whatsapp_business', 'manual']
  },
  
  // Content reference (for debugging)
  content: {
    subject: String,
    templateId: String,
    previewText: String
  },
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed
  
}, { 
  _id: true,
  timestamps: true
});

// Virtual to check if notification is successful
NotificationSchema.virtual('isSuccessful').get(function() {
  return ['sent', 'delivered', 'opened', 'clicked'].includes(this.status);
});

// Virtual to check if notification failed
NotificationSchema.virtual('isFailed').get(function() {
  return ['failed', 'bounced'].includes(this.status);
});

// Virtual to check if can retry
NotificationSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && 
         this.attempts < this.maxAttempts;
});

// Instance method to mark as sent
NotificationSchema.methods.markSent = function(externalId = null) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  if (externalId) this.externalId = externalId;
  return this;
};

// Instance method to mark as failed
NotificationSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  this.error = {
    code: error.code || 'UNKNOWN',
    message: error.message || 'Unknown error',
    details: error.details
  };
  
  // Schedule retry if attempts remaining
  if (this.attempts < this.maxAttempts) {
    // Exponential backoff: 1min, 5min, 15min
    const retryDelays = [1, 5, 15];
    const delay = retryDelays[this.attempts - 1] || 15;
    this.nextRetryAt = new Date(Date.now() + delay * 60 * 1000);
  }
  
  return this;
};

// Instance method to mark as delivered
NotificationSchema.methods.markDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this;
};

// Instance method to mark as opened
NotificationSchema.methods.markOpened = function() {
  if (!this.openedAt) {
    this.status = 'opened';
    this.openedAt = new Date();
  }
  return this;
};

// Static method to create notification
NotificationSchema.statics.create = function(type, channel, recipient, options = {}) {
  return {
    type,
    channel,
    status: 'pending',
    recipient,
    content: {
      subject: options.subject,
      templateId: options.templateId
    },
    provider: options.provider,
    metadata: options.metadata
  };
};

// Enable virtuals in JSON
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

module.exports = NotificationSchema;
