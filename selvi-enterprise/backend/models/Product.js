const mongoose = require('mongoose');

// SIMPLE CATEGORY LIST - Only 3 categories
const PRODUCT_CATEGORIES = [
  'cement',
  'steel',
  'others'
];

// Unit list for construction materials
const PRODUCT_UNITS = [
  'bags',
  'kg',
  'tons',
  'pieces',
  'rods',
  'bundles',
  'loads',
  'cft',
  'sqft',
  'meters',
  'feet',
  'liters',
  'boxes',
  'sets',
  'numbers'
];

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide product category'],
    lowercase: true,
    validate: {
      validator: function(v) {
        // Allow any category - flexible system
        return v && v.trim().length > 0;
      },
      message: 'Category cannot be empty'
    }
  },
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },
  brand: {
    type: String,
    required: [true, 'Please provide brand name'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specifications: {
    type: String,
    maxlength: [1000, 'Specifications cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Please provide unit of measurement'],
    lowercase: true,
    validate: {
      validator: function(v) {
        // Allow any unit - flexible system
        return v && v.trim().length > 0;
      },
      message: 'Unit cannot be empty'
    },
    default: 'pieces'
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  image: {
    type: String,
    default: 'default-product.jpg'
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to get all available categories
productSchema.statics.getCategories = function() {
  return PRODUCT_CATEGORIES;
};

// Static method to get all available units
productSchema.statics.getUnits = function() {
  return PRODUCT_UNITS;
};

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.lowStockThreshold;
});

// Virtual for checking in stock
productSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

// Enable virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
