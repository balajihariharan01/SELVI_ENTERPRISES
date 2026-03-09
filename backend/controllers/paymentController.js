const Stripe = require('stripe');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendReceiptEmail } = require('../services/emailService');

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
    const order = await Order.findById(orderId).populate('user', 'name email phone');

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

    // Create or update payment record (idempotent)
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    
    if (!payment) {
      payment = new Payment({
        paymentId: Payment.generatePaymentId(), // Explicitly set to avoid validation issues
        order: order._id,
        orderNumber: order.orderNumber,
        user: order.user._id || order.user,
        customerName: order.shippingAddress?.name || order.user?.name || req.user.name || 'N/A',
        customerEmail: order.user?.email || req.user.email || 'N/A',
        customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
        paymentMethod: 'stripe',
        transactionId: paymentIntentId,
        stripePaymentIntentId: paymentIntentId,
        amount: order.totalAmount,
        status: 'success',
        paymentDate: new Date(),
        gatewayResponse: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
      await payment.save();
      console.log(`Payment record created for order ${order.orderNumber}`);

      // Send receipt email to customer with tracking
      order.receiptEmailAttempts = (order.receiptEmailAttempts || 0) + 1;
      
      sendReceiptEmail(order)
        .then(async (result) => {
          console.log(`✅ Receipt email sent for order ${order.orderNumber}`);
          // Update order with email success
          await Order.findByIdAndUpdate(order._id, {
            receiptEmailStatus: 'sent',
            receiptEmailSentAt: new Date(),
            receiptEmailError: null
          });
        })
        .catch(async (err) => {
          console.error(`⚠️ Failed to send receipt email for order ${order.orderNumber}:`, err.message);
          // Update order with email failure
          await Order.findByIdAndUpdate(order._id, {
            receiptEmailStatus: 'failed',
            receiptEmailError: err.message
          });
        });
    } else if (payment.status !== 'success') {
      payment.status = 'success';
      payment.paymentDate = new Date();
      await payment.save();
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      order,
      payment: {
        paymentId: payment.paymentId,
        transactionId: payment.transactionId,
        status: payment.status
      }
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

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    
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

      // Create or update payment record
      let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      
      if (!payment) {
        payment = new Payment({
          paymentId: Payment.generatePaymentId(), // Explicitly set to avoid validation issues
          order: order._id,
          orderNumber: order.orderNumber,
          user: order.user._id || order.user,
          customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
          amount: order.totalAmount,
          status: 'success',
          paymentDate: new Date(),
          gatewayResponse: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          }
        });
      } else {
        payment.status = 'success';
        payment.paymentDate = new Date();
        payment.gatewayResponse = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        };
      }
      
      await payment.save();
      console.log(`Payment record created/updated for order ${order.orderNumber}`);

      // Send receipt email to customer (non-blocking, webhook context)
      sendReceiptEmail(order).catch(err => {
        console.error(`⚠️ Webhook: Failed to send receipt email for order ${order.orderNumber}:`, err.message);
      });
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

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    
    if (!order) {
      console.error('Order not found for payment:', orderId);
      return;
    }

    // Update payment status to failed
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'failed';
      await order.save();
      console.log(`Order ${order.orderNumber} payment failed via webhook`);

      // Create or update payment record
      let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      
      if (!payment) {
        payment = new Payment({
          paymentId: Payment.generatePaymentId(), // Explicitly set to avoid validation issues
          order: order._id,
          orderNumber: order.orderNumber,
          user: order.user._id || order.user,
          customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
          amount: order.totalAmount,
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          gatewayResponse: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            error: paymentIntent.last_payment_error
          }
        });
      } else {
        payment.status = 'failed';
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
        payment.gatewayResponse = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          error: paymentIntent.last_payment_error
        };
      }
      
      await payment.save();
      console.log(`Payment failure recorded for order ${order.orderNumber}`);
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

      // Update payment record if exists
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (payment) {
        payment.status = 'cancelled';
        await payment.save();
      }
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error.message);
  }
}

// ==================== ADMIN PAYMENT ENDPOINTS ====================

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, method, startDate, endDate, search, page = 1, limit = 50, syncStatus } = req.query;

    let query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Method filter
    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Sync status filter (synced vs manual)
    if (syncStatus && syncStatus !== 'all') {
      if (syncStatus === 'synced') {
        query.transactionId = { $regex: /^(SYNC_|COD_)/ };
      } else if (syncStatus === 'gateway') {
        query.transactionId = { $not: { $regex: /^(SYNC_|COD_)/ } };
      }
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { paymentId: searchRegex },
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { transactionId: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber totalAmount orderStatus items shippingAddress')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPayments = await Payment.countDocuments(query);

    // Calculate stats from database (not cached) - using aggregation for efficiency
    const statsAggregation = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0]
            }
          },
          successfulPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    const stats = statsAggregation[0] || {
      totalRevenue: 0,
      successfulPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalPayments: 0
    };

    // Get last sync timestamp from metadata or most recent synced payment
    const lastSyncedPayment = await Payment.findOne({ 
      transactionId: { $regex: /^(SYNC_|COD_)/ } 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      total: totalPayments,
      page: parseInt(page),
      pages: Math.ceil(totalPayments / parseInt(limit)),
      stats,
      lastSyncedAt: lastSyncedPayment?.createdAt || null,
      payments
    });
  } catch (error) {
    console.error('Get All Payments Error:', error.message);
    next(error);
  }
};

// @desc    Get payment by ID (Admin)
// @route   GET /api/payments/admin/:id
// @access  Private/Admin
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('user', 'name email phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics (Admin)
// @route   GET /api/payments/admin/stats
// @access  Private/Admin
exports.getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const allPayments = await Payment.find(dateQuery);

    // Calculate various stats
    const successPayments = allPayments.filter(p => p.status === 'success');
    const pendingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'processing');
    const failedPayments = allPayments.filter(p => p.status === 'failed');

    // Revenue by payment method
    const stripePayments = successPayments.filter(p => p.paymentMethod === 'stripe');
    const codPayments = successPayments.filter(p => p.paymentMethod === 'cod');
    const upiPayments = successPayments.filter(p => p.paymentMethod === 'upi');

    // Daily revenue for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPayments = successPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate || p.createdAt);
        return paymentDate >= date && paymentDate < nextDate;
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        count: dayPayments.length
      });
    }

    res.json({
      success: true,
      stats: {
        totalRevenue: successPayments.reduce((sum, p) => sum + p.amount, 0),
        totalPayments: allPayments.length,
        successfulPayments: successPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        averageOrderValue: successPayments.length > 0 
          ? successPayments.reduce((sum, p) => sum + p.amount, 0) / successPayments.length 
          : 0,
        byMethod: {
          stripe: {
            count: stripePayments.length,
            revenue: stripePayments.reduce((sum, p) => sum + p.amount, 0)
          },
          cod: {
            count: codPayments.length,
            revenue: codPayments.reduce((sum, p) => sum + p.amount, 0)
          },
          upi: {
            count: upiPayments.length,
            revenue: upiPayments.reduce((sum, p) => sum + p.amount, 0)
          }
        },
        last7Days
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync payments from orders (Admin utility)
// @route   POST /api/payments/admin/sync
// @access  Private/Admin
exports.syncPaymentsFromOrders = async (req, res, next) => {
  const syncResults = {
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    details: {
      onlinePayments: { synced: 0, skipped: 0 },
      codPayments: { synced: 0, skipped: 0 }
    }
  };

  try {
    console.log('=== Starting Payment Sync ===');
    
    // 1. Sync Online Payments (paid orders with paymentIntentId)
    const paidOnlineOrders = await Order.find({ 
      paymentStatus: 'paid',
      paymentMethod: 'online',
      orderStatus: { $nin: ['cancelled'] } // Don't sync cancelled orders
    }).populate('user', 'name email phone');

    console.log(`Found ${paidOnlineOrders.length} paid online orders to check`);

    for (const order of paidOnlineOrders) {
      try {
        // Check for existing payment by order ID or payment intent ID
        const existingPayment = await Payment.findOne({
          $or: [
            { order: order._id },
            { stripePaymentIntentId: order.paymentIntentId }
          ]
        });
        
        if (existingPayment) {
          syncResults.skipped++;
          syncResults.details.onlinePayments.skipped++;
          continue;
        }

        // Validate order has required data
        if (!order.totalAmount || order.totalAmount <= 0) {
          syncResults.failed++;
          syncResults.errors.push({
            orderNumber: order.orderNumber,
            reason: 'Invalid or missing order amount'
          });
          continue;
        }

        // Create payment record with explicit paymentId
        const paymentId = Payment.generatePaymentId();
        await Payment.create({
          paymentId, // Explicitly set to avoid validation issues
          order: order._id,
          orderNumber: order.orderNumber,
          user: order.user?._id || order.user,
          customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
          paymentMethod: 'stripe',
          transactionId: order.paymentIntentId || `SYNC_${order.orderNumber}_${Date.now()}`,
          stripePaymentIntentId: order.paymentIntentId || null,
          amount: order.totalAmount,
          status: 'success',
          paymentDate: order.updatedAt || order.createdAt
        });
        
        syncResults.synced++;
        syncResults.details.onlinePayments.synced++;
        console.log(`✓ Synced payment for order ${order.orderNumber}`);
      } catch (orderError) {
        syncResults.failed++;
        syncResults.errors.push({
          orderNumber: order.orderNumber,
          reason: orderError.message
        });
        console.error(`✗ Failed to sync order ${order.orderNumber}:`, orderError.message);
      }
    }

    // 2. Sync COD Payments (delivered orders only - payment received)
    const deliveredCodOrders = await Order.find({ 
      paymentMethod: 'cod',
      orderStatus: 'delivered' // Only delivered COD orders count as paid
    }).populate('user', 'name email phone');

    console.log(`Found ${deliveredCodOrders.length} delivered COD orders to check`);

    for (const order of deliveredCodOrders) {
      try {
        const existingPayment = await Payment.findOne({ order: order._id });
        
        if (existingPayment) {
          syncResults.skipped++;
          syncResults.details.codPayments.skipped++;
          continue;
        }

        // Validate order amount
        if (!order.totalAmount || order.totalAmount <= 0) {
          syncResults.failed++;
          syncResults.errors.push({
            orderNumber: order.orderNumber,
            reason: 'Invalid or missing order amount'
          });
          continue;
        }

        // Create COD payment record with explicit paymentId
        const paymentId = Payment.generatePaymentId();
        await Payment.create({
          paymentId, // Explicitly set to avoid validation issues
          order: order._id,
          orderNumber: order.orderNumber,
          user: order.user?._id || order.user,
          customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
          paymentMethod: 'cod',
          transactionId: `COD_${order.orderNumber}_${Date.now()}`,
          amount: order.totalAmount,
          status: 'success',
          paymentDate: order.updatedAt || order.createdAt
        });
        
        syncResults.synced++;
        syncResults.details.codPayments.synced++;
        console.log(`✓ Synced COD payment for order ${order.orderNumber}`);
      } catch (orderError) {
        syncResults.failed++;
        syncResults.errors.push({
          orderNumber: order.orderNumber,
          reason: orderError.message
        });
        console.error(`✗ Failed to sync COD order ${order.orderNumber}:`, orderError.message);
      }
    }

    // 3. Create pending payment records for pending orders (for tracking)
    const pendingOnlineOrders = await Order.find({
      paymentMethod: 'online',
      paymentStatus: 'pending',
      orderStatus: { $nin: ['cancelled'] },
      paymentIntentId: { $exists: true, $ne: null }
    }).populate('user', 'name email phone');

    for (const order of pendingOnlineOrders) {
      try {
        const existingPayment = await Payment.findOne({ order: order._id });
        
        if (!existingPayment) {
          const paymentId = Payment.generatePaymentId();
          await Payment.create({
            paymentId, // Explicitly set to avoid validation issues
            order: order._id,
            orderNumber: order.orderNumber,
            user: order.user?._id || order.user,
            customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
            customerEmail: order.user?.email || 'N/A',
            customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
            paymentMethod: 'stripe',
            transactionId: order.paymentIntentId || `PENDING_${order.orderNumber}`,
            stripePaymentIntentId: order.paymentIntentId || null,
            amount: order.totalAmount,
            status: 'pending',
            paymentDate: null
          });
        }
      } catch (err) {
        // Ignore pending order sync errors
      }
    }

    console.log('=== Payment Sync Complete ===');
    console.log(`Synced: ${syncResults.synced}, Skipped: ${syncResults.skipped}, Failed: ${syncResults.failed}`);

    // Build response message
    let message = '';
    if (syncResults.synced > 0) {
      message = `Successfully synced ${syncResults.synced} payment(s).`;
    } else if (syncResults.skipped > 0 && syncResults.synced === 0) {
      message = `All ${syncResults.skipped} payment records already exist. No new payments to sync.`;
    } else {
      message = 'No payments found to sync.';
    }

    if (syncResults.failed > 0) {
      message += ` ${syncResults.failed} failed.`;
    }

    res.json({
      success: true,
      message,
      ...syncResults,
      syncedAt: new Date()
    });
  } catch (error) {
    console.error('Sync Payments Error:', error);
    
    // Return detailed error response
    res.status(500).json({
      success: false,
      message: 'Payment sync failed',
      error: {
        type: error.name || 'SyncError',
        message: error.message,
        code: error.code || 'SYNC_FAILED'
      },
      partialResults: syncResults
    });
  }
};

// @desc    Verify payment with Stripe gateway
// @route   POST /api/payments/admin/verify/:paymentId
// @access  Private/Admin
exports.verifyPaymentWithGateway = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Only verify Stripe payments
    if (payment.paymentMethod !== 'stripe' || !payment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'This payment cannot be verified with gateway (not a Stripe payment)'
      });
    }

    try {
      // Retrieve from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

      // Update payment status based on Stripe status
      let newStatus = payment.status;
      if (paymentIntent.status === 'succeeded') {
        newStatus = 'success';
      } else if (paymentIntent.status === 'processing') {
        newStatus = 'processing';
      } else if (paymentIntent.status === 'canceled') {
        newStatus = 'cancelled';
      } else if (paymentIntent.status === 'requires_payment_method') {
        newStatus = 'failed';
      }

      // Update if status changed
      if (newStatus !== payment.status) {
        payment.status = newStatus;
        payment.gatewayResponse = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          verifiedAt: new Date()
        };
        await payment.save();
      }

      res.json({
        success: true,
        message: 'Payment verified with Stripe',
        gatewayStatus: paymentIntent.status,
        localStatus: payment.status,
        verified: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });
    } catch (stripeError) {
      // Gateway verification failed
      res.status(503).json({
        success: false,
        message: 'Gateway temporarily unavailable',
        error: {
          type: 'GatewayError',
          message: stripeError.message,
          code: stripeError.code || 'GATEWAY_ERROR'
        },
        fallback: {
          localStatus: payment.status,
          amount: payment.amount,
          paymentDate: payment.paymentDate
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
