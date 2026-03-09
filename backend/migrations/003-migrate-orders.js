/**
 * Database Migration: Migrate Orders to Unified Schema
 * 
 * This migration:
 * 1. Converts shippingAddress to AddressSchema format
 * 2. Restructures payment fields
 * 3. Converts statusHistory to new format
 * 4. Adds notifications array for email tracking
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getOrderCollection = () => mongoose.connection.collection('orders');

/**
 * Convert legacy shipping address
 */
const convertShippingAddress = (legacy) => {
  if (!legacy) return null;
  
  return {
    label: 'shipping',
    name: legacy.name,
    phone: {
      countryCode: '+91',
      number: legacy.phone?.replace(/\D/g, '').slice(-10)
    },
    line1: legacy.street,
    city: legacy.city,
    state: legacy.state,
    pincode: legacy.pincode,
    country: 'India',
    isDefault: false,
    isVerified: false,
    isActive: true
  };
};

/**
 * Build customer snapshot
 */
const buildCustomerSnapshot = (order, user) => {
  return {
    user: order.user,
    snapshot: {
      name: order.shippingAddress?.name || user?.name,
      email: user?.email,
      phone: order.shippingAddress?.phone
    }
  };
};

/**
 * Build payment sub-document
 */
const buildPayment = (order) => {
  return {
    method: order.paymentMethod === 'online' ? 'online' : order.paymentMethod,
    status: order.paymentStatus,
    paymentId: null, // Will be linked to Payment collection
    paidAt: order.paymentStatus === 'paid' ? order.updatedAt : null
  };
};

/**
 * Build status sub-document
 */
const buildStatus = (order) => {
  return {
    current: order.orderStatus,
    timeline: order.statusHistory?.map(sh => ({
      status: sh.status,
      timestamp: sh.updatedAt || sh.createdAt,
      note: null,
      updatedBy: sh.updatedBy
    })) || [{
      status: order.orderStatus,
      timestamp: order.createdAt,
      note: 'Order created'
    }]
  };
};

/**
 * Build notifications from email tracking fields
 */
const buildNotifications = (order) => {
  const notifications = [];
  
  if (order.receiptEmailStatus && order.receiptEmailStatus !== 'not_required') {
    notifications.push({
      type: 'order_receipt',
      channel: 'email',
      status: order.receiptEmailStatus === 'sent' ? 'sent' : 
              order.receiptEmailStatus === 'failed' ? 'failed' : 'pending',
      recipient: { email: null }, // Would need user lookup
      sentAt: order.receiptEmailSentAt,
      attempts: order.receiptEmailAttempts || 0,
      error: order.receiptEmailError ? {
        code: 'SEND_FAILED',
        message: order.receiptEmailError
      } : null,
      createdAt: order.createdAt,
      updatedAt: order.receiptEmailSentAt || order.updatedAt
    });
  }
  
  return notifications;
};

/**
 * Build notes sub-document
 */
const buildNotes = (order) => {
  return {
    customer: order.notes,
    admin: order.adminNotes,
    internal: null
  };
};

/**
 * Main migration function
 */
const migrateOrders = async () => {
  const collection = getOrderCollection();
  
  const orders = await collection.find({}).toArray();
  console.log(`📦 Found ${orders.length} orders to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const order of orders) {
    try {
      // Skip if already migrated
      if (order._migratedAt) {
        console.log(`⏭️  Skipping ${order.orderNumber} - already migrated`);
        skipped++;
        continue;
      }
      
      // Build new structures
      const convertedAddress = convertShippingAddress(order.shippingAddress);
      const customer = buildCustomerSnapshot(order, null);
      const payment = buildPayment(order);
      const status = buildStatus(order);
      const notifications = buildNotifications(order);
      const notes = buildNotes(order);
      
      // Update order
      await collection.updateOne(
        { _id: order._id },
        {
          $set: {
            shippingAddressNew: convertedAddress,
            customer,
            payment,
            status,
            notifications,
            notes,
            // Backup legacy data
            _legacy: {
              shippingAddress: order.shippingAddress,
              paymentMethod: order.paymentMethod,
              paymentIntentId: order.paymentIntentId,
              paymentStatus: order.paymentStatus,
              orderStatus: order.orderStatus,
              statusHistory: order.statusHistory,
              receiptEmailStatus: order.receiptEmailStatus,
              receiptEmailSentAt: order.receiptEmailSentAt,
              receiptEmailError: order.receiptEmailError,
              receiptEmailAttempts: order.receiptEmailAttempts,
              notes: order.notes,
              adminNotes: order.adminNotes
            },
            _migratedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Migrated: ${order.orderNumber}`);
      migrated++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${order.orderNumber}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n========== Migration Summary ==========');
  console.log(`Total Orders: ${orders.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('========================================\n');
};

/**
 * Rollback migration
 */
const rollbackOrders = async () => {
  const collection = getOrderCollection();
  
  const orders = await collection.find({ _migratedAt: { $exists: true } }).toArray();
  console.log(`🔄 Found ${orders.length} migrated orders to rollback`);
  
  for (const order of orders) {
    try {
      const legacy = order._legacy || {};
      
      await collection.updateOne(
        { _id: order._id },
        {
          $set: {
            shippingAddress: legacy.shippingAddress,
            paymentMethod: legacy.paymentMethod,
            paymentIntentId: legacy.paymentIntentId,
            paymentStatus: legacy.paymentStatus,
            orderStatus: legacy.orderStatus,
            statusHistory: legacy.statusHistory,
            receiptEmailStatus: legacy.receiptEmailStatus,
            receiptEmailSentAt: legacy.receiptEmailSentAt,
            receiptEmailError: legacy.receiptEmailError,
            receiptEmailAttempts: legacy.receiptEmailAttempts,
            notes: legacy.notes,
            adminNotes: legacy.adminNotes
          },
          $unset: {
            shippingAddressNew: '',
            customer: '',
            payment: '',
            status: '',
            notifications: '',
            _legacy: '',
            _migratedAt: ''
          }
        }
      );
      console.log(`↩️  Rolled back: ${order.orderNumber}`);
    } catch (error) {
      console.error(`❌ Error rolling back ${order.orderNumber}:`, error.message);
    }
  }
  
  console.log('✅ Rollback complete');
};

/**
 * Verify migration
 */
const verifyMigration = async () => {
  const collection = getOrderCollection();
  
  const total = await collection.countDocuments({});
  const migrated = await collection.countDocuments({ _migratedAt: { $exists: true } });
  const withCustomer = await collection.countDocuments({ customer: { $exists: true } });
  const withPayment = await collection.countDocuments({ payment: { $exists: true } });
  const withStatus = await collection.countDocuments({ status: { $exists: true } });
  
  console.log('\n========== Migration Verification ==========');
  console.log(`Total Orders: ${total}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`With customer: ${withCustomer}`);
  console.log(`With payment: ${withPayment}`);
  console.log(`With status: ${withStatus}`);
  console.log(`Pending migration: ${total - migrated}`);
  console.log('============================================\n');
};

// CLI handling
const main = async () => {
  const command = process.argv[2];
  
  await connectDB();
  
  switch (command) {
    case 'migrate':
      await migrateOrders();
      break;
    case 'rollback':
      await rollbackOrders();
      break;
    case 'verify':
      await verifyMigration();
      break;
    default:
      console.log('Usage: node migrate-orders.js [migrate|rollback|verify]');
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

module.exports = { migrateOrders, rollbackOrders, verifyMigration };

if (require.main === module) {
  main().catch(console.error);
}
