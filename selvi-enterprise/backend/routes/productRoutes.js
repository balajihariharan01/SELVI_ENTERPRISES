const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect, adminOnly } = require('../middleware/auth');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getAllProductsAdmin,
  getLowStockProducts
} = require('../controllers/productController');

// Validation rules
const productValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('category').isIn(['cement', 'steel', 'other']).withMessage('Invalid category'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('unit').isIn(['bags', 'kg', 'tons', 'pieces', 'rods', 'bundles']).withMessage('Invalid unit'),
  handleValidationErrors
];

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllProductsAdmin);
router.get('/admin/low-stock', protect, adminOnly, getLowStockProducts);
router.post('/', protect, adminOnly, productValidation, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.put('/:id/stock', protect, adminOnly, updateStock);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
