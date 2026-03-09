const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createPaymentIntent,
  getPaymentStatus,
  confirmPayment,
  handleWebhook,
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  syncPaymentsFromOrders,
  verifyPaymentWithGateway
} = require('../controllers/paymentController');

// Webhook route - must be before express.json() middleware
// Uses raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes (User)
router.post('/create-intent', protect, createPaymentIntent);
router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/confirm', protect, confirmPayment);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllPayments);
router.get('/admin/stats', protect, adminOnly, getPaymentStats);
router.post('/admin/sync', protect, adminOnly, syncPaymentsFromOrders);
router.post('/admin/verify/:paymentId', protect, adminOnly, verifyPaymentWithGateway);
router.get('/admin/:id', protect, adminOnly, getPaymentById);

module.exports = router;
