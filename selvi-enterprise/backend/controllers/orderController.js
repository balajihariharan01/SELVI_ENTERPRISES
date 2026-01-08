const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendReceiptEmail, testEmailConfiguration, getEmailServiceStatus } = require('../services/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Validate and calculate order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product not available: ${product.productName}`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}`
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product: product._id,
        productName: product.productName,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        subtotal
      });

      // Reduce stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      notes,
      statusHistory: [{
        status: 'pending',
        updatedBy: req.user.id
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'productName image');

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'productName image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
      processing: orders.filter(o => o.orderStatus === 'processing').length,
      shipped: orders.filter(o => o.orderStatus === 'shipped').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.orderStatus !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };

    res.json({
      success: true,
      stats,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    order.orderStatus = status;
    if (adminNotes) order.adminNotes = adminNotes;
    
    // Add to status history
    order.statusHistory.push({
      status,
      updatedBy: req.user.id
    });

    // Update payment status if delivered
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check 24-hour modification limit
    if (!order.isModifiable) {
      const hoursSinceCreation = Math.round((Date.now() - order.createdAt) / (1000 * 60 * 60));
      return res.status(400).json({
        success: false,
        message: `Order modification period has expired. Orders can only be cancelled within 24 hours of placement. This order was placed ${hoursSinceCreation} hours ago.`
      });
    }

    // Only pending orders can be cancelled by user
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      updatedBy: req.user.id
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order (User - only pending orders within 24 hours)
// @route   PUT /api/orders/:id/update
// @access  Private
exports.updateOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Check 24-hour modification limit
    if (!order.isModifiable) {
      const hoursSinceCreation = Math.round((Date.now() - order.createdAt) / (1000 * 60 * 60));
      return res.status(400).json({
        success: false,
        message: `Order modification period has expired. Orders can only be modified within 24 hours of placement. This order was placed ${hoursSinceCreation} hours ago.`
      });
    }

    // Only pending orders can be updated
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be modified. This order is already being processed.'
      });
    }

    // If items are being updated
    if (items && items.length > 0) {
      // First, restore the stock for current items
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }

      // Validate and calculate new order items
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          // Rollback: restore original stock reduction
          for (const origItem of order.items) {
            await Product.findByIdAndUpdate(origItem.product, {
              $inc: { stockQuantity: -origItem.quantity }
            });
          }
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.productId}`
          });
        }

        if (product.status !== 'active') {
          // Rollback
          for (const origItem of order.items) {
            await Product.findByIdAndUpdate(origItem.product, {
              $inc: { stockQuantity: -origItem.quantity }
            });
          }
          return res.status(400).json({
            success: false,
            message: `Product not available: ${product.productName}`
          });
        }

        if (product.stockQuantity < item.quantity) {
          // Rollback
          for (const origItem of order.items) {
            await Product.findByIdAndUpdate(origItem.product, {
              $inc: { stockQuantity: -origItem.quantity }
            });
          }
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}`
          });
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          product: product._id,
          productName: product.productName,
          price: product.price,
          quantity: item.quantity,
          unit: product.unit,
          subtotal
        });

        // Reduce stock for new items
        product.stockQuantity -= item.quantity;
        await product.save();
      }

      order.items = orderItems;
      order.totalAmount = totalAmount;
    }

    // Update shipping address if provided
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    // Update notes if provided
    if (notes !== undefined) {
      order.notes = notes;
    }

    // Add to status history
    order.statusHistory.push({
      status: 'updated',
      updatedBy: req.user.id
    });

    await order.save();

    // Populate and return updated order
    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phone')
      .populate('items.product', 'productName image');

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order (User - only pending orders)
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order'
      });
    }

    // Only pending orders can be deleted
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be deleted. Please contact support for assistance.'
      });
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/orders/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const orders = await Order.find();
    const products = await Product.find();
    const User = require('../models/User');
    const users = await User.find({ role: 'user' });

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);

    // This month's revenue
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = orders
      .filter(o => new Date(o.createdAt) >= thisMonth && o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      todayOrders: todayOrders.length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      lowStockProducts: products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length,
      outOfStockProducts: products.filter(p => p.stockQuantity === 0).length,
      totalCustomers: users.length,
      totalRevenue: orders
        .filter(o => o.orderStatus !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      monthlyRevenue,
      recentOrders: orders.slice(0, 5)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue analytics with date filter (Admin)
// @route   GET /api/orders/admin/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;

    let dateFilter = {};
    let periodLabel = 'All Time';

    // Handle date filtering
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
        dateFilter.createdAt.$gte.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
        dateFilter.createdAt.$lte.setHours(23, 59, 59, 999);
      }
      periodLabel = `${startDate || 'Start'} to ${endDate || 'Present'}`;
    } else if (period) {
      const now = new Date();
      
      switch (period) {
        case 'today':
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          dateFilter.createdAt = { $gte: today };
          periodLabel = 'Today';
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter.createdAt = { $gte: weekAgo };
          periodLabel = 'Last 7 Days';
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.createdAt = { $gte: monthStart };
          periodLabel = 'This Month';
          break;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter.createdAt = { $gte: yearStart };
          periodLabel = 'This Year';
          break;
        default:
          break;
      }
    }

    // Fetch orders with date filter
    // Only consider successfully paid and delivered/confirmed orders for revenue
    const revenueOrders = await Order.find({
      ...dateFilter,
      orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
      paymentStatus: { $in: ['paid', 'pending'] } // Exclude failed payments
    });

    // Calculate metrics
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = revenueOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment method breakdown
    const paymentBreakdown = {
      cod: revenueOrders.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + o.totalAmount, 0),
      online: revenueOrders.filter(o => o.paymentMethod === 'online').reduce((sum, o) => sum + o.totalAmount, 0),
      upi: revenueOrders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.totalAmount, 0)
    };

    // Status breakdown
    const statusBreakdown = {
      confirmed: revenueOrders.filter(o => o.orderStatus === 'confirmed').length,
      processing: revenueOrders.filter(o => o.orderStatus === 'processing').length,
      shipped: revenueOrders.filter(o => o.orderStatus === 'shipped').length,
      delivered: revenueOrders.filter(o => o.orderStatus === 'delivered').length
    };

    // Daily revenue for the period (for charts)
    const dailyRevenue = await Order.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      period: periodLabel,
      analytics: {
        totalRevenue,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue),
        paymentBreakdown,
        statusBreakdown,
        dailyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend receipt email for an order
// @route   POST /api/orders/:id/resend-receipt
// @access  Private/Admin
exports.resendReceiptEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send receipt for unpaid order'
      });
    }

    // Get customer email
    const customerEmail = order.user?.email || order.shippingAddress?.email;
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'No customer email found for this order'
      });
    }

    // Update attempt count
    order.receiptEmailAttempts = (order.receiptEmailAttempts || 0) + 1;
    await order.save();

    // Try to send email
    try {
      const result = await sendReceiptEmail(order);
      
      // Update order with success
      order.receiptEmailStatus = 'sent';
      order.receiptEmailSentAt = new Date();
      order.receiptEmailError = null;
      await order.save();

      res.json({
        success: true,
        message: `Receipt email sent successfully to ${customerEmail}`,
        messageId: result.messageId
      });
    } catch (emailError) {
      // Update order with failure
      order.receiptEmailStatus = 'failed';
      order.receiptEmailError = emailError.message;
      await order.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send receipt email',
        error: emailError.message,
        code: emailError.code
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get email service status
// @route   GET /api/orders/admin/email-status
// @access  Private/Admin
exports.getEmailStatus = async (req, res, next) => {
  try {
    const status = getEmailServiceStatus();
    const testResult = await testEmailConfiguration();

    // Get orders with failed email status
    const failedEmailOrders = await Order.find({
      receiptEmailStatus: 'failed'
    }).select('orderNumber creiptEmailError receiptEmailAttempts createdAt shippingAddress')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      emailService: status,
      connectionTest: testResult,
      failedEmailOrders: failedEmailOrders.map(o => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        error: o.receiptEmailError,
        attempts: o.receiptEmailAttempts,
        createdAt: o.createdAt,
        customerEmail: o.shippingAddress?.email
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test email configuration
// @route   POST /api/orders/admin/test-email
// @access  Private/Admin
exports.testEmail = async (req, res, next) => {
  try {
    const testResult = await testEmailConfiguration();
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration test failed',
        ...testResult
      });
    }

    res.json({
      success: true,
      message: 'Email service is working correctly',
      ...testResult
    });
  } catch (error) {
    next(error);
  }
};
