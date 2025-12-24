const Order = require('../models/Order');
const Product = require('../models/Product');

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

// @desc    Update order (User - only pending orders)
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
