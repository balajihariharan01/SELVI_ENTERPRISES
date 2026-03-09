const mongoose = require('mongoose');

/**
 * Unified Media Schema
 * 
 * Use this schema for all media storage:
 * - Product images (primary, gallery)
 * - User avatars
 * - Documents (invoices, receipts)
 * - Any file uploads
 * 
 * Supports multiple sources: upload, camera, gallery, external link
 */

const MediaSchema = new mongoose.Schema({
  // Required: The URL/path to the media
  url: {
    type: String,
    required: [true, 'Media URL is required']
  },
  
  // How the media was acquired
  source: {
    type: String,
    enum: {
      values: ['upload', 'camera', 'gallery', 'external_link', 'generated', 'imported'],
      message: '{VALUE} is not a valid source'
    },
    default: 'upload'
  },
  
  // Type of media
  type: {
    type: String,
    enum: ['image', 'document', 'video', 'receipt', 'invoice', 'other'],
    default: 'image'
  },
  
  // Detailed metadata
  metadata: {
    originalName: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    format: {
      type: String,
      lowercase: true,
      trim: true
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 200
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500
    },
    duration: {
      type: Number,
      min: 0
    },
    // Custom metadata for flexibility
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Storage provider details
  storage: {
    provider: {
      type: String,
      enum: ['local', 's3', 'cloudinary', 'external', 'base64'],
      default: 'local'
    },
    bucket: String,
    key: String,
    publicId: String,
    region: String,
    cdnUrl: String
  },
  
  // Flags
  isPrimary: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Tracking
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft delete support
  deletedAt: Date
  
}, { 
  _id: true,
  timestamps: false
});

// Virtual for checking if image
MediaSchema.virtual('isImage').get(function() {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return this.type === 'image' || imageTypes.includes(this.metadata?.mimeType);
});

// Virtual for formatted size
MediaSchema.virtual('formattedSize').get(function() {
  if (!this.metadata?.size) return null;
  
  const bytes = this.metadata.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});

// Static method to create from upload response
MediaSchema.statics.fromUpload = function(file, source = 'upload', uploadedBy = null) {
  return {
    url: file.url || file.path,
    source,
    type: file.mimetype?.startsWith('image/') ? 'image' : 'document',
    metadata: {
      originalName: file.originalname || file.filename,
      mimeType: file.mimetype,
      size: file.size,
      format: file.mimetype?.split('/')[1]
    },
    storage: {
      provider: 'local',
      key: file.filename
    },
    uploadedBy,
    uploadedAt: new Date()
  };
};

// Static method to create from external URL
MediaSchema.statics.fromExternalUrl = function(url, options = {}) {
  return {
    url,
    source: 'external_link',
    type: options.type || 'image',
    metadata: {
      altText: options.altText,
      caption: options.caption
    },
    storage: {
      provider: 'external'
    },
    uploadedAt: new Date()
  };
};

module.exports = MediaSchema;
