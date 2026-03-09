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

// @desc    Delete user (Admin) - Hard delete with cascade cleanup
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const { preserveOrders = true, confirmDeletion } = req.body;
    
    // Safety check: require explicit confirmation
    if (confirmDeletion !== true) {
      return res.status(400).json({
        success: false,
        message: 'Deletion requires explicit confirmation. Set confirmDeletion: true in request body.'
      });
    }

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

    // Check for active orders - block deletion if exists
    const activeOrders = await Order.countDocuments({
      user: req.params.id,
      orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${activeOrders} active order(s). Please complete or cancel all orders first.`,
        activeOrderCount: activeOrders
      });
    }

    // Get total order count for reporting
    const totalOrders = await Order.countDocuments({ user: req.params.id });

    // Handle order history preservation
    if (preserveOrders && totalOrders > 0) {
      // Mark orders as belonging to deleted user but keep them for business records
      await Order.updateMany(
        { user: req.params.id },
        { 
          $set: { 
            deletedUserInfo: {
              userId: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              deletedAt: new Date()
            }
          }
        }
      );
    }

    // Log before deletion
    console.log(`[AUDIT] User ${user.email} (${user._id}) HARD DELETED by admin ${req.user.email} at ${new Date().toISOString()}. Orders preserved: ${preserveOrders}, Total orders: ${totalOrders}`);

    // Perform hard delete
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted permanently',
      deletedUser: {
        id: req.params.id,
        name: user.name,
        email: user.email
      },
      ordersPreserved: preserveOrders,
      orderCount: totalOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user (Admin) - Soft delete
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
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
        message: 'Cannot deactivate admin user'
      });
    }

    // Check if already deactivated
    if (!user.isActive || user.accountStatus === 'deactivated') {
      return res.status(400).json({
        success: false,
        message: 'User account is already deactivated'
      });
    }

    // Check for active orders
    const activeOrders = await Order.countDocuments({
      user: req.params.id,
      orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot deactivate customer with ${activeOrders} active order(s). Please complete or cancel all active orders first.`,
        activeOrderCount: activeOrders
      });
    }

    // Update user with audit trail
    user.isActive = false;
    user.accountStatus = 'deactivated';
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user.id;
    user.deactivationReason = reason || 'Deactivated by admin';
    
    await user.save({ validateBeforeSave: false });

    // Log the action
    console.log(`[AUDIT] User ${user.email} (${user._id}) deactivated by admin ${req.user.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Customer account deactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
        deactivatedAt: user.deactivatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reactivate user (Admin)
// @route   PUT /api/users/:id/reactivate
// @access  Private/Admin
exports.reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already active
    if (user.isActive && user.accountStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: 'User account is already active'
      });
    }

    // Update user with audit trail
    user.isActive = true;
    user.accountStatus = 'active';
    user.reactivatedAt = new Date();
    user.reactivatedBy = req.user.id;
    // Clear deactivation fields
    user.deactivatedAt = null;
    user.deactivatedBy = null;
    user.deactivationReason = null;
    
    await user.save({ validateBeforeSave: false });

    // Log the action
    console.log(`[AUDIT] User ${user.email} (${user._id}) reactivated by admin ${req.user.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Customer account reactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
        reactivatedAt: user.reactivatedAt
      }
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
    const { status } = req.query; // Optional filter: 'active', 'inactive', 'all'
    
    let userQuery = { role: 'user' };
    
    // Filter by account status if specified
    if (status === 'active') {
      userQuery.isActive = true;
    } else if (status === 'inactive') {
      userQuery.isActive = false;
    }
    // 'all' or no filter returns everyone
    
    const users = await User.find(userQuery).sort({ createdAt: -1 });

    // Get order stats for each user
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id });
        const completedOrders = orders.filter(o => o.orderStatus !== 'cancelled');
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt,
          isActive: user.isActive,
          accountStatus: user.accountStatus || (user.isActive ? 'active' : 'deactivated'),
          deactivatedAt: user.deactivatedAt,
          deactivationReason: user.deactivationReason,
          lastLogin: user.lastLogin,
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

    const totalOrders = await Order.countDocuments({ orderStatus: { $ne: 'cancelled' } });
    
    // Count active vs inactive users
    const activeUsers = users.filter(u => u.isActive !== false).length;
    const inactiveUsers = users.filter(u => u.isActive === false).length;

    res.json({
      success: true,
      customers: customersWithStats,
      stats: {
        total: users.length,
        active: activeUsers,
        inactive: inactiveUsers,
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
