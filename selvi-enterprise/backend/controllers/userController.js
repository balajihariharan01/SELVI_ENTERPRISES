const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's orders
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(o => o.orderStatus !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      completedOrders: orders.filter(o => o.orderStatus === 'delivered').length
    };

    res.json({
      success: true,
      user,
      stats,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with stats (Admin)
// @route   GET /api/users/customers
// @access  Private/Admin
exports.getCustomers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

    // Get order stats for each user
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id });
        const completedOrders = orders.filter(o => o.status !== 'cancelled');
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt,
          orderCount: completedOrders.length,
          totalSpent: completedOrders.reduce((sum, o) => sum + o.totalAmount, 0)
        };
      })
    );

    // Calculate stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const activeThisMonth = await Order.distinct('user', {
      createdAt: { $gte: thisMonth }
    });

    const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });

    res.json({
      success: true,
      customers: customersWithStats,
      stats: {
        total: users.length,
        activeThisMonth: activeThisMonth.length,
        totalOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get frequent buyers (Admin)
// @route   GET /api/users/frequent-buyers
// @access  Private/Admin
exports.getFrequentBuyers = async (req, res, next) => {
  try {
    const orderStats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }
    ]);

    // Populate user details
    const frequentBuyers = await Promise.all(
      orderStats.map(async (stat) => {
        const user = await User.findById(stat._id).select('name email phone');
        return {
          user,
          totalOrders: stat.totalOrders,
          totalSpent: stat.totalSpent
        };
      })
    );

    res.json({
      success: true,
      frequentBuyers
    });
  } catch (error) {
    next(error);
  }
};
