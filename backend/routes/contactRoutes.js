const express = require('express');
const router = express.Router();
const { sendContactMessage, getContactMessages, resendContactEmail } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/contact - Send contact form message
router.post('/', sendContactMessage);

// Admin routes
router.get('/admin/messages', protect, adminOnly, getContactMessages);
router.post('/admin/:id/resend', protect, adminOnly, resendContactEmail);

module.exports = router;
