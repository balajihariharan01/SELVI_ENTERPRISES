# MongoDB Schema Consolidation Strategy

## Executive Summary

This document provides a comprehensive database review and consolidation strategy for the Selvi Enterprise MERN application. The goal is to unify similar data structures, eliminate redundancy, and create a scalable, maintainable database architecture.

---

## Part 1: Current Design Analysis

### 1.1 Identified Problems

#### Problem 1: Fragmented Image Storage (Product Model)
```javascript
// CURRENT (Problematic)
{
  image: String,           // Single primary image
  images: [String]         // Additional images as plain strings
}
```
**Issues:**
- No metadata about image source (camera, gallery, link)
- No tracking of upload method
- No image dimensions, format, or size info
- Cannot distinguish between uploaded vs linked images
- No alt text for accessibility

#### Problem 2: Duplicated Business Configuration
```javascript
// backend/config/businessConfig.js
// backend/services/emailService.js  (BUSINESS_INFO duplicated)
// backend/services/receiptService.js (BUSINESS_INFO duplicated)
// frontend/src/config/businessConfig.js (slightly different structure)
```
**Issues:**
- Same business data defined in 4+ places
- Inconsistent structure between backend and frontend
- Risk of data drift when updating

#### Problem 3: Inconsistent Contact Information Storage

**User Model:**
```javascript
{
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  }
}
```

**Order Model (shippingAddress):**
```javascript
{
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String
  }
}
```

**ContactMessage Model:**
```javascript
{
  phone: String,
  email: String
  // No structured address
}
```
**Issues:**
- Inconsistent address structures across models
- No standardized phone format
- Missing country code handling

#### Problem 4: Scattered Email Tracking Fields (Order Model)
```javascript
{
  receiptEmailStatus: String,
  receiptEmailSentAt: Date,
  receiptEmailError: String,
  receiptEmailAttempts: Number
}
```
**Issues:**
- Only tracks one type of email (receipt)
- No extensibility for other email types (confirmation, shipping, etc.)
- Flat structure instead of reusable pattern

#### Problem 5: Redundant Payment References
```javascript
// Order Model
{
  paymentMethod: String,
  paymentIntentId: String,
  paymentStatus: String
}

// Payment Model
{
  paymentMethod: String,
  transactionId: String,
  stripePaymentIntentId: String,
  status: String
}
```
**Issues:**
- Payment data duplicated between Order and Payment models
- Different field names for same concepts
- Risk of data inconsistency

#### Problem 6: Unstructured Verification Tokens (User Model)
```javascript
{
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  phoneOTP: String,
  phoneOTPExpire: Date,
  phoneOTPAttempts: Number,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```
**Issues:**
- Multiple similar token patterns scattered as flat fields
- No unified approach for token management
- Difficult to add new verification types

#### Problem 7: Status History Without Audit Trail
```javascript
// Order Model
statusHistory: [{
  status: String,
  updatedAt: Date,
  updatedBy: ObjectId
}]
```
**Issues:**
- Only for orders, not other entities
- No IP tracking, user agent, or reason
- Could be a reusable pattern

---

## Part 2: Unified Schema Recommendations

### 2.1 Unified Media Object Schema

Replace all image/file storage with a standardized media object:

```javascript
// Reusable Media Schema (schemas/media.js)
const MediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['upload', 'camera', 'gallery', 'external_link', 'generated'],
    default: 'upload'
  },
  type: {
    type: String,
    enum: ['image', 'document', 'receipt', 'invoice'],
    default: 'image'
  },
  metadata: {
    originalName: String,
    mimeType: String,
    size: Number,           // bytes
    width: Number,          // pixels
    height: Number,         // pixels
    format: String,         // jpg, png, webp, pdf
    altText: String,
    caption: String
  },
  storage: {
    provider: {
      type: String,
      enum: ['local', 's3', 'cloudinary', 'external'],
      default: 'local'
    },
    bucket: String,
    key: String,
    publicId: String        // for Cloudinary
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

module.exports = MediaSchema;
```

### 2.2 Unified Address Schema

```javascript
// Reusable Address Schema (schemas/address.js)
const AddressSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ['home', 'work', 'shipping', 'billing', 'other'],
    default: 'home'
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    countryCode: {
      type: String,
      default: '+91'
    },
    number: {
      type: String,
      required: true
    },
    formatted: String       // Computed: +91 6380470432
  },
  line1: {                   // Street address
    type: String,
    required: true,
    trim: true
  },
  line2: {                   // Apartment, suite, unit
    type: String,
    trim: true
  },
  landmark: String,
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    match: [/^[0-9]{6}$/, 'Invalid pincode']
  },
  country: {
    type: String,
    default: 'India'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Virtual for full address
AddressSchema.virtual('fullAddress').get(function() {
  const parts = [this.line1, this.line2, this.landmark, this.city, this.state, this.pincode].filter(Boolean);
  return parts.join(', ');
});

module.exports = AddressSchema;
```

### 2.3 Unified Contact Schema

```javascript
// Reusable Contact Schema (schemas/contact.js)
const ContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'website', 'social'],
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    enum: ['primary', 'secondary', 'work', 'personal', 'support'],
    default: 'primary'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  metadata: {
    countryCode: String,    // For phone/whatsapp
    platform: String,       // For social (facebook, instagram, etc.)
    username: String        // For social handles
  }
}, { _id: true });

module.exports = ContactSchema;
```

### 2.4 Unified Verification Token Schema

```javascript
// Reusable Token Schema (schemas/verificationToken.js)
const VerificationTokenSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email_verification', 'phone_otp', 'password_reset', '2fa', 'magic_link'],
    required: true
  },
  token: {
    type: String,
    required: true,
    select: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    channel: String         // sms, email, app
  }
}, { _id: true });

// Method to check if token is valid
VerificationTokenSchema.methods.isValid = function() {
  return !this.isUsed && 
         this.expiresAt > new Date() && 
         this.attempts < this.maxAttempts;
};

module.exports = VerificationTokenSchema;
```

### 2.5 Unified Notification/Email Tracking Schema

```javascript
// Reusable Notification Schema (schemas/notification.js)
const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'order_confirmation', 
      'order_receipt', 
      'shipping_update', 
      'delivery_confirmation',
      'payment_success',
      'payment_failed',
      'password_reset',
      'welcome',
      'promotional'
    ],
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'whatsapp'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'],
    default: 'pending'
  },
  recipient: {
    email: String,
    phone: String,
    deviceToken: String
  },
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date,
  error: {
    code: String,
    message: String
  },
  externalId: String,       // Message ID from email/SMS provider
  metadata: mongoose.Schema.Types.Mixed
}, { _id: true, timestamps: true });

module.exports = NotificationSchema;
```

### 2.6 Unified Audit/History Schema

```javascript
// Reusable Audit Schema (schemas/audit.js)
const AuditSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'deleted', 
      'status_changed', 'assigned', 
      'payment_received', 'refunded',
      'shipped', 'delivered', 'cancelled'
    ]
  },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  field: String,            // Which field was changed
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByRole: {
    type: String,
    enum: ['user', 'admin', 'system']
  },
  reason: String,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

module.exports = AuditSchema;
```

### 2.7 Unified Money/Price Schema

```javascript
// Reusable Money Schema (schemas/money.js)
const MoneySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  formatted: String         // ₹1,234.56
}, { _id: false });

// Price breakdown schema for orders
const PriceBreakdownSchema = new mongoose.Schema({
  subtotal: MoneySchema,
  discount: {
    amount: MoneySchema,
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: Number
  },
  tax: {
    amount: MoneySchema,
    rate: Number,           // e.g., 18 for 18% GST
    type: String            // GST, VAT, etc.
  },
  shipping: MoneySchema,
  total: MoneySchema
}, { _id: false });

module.exports = { MoneySchema, PriceBreakdownSchema };
```

---

## Part 3: Consolidated Model Schemas

### 3.1 Consolidated Product Model

```javascript
// models/Product.js (CONSOLIDATED)
const mongoose = require('mongoose');
const MediaSchema = require('../schemas/media');
const AuditSchema = require('../schemas/audit');

const ProductSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Categorization
  category: {
    primary: {
      type: String,
      required: true,
      lowercase: true
    },
    secondary: String,
    tags: [String]
  },
  
  brand: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: MediaSchema
  },
  
  // Descriptions
  description: {
    short: {
      type: String,
      maxlength: 200
    },
    full: {
      type: String,
      maxlength: 2000
    },
    specifications: mongoose.Schema.Types.Mixed  // Flexible key-value pairs
  },
  
  // UNIFIED MEDIA STORAGE
  media: {
    primary: MediaSchema,                        // Main product image
    gallery: [MediaSchema],                      // Additional images
    documents: [MediaSchema]                     // Spec sheets, PDFs
  },
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discountedPrice: Number,
    discountPercentage: Number,
    bulkPricing: [{
      minQuantity: Number,
      price: Number
    }]
  },
  
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      lowercase: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    maxOrderQuantity: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  // Audit Trail
  history: [AuditSchema],
  
  // Timestamps
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
ProductSchema.virtual('isLowStock').get(function() {
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});

ProductSchema.virtual('inStock').get(function() {
  return this.inventory.quantity > 0 || this.inventory.allowBackorder;
});

ProductSchema.virtual('currentPrice').get(function() {
  return this.pricing.discountedPrice || this.pricing.basePrice;
});

// Indexes
ProductSchema.index({ 'category.primary': 1, status: 1 });
ProductSchema.index({ name: 'text', 'brand.name': 'text' });
ProductSchema.index({ slug: 1 });

module.exports = mongoose.model('Product', ProductSchema);
```

### 3.2 Consolidated User Model

```javascript
// models/User.js (CONSOLIDATED)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AddressSchema = require('../schemas/address');
const ContactSchema = require('../schemas/contact');
const VerificationTokenSchema = require('../schemas/verificationToken');
const MediaSchema = require('../schemas/media');

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    first: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    last: {
      type: String,
      trim: true,
      maxlength: 50
    }
  },
  
  // UNIFIED CONTACT METHODS
  contacts: [ContactSchema],
  
  // Primary identifiers (for quick access)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]{10}$/, 'Invalid phone number']
  },
  
  // Authentication
  auth: {
    password: {
      type: String,
      minlength: 8,
      select: false
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local'
    },
    providerId: String,     // Google ID, Facebook ID, etc.
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  
  // Profile
  profile: {
    avatar: MediaSchema,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  
  // UNIFIED ADDRESSES
  addresses: [AddressSchema],
  
  // UNIFIED VERIFICATION TOKENS
  verificationTokens: [VerificationTokenSchema],
  
  // Status flags (computed from tokens)
  verified: {
    email: {
      type: Boolean,
      default: false
    },
    phone: {
      type: Boolean,
      default: false
    }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'deactivated'],
    default: 'pending'
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true }
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return [this.name.first, this.name.last].filter(Boolean).join(' ');
});

// Virtual for default address
UserSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for primary phone contact
UserSchema.virtual('primaryPhone').get(function() {
  const phoneContact = this.contacts.find(c => c.type === 'phone' && c.isPrimary);
  return phoneContact?.value || this.phone;
});

// Password hashing
UserSchema.pre('save', async function(next) {
  if (!this.isModified('auth.password') || !this.auth.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.auth.password = await bcrypt.hash(this.auth.password, salt);
});

// Password comparison
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.auth.password) return false;
  return bcrypt.compare(candidatePassword, this.auth.password);
};

// Generate verification token
UserSchema.methods.createVerificationToken = function(type, expiresInMinutes = 60) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  this.verificationTokens.push({
    type,
    token: hashedToken,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000)
  });
  
  return token; // Return unhashed token to send to user
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'auth.providerId': 1 });
UserSchema.index({ status: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema);
```

### 3.3 Consolidated Order Model

```javascript
// models/Order.js (CONSOLIDATED)
const mongoose = require('mongoose');
const AddressSchema = require('../schemas/address');
const MediaSchema = require('../schemas/media');
const NotificationSchema = require('../schemas/notification');
const AuditSchema = require('../schemas/audit');
const { PriceBreakdownSchema } = require('../schemas/money');

// Order Item Schema
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  snapshot: {
    name: String,
    sku: String,
    image: MediaSchema,
    price: Number,
    unit: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  notes: String
}, { _id: true });

const OrderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer
  customer: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Snapshot at order time
    snapshot: {
      name: String,
      email: String,
      phone: String
    }
  },
  
  // Items
  items: [OrderItemSchema],
  
  // UNIFIED PRICING
  pricing: PriceBreakdownSchema,
  
  // Legacy support (will be deprecated)
  totalAmount: {
    type: Number,
    required: true
  },
  
  // UNIFIED SHIPPING ADDRESS
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  
  // Payment Reference (single source of truth)
  payment: {
    method: {
      type: String,
      enum: ['cod', 'online', 'upi', 'credit'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    paidAt: Date
  },
  
  // Order Status
  status: {
    current: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    timeline: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  
  // Shipping
  shipping: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  
  // UNIFIED NOTIFICATIONS
  notifications: [NotificationSchema],
  
  // Documents (invoices, receipts)
  documents: {
    invoice: MediaSchema,
    receipt: MediaSchema,
    deliveryProof: MediaSchema
  },
  
  // Notes
  notes: {
    customer: String,
    admin: String,
    internal: String
  },
  
  // UNIFIED AUDIT TRAIL
  history: [AuditSchema],
  
  // Flags
  flags: {
    isGift: {
      type: Boolean,
      default: false
    },
    giftMessage: String,
    requiresSignature: {
      type: Boolean,
      default: false
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
OrderSchema.virtual('isModifiable').get(function() {
  const nonModifiable = ['shipped', 'delivered', 'cancelled', 'returned'];
  if (nonModifiable.includes(this.status.current)) return false;
  
  const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24;
});

// Pre-save: Generate order number
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const prefix = 'SE';
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `${prefix}${datePart}${random}`;
  }
  next();
});

// Indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'customer.user': 1, createdAt: -1 });
OrderSchema.index({ 'status.current': 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Order', OrderSchema);
```

### 3.4 Consolidated Payment Model

```javascript
// models/Payment.js (CONSOLIDATED)
const mongoose = require('mongoose');
const { MoneySchema } = require('../schemas/money');
const AuditSchema = require('../schemas/audit');

const PaymentSchema = new mongoose.Schema({
  // Payment Identification
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // References
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  customer: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    snapshot: {
      name: String,
      email: String,
      phone: String
    }
  },
  
  // Payment Method (unified)
  method: {
    type: {
      type: String,
      enum: ['stripe', 'razorpay', 'cod', 'upi', 'bank_transfer', 'credit'],
      required: true
    },
    details: {
      // For card payments
      cardBrand: String,
      cardLast4: String,
      cardExpiry: String,
      
      // For UPI
      upiId: String,
      
      // For bank transfer
      bankName: String,
      accountLast4: String,
      
      // For gateway payments
      gatewayPaymentId: String,
      gatewayOrderId: String
    }
  },
  
  // Amount (unified)
  amount: {
    gross: {
      type: Number,
      required: true,
      min: 0
    },
    fee: {
      type: Number,
      default: 0
    },
    net: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'initiated'
  },
  
  // Gateway Integration
  gateway: {
    name: {
      type: String,
      enum: ['stripe', 'razorpay', 'paytm', 'manual']
    },
    transactionId: String,
    paymentIntentId: String,
    chargeId: String,
    response: mongoose.Schema.Types.Mixed,
    webhookVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Failure handling
  failure: {
    code: String,
    message: String,
    declineCode: String,
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: Date
  },
  
  // Refund (unified)
  refunds: [{
    refundId: String,
    amount: Number,
    reason: {
      type: String,
      enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'order_cancelled', 'other']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Audit Trail
  history: [AuditSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
PaymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);
});

PaymentSchema.virtual('isFullyRefunded').get(function() {
  return this.totalRefunded >= this.amount.gross;
});

// Pre-validate: Generate payment ID
PaymentSchema.pre('validate', function(next) {
  if (!this.paymentId) {
    const date = new Date();
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.paymentId = `PAY${datePart}${random}`;
  }
  next();
});

// Indexes
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ 'customer.user': 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ 'gateway.transactionId': 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
```

### 3.5 Consolidated Contact Message Model

```javascript
// models/ContactMessage.js (CONSOLIDATED)
const mongoose = require('mongoose');
const NotificationSchema = require('../schemas/notification');
const AuditSchema = require('../schemas/audit');

const ContactMessageSchema = new mongoose.Schema({
  // Sender Information (unified contact structure)
  sender: {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email']
    },
    phone: {
      countryCode: {
        type: String,
        default: '+91'
      },
      number: {
        type: String,
        required: true
      }
    },
    // Link to user if logged in
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Message Content
  content: {
    subject: {
      type: String,
      trim: true,
      default: 'General Inquiry'
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },
    category: {
      type: String,
      enum: ['general', 'order', 'product', 'complaint', 'feedback', 'bulk_order', 'other'],
      default: 'general'
    }
  },
  
  // Related entities
  references: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['new', 'read', 'in_progress', 'replied', 'resolved', 'archived', 'spam'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Assignment
  assignment: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date
  },
  
  // Responses
  responses: [{
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  
  // UNIFIED NOTIFICATIONS (tracks all emails sent)
  notifications: [NotificationSchema],
  
  // Tracking
  tracking: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['website', 'email', 'phone', 'whatsapp', 'social'],
      default: 'website'
    },
    campaign: String
  },
  
  // Admin notes
  internalNotes: String,
  
  // Audit
  history: [AuditSchema]
}, { 
  timestamps: true 
});

// Indexes
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ 'sender.email': 1 });
ContactMessageSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
```

---

## Part 4: Module-wise Consolidation Plan

### 4.1 Image Upload Module

**Current State:**
- Simple file upload with basic metadata
- No source tracking
- No unified structure

**Target State:**
```javascript
// Unified upload response
{
  success: true,
  data: {
    url: "https://...",
    source: "camera",           // NEW: camera | gallery | upload | external_link
    type: "image",
    metadata: {
      originalName: "photo.jpg",
      mimeType: "image/jpeg",
      size: 245678,
      width: 1920,
      height: 1080,
      format: "jpeg"
    },
    storage: {
      provider: "local",
      key: "product-1234567890.jpg"
    }
  }
}
```

**Migration Steps:**
1. Create `MediaSchema` as shared schema
2. Update upload routes to return unified format
3. Add `source` parameter to upload endpoint
4. Store metadata alongside URL
5. Update Product model to use `media.primary` and `media.gallery`

### 4.2 Contact Information Module

**Current State:**
- Scattered phone/email fields
- Inconsistent address formats
- No contact type differentiation

**Target State:**
```javascript
// User contacts array
contacts: [
  {
    type: "email",
    value: "user@example.com",
    label: "primary",
    isVerified: true,
    isPrimary: true
  },
  {
    type: "phone",
    value: "6380470432",
    label: "primary",
    isVerified: false,
    isPrimary: true,
    metadata: { countryCode: "+91" }
  },
  {
    type: "whatsapp",
    value: "916380470432",
    label: "secondary",
    isPrimary: false
  }
]
```

### 4.3 Payment Module

**Current State:**
- Payment info duplicated in Order and Payment models
- Different field names for same data
- Gateway-specific fields mixed with generic

**Target State:**
- Order references Payment via `payment.paymentId`
- Payment model is single source of truth
- Gateway details nested under `gateway` object
- Unified refund handling

### 4.4 Email/Notification Module

**Current State:**
- Only receipt email tracked
- Flat fields on Order model
- No multi-channel support

**Target State:**
```javascript
// Order.notifications array
notifications: [
  {
    type: "order_confirmation",
    channel: "email",
    status: "delivered",
    recipient: { email: "user@example.com" },
    sentAt: "2026-02-02T10:00:00Z",
    deliveredAt: "2026-02-02T10:00:05Z"
  },
  {
    type: "shipping_update",
    channel: "sms",
    status: "sent",
    recipient: { phone: "+916380470432" },
    sentAt: "2026-02-02T14:00:00Z"
  }
]
```

---

## Part 5: Naming Conventions

### 5.1 Field Naming Standards

| Type | Convention | Example |
|------|------------|---------|
| Boolean | `is` or `has` prefix | `isActive`, `hasShipped` |
| Date | `At` suffix | `createdAt`, `deliveredAt` |
| Count | `Count` suffix | `itemCount`, `attemptCount` |
| ID reference | `Id` suffix | `orderId`, `paymentId` |
| Arrays | Plural nouns | `items`, `addresses`, `notifications` |
| Nested objects | Singular nouns | `customer.snapshot`, `payment.gateway` |

### 5.2 Status Value Standards

```javascript
// Entity Status
['draft', 'pending', 'active', 'inactive', 'suspended', 'deleted']

// Order Status
['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']

// Payment Status
['initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'refunded']

// Notification Status
['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked']
```

### 5.3 Collection Naming

| Model | Collection | Index Prefix |
|-------|------------|--------------|
| User | `users` | `idx_user_` |
| Product | `products` | `idx_product_` |
| Order | `orders` | `idx_order_` |
| Payment | `payments` | `idx_payment_` |
| ContactMessage | `contact_messages` | `idx_contact_` |

---

## Part 6: Validation Rules

### 6.1 Shared Validators

```javascript
// utils/validators.js

const validators = {
  // Indian phone number
  phone: {
    pattern: /^[6-9]\d{9}$/,
    message: 'Must be a valid 10-digit Indian mobile number'
  },
  
  // Indian pincode
  pincode: {
    pattern: /^[1-9][0-9]{5}$/,
    message: 'Must be a valid 6-digit Indian pincode'
  },
  
  // Email
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Must be a valid email address'
  },
  
  // GST Number
  gst: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: 'Must be a valid GST number'
  },
  
  // URL
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Must be a valid URL'
  },
  
  // Monetary amount
  amount: {
    min: 0,
    max: 10000000,  // 1 crore
    message: 'Amount must be between 0 and 1,00,00,000'
  }
};

module.exports = validators;
```

### 6.2 Schema-level Validation

```javascript
// Example: Product pricing validation
pricing: {
  basePrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
    max: [10000000, 'Price exceeds maximum allowed'],
    validate: {
      validator: Number.isFinite,
      message: 'Price must be a valid number'
    }
  },
  discountedPrice: {
    type: Number,
    validate: {
      validator: function(v) {
        return !v || v < this.pricing.basePrice;
      },
      message: 'Discounted price must be less than base price'
    }
  }
}
```

---

## Part 7: Migration Strategy

### 7.1 Phase 1: Create New Schemas (Week 1)

```bash
# Directory structure
backend/
├── schemas/              # NEW: Reusable schemas
│   ├── address.js
│   ├── audit.js
│   ├── contact.js
│   ├── media.js
│   ├── money.js
│   ├── notification.js
│   └── verificationToken.js
├── models/               # Updated models
│   ├── Product.js
│   ├── User.js
│   ├── Order.js
│   ├── Payment.js
│   └── ContactMessage.js
└── migrations/           # NEW: Migration scripts
    ├── 001_create_schemas.js
    ├── 002_migrate_products.js
    ├── 003_migrate_users.js
    ├── 004_migrate_orders.js
    └── 005_migrate_payments.js
```

### 7.2 Phase 2: Migration Scripts

```javascript
// migrations/002_migrate_products.js
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function migrateProducts() {
  const products = await Product.find({});
  
  for (const product of products) {
    // Migrate images to unified media structure
    const media = {
      primary: null,
      gallery: []
    };
    
    // Convert legacy 'image' field
    if (product.image && product.image !== 'default-product.jpg') {
      media.primary = {
        url: product.image,
        source: 'upload',
        type: 'image',
        metadata: {
          originalName: product.image.split('/').pop()
        },
        isPrimary: true,
        storage: {
          provider: 'local'
        }
      };
    }
    
    // Convert legacy 'images' array
    if (product.images && product.images.length > 0) {
      media.gallery = product.images.map((url, index) => ({
        url,
        source: 'upload',
        type: 'image',
        isPrimary: false,
        sortOrder: index,
        storage: {
          provider: 'local'
        }
      }));
    }
    
    // Update with new structure while keeping legacy fields
    await Product.updateOne(
      { _id: product._id },
      { 
        $set: { media },
        // Keep legacy fields for backwards compatibility
      }
    );
  }
  
  console.log(`Migrated ${products.length} products`);
}

module.exports = migrateProducts;
```

### 7.3 Phase 3: Gradual Deprecation

```javascript
// In Product model, add deprecation warnings
const ProductSchema = new mongoose.Schema({
  // NEW unified structure
  media: {
    primary: MediaSchema,
    gallery: [MediaSchema]
  },
  
  // DEPRECATED - Will be removed in v2.0
  image: {
    type: String,
    set: function(v) {
      console.warn('DEPRECATED: Use media.primary instead of image');
      return v;
    }
  },
  images: {
    type: [String],
    set: function(v) {
      console.warn('DEPRECATED: Use media.gallery instead of images');
      return v;
    }
  }
});

// Virtual to maintain backwards compatibility
ProductSchema.virtual('image').get(function() {
  return this.media?.primary?.url || 'default-product.jpg';
});

ProductSchema.virtual('images').get(function() {
  return this.media?.gallery?.map(m => m.url) || [];
});
```

### 7.4 Phase 4: API Versioning

```javascript
// routes/v1/products.js (Legacy support)
// routes/v2/products.js (New unified format)

// Response transformer for v1 compatibility
const transformProductV1 = (product) => ({
  ...product.toJSON(),
  image: product.media?.primary?.url || 'default-product.jpg',
  images: product.media?.gallery?.map(m => m.url) || []
});
```

---

## Part 8: Future Scalability Considerations

### 8.1 Sharding Strategy

```javascript
// Shard key recommendations
{
  users: { _id: 'hashed' },           // Hashed for even distribution
  products: { 'category.primary': 1 }, // Range-based for category queries
  orders: { 'customer.user': 1 },     // Customer-based for order history
  payments: { createdAt: 1 }          // Time-based for archival
}
```

### 8.2 Index Optimization

```javascript
// Compound indexes for common queries
OrderSchema.index(
  { 'customer.user': 1, 'status.current': 1, createdAt: -1 },
  { name: 'idx_customer_orders' }
);

ProductSchema.index(
  { 'category.primary': 1, status: 1, 'pricing.basePrice': 1 },
  { name: 'idx_category_products' }
);

PaymentSchema.index(
  { status: 1, 'method.type': 1, createdAt: -1 },
  { name: 'idx_payment_status' }
);
```

### 8.3 Caching Strategy

```javascript
// Redis cache patterns
const cachePatterns = {
  productList: 'products:category:{category}:page:{page}',
  productDetail: 'product:{id}',
  userCart: 'cart:user:{userId}',
  orderStatus: 'order:{orderId}:status',
  configCache: 'config:business'
};

// TTL recommendations
const cacheTTL = {
  productList: 300,      // 5 minutes
  productDetail: 600,    // 10 minutes
  userCart: 3600,        // 1 hour
  orderStatus: 60,       // 1 minute
  configCache: 86400     // 24 hours
};
```

### 8.4 Event Sourcing Ready

```javascript
// Events schema for future CQRS implementation
const EventSchema = new mongoose.Schema({
  aggregateType: {
    type: String,
    enum: ['Order', 'Payment', 'Product', 'User'],
    required: true
  },
  aggregateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  eventData: mongoose.Schema.Types.Mixed,
  metadata: {
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: Date,
    version: Number
  }
}, { timestamps: true });
```

---

## Part 9: Business Configuration Consolidation

### 9.1 Single Source of Truth

```javascript
// config/business.js - SINGLE FILE for all business config
module.exports = {
  identity: {
    name: 'Selvi Enterprise',
    tagline: 'Steel & Cement',
    legal: {
      fullName: 'Selvi Enterprise – Steel & Cement',
      gst: '33AADCS1234F1Z5',
      pan: 'AADCS1234F'
    }
  },
  
  owners: [
    { name: 'Anandan S', role: 'Owner', phone: '+91 6380470432' },
    { name: 'Raghavendran S', role: 'Owner', phone: '+91 7904775217' }
  ],
  
  contact: {
    phones: [
      { number: '+91 6380470432', label: 'primary', whatsapp: true },
      { number: '+91 7904775217', label: 'secondary', whatsapp: false }
    ],
    email: 'selvienterprises.ooty@gmail.com',
    website: 'www.selvienterprises.com'
  },
  
  location: {
    address: {
      line1: 'Opposite to Eye Foundation',
      line2: 'Coonoor Main Road',
      city: 'Ooty',
      state: 'Tamil Nadu',
      pincode: '643001',
      country: 'India'
    },
    coordinates: {
      lat: 11.4036779,
      lng: 76.7145812
    },
    googleMapsUrl: 'https://goo.gl/maps/...'
  },
  
  payment: {
    upi: {
      id: 'selvinaga21@okaxis',
      displayName: 'Selvi Enterprise'
    },
    acceptedMethods: ['cod', 'upi', 'online'],
    currency: 'INR'
  },
  
  hours: {
    weekdays: { open: '09:00', close: '17:00' },
    saturday: { open: '09:00', close: '17:00' },
    sunday: 'closed'
  }
};
```

### 9.2 Frontend Sync

```javascript
// API endpoint to serve config to frontend
// GET /api/config/business
router.get('/business', (req, res) => {
  const config = require('../config/business');
  
  // Remove sensitive data
  const publicConfig = {
    identity: config.identity,
    owners: config.owners.map(o => ({ name: o.name, role: o.role })),
    contact: config.contact,
    location: config.location,
    payment: {
      upi: config.payment.upi,
      acceptedMethods: config.payment.acceptedMethods
    },
    hours: config.hours
  };
  
  res.json({ success: true, config: publicConfig });
});
```

---

## Part 10: Implementation Checklist

### Phase 1: Schema Creation
- [ ] Create `schemas/` directory
- [ ] Create `MediaSchema`
- [ ] Create `AddressSchema`
- [ ] Create `ContactSchema`
- [ ] Create `VerificationTokenSchema`
- [ ] Create `NotificationSchema`
- [ ] Create `AuditSchema`
- [ ] Create `MoneySchema`

### Phase 2: Model Updates
- [ ] Update `Product` model
- [ ] Update `User` model
- [ ] Update `Order` model
- [ ] Update `Payment` model
- [ ] Update `ContactMessage` model

### Phase 3: Migration
- [ ] Write migration scripts
- [ ] Test migrations on staging
- [ ] Backup production database
- [ ] Run migrations
- [ ] Verify data integrity

### Phase 4: API Updates
- [ ] Update upload endpoints
- [ ] Update product CRUD
- [ ] Update order CRUD
- [ ] Update payment handlers
- [ ] Add backwards compatibility layer

### Phase 5: Frontend Updates
- [ ] Update image upload components
- [ ] Update product display components
- [ ] Update order forms
- [ ] Sync business config from API

### Phase 6: Cleanup
- [ ] Remove deprecated fields
- [ ] Remove duplicate config files
- [ ] Update documentation
- [ ] Performance testing

---

## Conclusion

This consolidation strategy transforms the current fragmented database design into a unified, scalable architecture. Key benefits:

1. **Reduced Redundancy**: Shared schemas eliminate duplicate code
2. **Consistency**: Standardized naming and structures across all models
3. **Flexibility**: Unified media/contact/address schemas support any input source
4. **Auditability**: Built-in history tracking on all major entities
5. **Scalability**: Designed for future sharding and caching
6. **Maintainability**: Single source of truth for business configuration

The migration is designed to be gradual, maintaining backwards compatibility while transitioning to the new structure.
