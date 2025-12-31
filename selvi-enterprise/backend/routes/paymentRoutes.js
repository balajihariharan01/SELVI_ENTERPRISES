const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  getPaymentStatus,
  confirmPayment,
  handleWebhook
} = require('../controllers/paymentController');

// Webhook route - must be before express.json() middleware
// Uses raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-intent', protect, createPaymentIntent);
router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/confirm', protect, confirmPayment);

module.exports = router;
