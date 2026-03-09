const mongoose = require('mongoose');

/**
 * Unified Audit Schema
 * 
 * Use this schema for tracking changes and history:
 * - Order status changes
 * - Payment updates
 * - Product modifications
 * - User account changes
 */

const AuditSchema = new mongoose.Schema({
  // Action performed
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: [
        // CRUD operations
        'created',
        'updated',
        'deleted',
        'restored',
        
        // Status changes
        'status_changed',
        'activated',
        'deactivated',
        'suspended',
        
        // Order specific
        'order_placed',
        'order_confirmed',
        'order_processing',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'order_returned',
        
        // Payment specific
        'payment_initiated',
        'payment_completed',
        'payment_failed',
        'refund_requested',
        'refund_processed',
        
        // Assignment
        'assigned',
        'unassigned',
        'reassigned',
        
        // Verification
        'verified',
        'unverified',
        
        // Other
        'exported',
        'imported',
        'merged',
        'note_added',
        'attachment_added'
      ],
      message: '{VALUE} is not a valid action'
    }
  },
  
  // What field was changed (for updates)
  field: {
    type: String,
    trim: true
  },
  
  // Previous value
  previousValue: mongoose.Schema.Types.Mixed,
  
  // New value
  newValue: mongoose.Schema.Types.Mixed,
  
  // Who performed the action
  performedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'manager', 'system', 'webhook', 'cron']
    }
  },
  
  // Reason for the action
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Additional context
  context: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin_panel', 'cron_job', 'webhook', 'system']
    },
    requestId: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Optional note
  note: {
    type: String,
    trim: true,
    maxlength: 1000
  }
  
}, { _id: true });

// Virtual for human-readable description
AuditSchema.virtual('description').get(function() {
  const actor = this.performedBy?.name || this.performedBy?.email || 'System';
  
  const descriptions = {
    'created': `${actor} created this record`,
    'updated': `${actor} updated ${this.field || 'this record'}`,
    'deleted': `${actor} deleted this record`,
    'status_changed': `${actor} changed status from "${this.previousValue}" to "${this.newValue}"`,
    'order_placed': `Order placed by ${actor}`,
    'order_confirmed': `Order confirmed by ${actor}`,
    'order_shipped': `Order marked as shipped by ${actor}`,
    'order_delivered': `Order marked as delivered by ${actor}`,
    'order_cancelled': `Order cancelled by ${actor}`,
    'payment_completed': `Payment completed`,
    'payment_failed': `Payment failed`,
    'refund_processed': `Refund processed by ${actor}`,
    'assigned': `Assigned to ${this.newValue} by ${actor}`,
    'note_added': `Note added by ${actor}`
  };
  
  return descriptions[this.action] || `${this.action} by ${actor}`;
});

// Virtual for formatted timestamp
AuditSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp?.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
});

// Static method to log a status change
AuditSchema.statics.logStatusChange = function(previousStatus, newStatus, performedBy, options = {}) {
  return {
    action: 'status_changed',
    field: 'status',
    previousValue: previousStatus,
    newValue: newStatus,
    performedBy: {
      user: performedBy?._id,
      name: performedBy?.name,
      email: performedBy?.email,
      role: performedBy?.role || 'system'
    },
    reason: options.reason,
    context: {
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      source: options.source || 'web'
    },
    note: options.note,
    timestamp: new Date()
  };
};

// Static method to log a field update
AuditSchema.statics.logFieldUpdate = function(field, previousValue, newValue, performedBy, options = {}) {
  return {
    action: 'updated',
    field,
    previousValue,
    newValue,
    performedBy: {
      user: performedBy?._id,
      name: performedBy?.name,
      email: performedBy?.email,
      role: performedBy?.role || 'system'
    },
    context: {
      source: options.source || 'web',
      ipAddress: options.ipAddress
    },
    timestamp: new Date()
  };
};

// Static method to log creation
AuditSchema.statics.logCreation = function(performedBy, options = {}) {
  return {
    action: 'created',
    performedBy: {
      user: performedBy?._id,
      name: performedBy?.name,
      email: performedBy?.email,
      role: performedBy?.role || 'system'
    },
    context: {
      source: options.source || 'web',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    },
    timestamp: new Date()
  };
};

// Enable virtuals in JSON
AuditSchema.set('toJSON', { virtuals: true });
AuditSchema.set('toObject', { virtuals: true });

module.exports = AuditSchema;
