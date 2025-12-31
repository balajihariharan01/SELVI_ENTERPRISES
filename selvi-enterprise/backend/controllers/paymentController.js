const Stripe = require('stripe');
const Order = require('../models/Order');

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent for an order
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, amount, email } = req.body;

    // Debug logging (temporary)
    console.log('=== PAYMENT INTENT DEBUG ===');
    console.log('Received orderId:', orderId);
    console.log('Received amount:', amount);
    console.log('Amount type:', typeof amount);
    console.log('Email:', email);

    // Validate required fields
    if (!orderId || amount === undefined || amount === null) {
      console.log('Validation failed: Missing orderId or amount');
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount are required'
      });
    }

    // Convert amount to number if string
    const numericAmount = Number(amount);

    // Validate amount is positive
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log('Validation failed: Amount is not positive. Received:', amount, 'Converted:', numericAmount);
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Find the order and verify it belongs to the user
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order found:', order._id);
    console.log('Order totalAmount:', order.totalAmount);

    // Verify order belongs to authenticated user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Server-side amount validation - use order's total amount
    // This prevents price tampering from frontend
    const serverAmount = order.totalAmount;

    // Check if amounts match (with small tolerance for floating point)
    if (Math.abs(serverAmount - numericAmount) > 0.01) {
      console.log('Amount mismatch! Server:', serverAmount, 'Client:', numericAmount);
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch. Please refresh and try again.'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Convert amount to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(serverAmount * 100);
    
    console.log('Creating PaymentIntent with amount in paise:', amountInPaise);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId,
        orderNumber: order.orderNumber,
        userId: req.user.id
      },
      receipt_email: email || req.user.email,
      description: `Payment for Order #${order.orderNumber}`
    });

    console.log('PaymentIntent created successfully:', paymentIntent.id);

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    order.paymentMethod = 'online';
    await order.save();

    // Return only client_secret to frontend
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent Error:', error.message);
    next(error);
  }
};

// @desc    Get payment status for an order
// @route   GET /api/payments/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to authenticated user or user is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      paymentIntentId: order.paymentIntentId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment and update order status
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and order ID are required'
      });
    }

    // Retrieve payment intent from Stripe to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed',
        status: paymentIntent.status
      });
    }

    // Find and update order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the payment intent matches the order
    if (order.paymentIntentId !== paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent does not match order'
      });
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      updatedAt: new Date(),
      updatedBy: req.user.id
    });
    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm Payment Error:', error.message);
    next(error);
  }
};

// @desc    Stripe Webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe signature verified)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return 200 to acknowledge receipt
  res.json({ received: true });
};

// Helper: Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('Order not found for payment:', orderId);
      return;
    }

    // Only update if not already paid (idempotency)
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.paymentIntentId = paymentIntent.id;
      order.statusHistory.push({
        status: 'confirmed',
        updatedAt: new Date()
      });
      await order.save();
      console.log(`Order ${order.orderNumber} marked as paid via webhook`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error.message);
  }
}

// Helper: Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId in payment intent metadata');
      return;
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('Order not found for payment:', orderId);
      return;
    }

    // Update payment status to failed
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'failed';
      await order.save();
      console.log(`Order ${order.orderNumber} payment failed via webhook`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error.message);
  }
}

// Helper: Handle canceled payment
async function handlePaymentCanceled(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) return;

    const order = await Order.findById(orderId);
    
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'pending';
      await order.save();
      console.log(`Order ${order.orderNumber} payment canceled via webhook`);
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error.message);
  }
}
