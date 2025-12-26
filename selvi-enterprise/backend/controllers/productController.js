const Product = require('../models/Product');

// @desc    Get all products (public)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, inStock, sort } = req.query;

    // Build query
    let query = { status: 'active' };

    // Filter by category
    if (category) {
      query.category = category.toLowerCase();
    }

    // Search by name or brand
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // In stock filter
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { productName: 1 };

    const products = await Product.find(query).sort(sortOption);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stock (Admin)
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (operation === 'add') {
      product.stockQuantity += quantity;
    } else if (operation === 'subtract') {
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      product.stockQuantity -= quantity;
    } else {
      product.stockQuantity = quantity;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products including inactive (Admin)
// @route   GET /api/products/admin/all
// @access  Private/Admin
exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const stats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      inactive: products.filter(p => p.status === 'inactive').length,
      lowStock: products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length,
      outOfStock: products.filter(p => p.stockQuantity === 0).length
    };

    res.json({
      success: true,
      stats,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products (Admin)
// @route   GET /api/products/admin/low-stock
// @access  Private/Admin
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
    }).sort({ stockQuantity: 1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available categories and units
// @route   GET /api/products/meta/options
// @access  Public
exports.getProductOptions = async (req, res, next) => {
  try {
    const categories = Product.getCategories();
    const units = Product.getUnits();
    
    // Also get unique categories from existing products
    const usedCategories = await Product.distinct('category');
    const usedUnits = await Product.distinct('unit');

    res.json({
      success: true,
      categories: [...new Set([...categories, ...usedCategories])].sort(),
      units: [...new Set([...units, ...usedUnits])].sort()
    });
  } catch (error) {
    next(error);
  }
};
