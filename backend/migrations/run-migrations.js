/**
 * Database Migration Runner
 * 
 * Run all migrations in sequence or specific ones.
 * 
 * Usage:
 *   node run-migrations.js all migrate     # Run all migrations
 *   node run-migrations.js all rollback    # Rollback all migrations
 *   node run-migrations.js all verify      # Verify all migrations
 *   node run-migrations.js products migrate # Run only products migration
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import migrations
const { migrateProducts, rollbackProducts, verifyMigration: verifyProducts } = require('./001-migrate-products');
const { migrateUsers, rollbackUsers, verifyMigration: verifyUsers } = require('./002-migrate-users');
const { migrateOrders, rollbackOrders, verifyMigration: verifyOrders } = require('./003-migrate-orders');

// Migration registry
const migrations = {
  products: {
    migrate: migrateProducts,
    rollback: rollbackProducts,
    verify: verifyProducts
  },
  users: {
    migrate: migrateUsers,
    rollback: rollbackUsers,
    verify: verifyUsers
  },
  orders: {
    migrate: migrateOrders,
    rollback: rollbackOrders,
    verify: verifyOrders
  }
};

// Migration order
const migrationOrder = ['products', 'users', 'orders'];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log('');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const runMigration = async (name, action) => {
  const migration = migrations[name];
  if (!migration) {
    console.error(`❌ Unknown migration: ${name}`);
    return false;
  }
  
  const fn = migration[action];
  if (!fn) {
    console.error(`❌ Unknown action: ${action}`);
    return false;
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📝 Running: ${name} - ${action}`);
  console.log(`${'='.repeat(50)}\n`);
  
  try {
    await fn();
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    return false;
  }
};

const runAll = async (action) => {
  const order = action === 'rollback' ? [...migrationOrder].reverse() : migrationOrder;
  
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# Running ALL migrations: ${action.toUpperCase()}`);
  console.log(`# Order: ${order.join(' → ')}`);
  console.log(`${'#'.repeat(60)}\n`);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const name of order) {
    const success = await runMigration(name, action);
    if (success) {
      results.success.push(name);
    } else {
      results.failed.push(name);
      if (action === 'migrate') {
        console.log('\n⚠️  Stopping due to failure. Run rollback to revert changes.');
        break;
      }
    }
  }
  
  console.log(`\n${'#'.repeat(60)}`);
  console.log('# Summary');
  console.log(`${'#'.repeat(60)}`);
  console.log(`✅ Successful: ${results.success.join(', ') || 'none'}`);
  console.log(`❌ Failed: ${results.failed.join(', ') || 'none'}`);
  console.log('');
};

const showHelp = () => {
  console.log(`
Database Migration Runner
=========================

Usage:
  node run-migrations.js <target> <action>

Targets:
  all        - Run all migrations
  products   - Product media migration
  users      - User schema migration
  orders     - Order schema migration

Actions:
  migrate    - Run the migration
  rollback   - Revert the migration
  verify     - Check migration status

Examples:
  node run-migrations.js all migrate
  node run-migrations.js all verify
  node run-migrations.js products rollback
  node run-migrations.js users verify

Environment:
  Ensure MONGO_URI is set in .env file

Safety:
  ⚠️  Always backup your database before running migrations!
  💡 Migrations keep legacy data in _legacy field for rollback
  `);
};

const main = async () => {
  const [, , target, action] = process.argv;
  
  if (!target || !action || target === 'help' || target === '--help') {
    showHelp();
    return;
  }
  
  if (!['migrate', 'rollback', 'verify'].includes(action)) {
    console.error(`❌ Invalid action: ${action}`);
    console.log('Valid actions: migrate, rollback, verify');
    return;
  }
  
  // Confirm destructive operations
  if (action === 'migrate' || action === 'rollback') {
    console.log('⚠️  WARNING: This will modify your database.');
    console.log('📍 Make sure you have a backup!');
    console.log('');
    console.log('Starting in 3 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await connectDB();
  
  if (target === 'all') {
    await runAll(action);
  } else if (migrations[target]) {
    await runMigration(target, action);
  } else {
    console.error(`❌ Unknown target: ${target}`);
    console.log(`Valid targets: all, ${Object.keys(migrations).join(', ')}`);
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

main().catch(console.error);
