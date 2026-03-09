const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { protect, adminOnly } = require('../middleware/auth');

const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updateOrder,
  deleteOrder,
  getDashboardStats,
  getRevenueAnalytics,
  resendReceiptEmail,
  getEmailStatus,
  testEmail
} = require('../controllers/orderController');

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.name').trim().notEmpty().withMessage('Name is required'),
  body('shippingAddress.phone').matches(/^[0-9]{10}$/).withMessage('Valid phone number required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode required'),
  handleValidationErrors
];

// User routes
router.post('/', protect, orderValidation, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/update', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/dashboard', protect, adminOnly, getDashboardStats);
router.get('/admin/revenue', protect, adminOnly, getRevenueAnalytics);
router.get('/admin/email-status', protect, adminOnly, getEmailStatus);
router.post('/admin/test-email', protect, adminOnly, testEmail);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.post('/:id/resend-receipt', protect, adminOnly, resendReceiptEmail);

module.exports = router;
