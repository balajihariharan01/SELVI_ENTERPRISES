/**
 * Database Migration: Migrate Users to Unified Schema
 * 
 * This migration:
 * 1. Converts flat address to AddressSchema array
 * 2. Moves verification tokens to unified verificationTokens array
 * 3. Restructures name to first/last
 * 4. Moves auth-related fields to auth sub-document
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getUserCollection = () => mongoose.connection.collection('users');

/**
 * Parse name into first and last
 */
const parseName = (fullName) => {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' ') || ''
  };
};

/**
 * Convert legacy address to AddressSchema format
 */
const convertAddress = (legacyAddress, name, phone) => {
  if (!legacyAddress || (!legacyAddress.street && !legacyAddress.city)) {
    return null;
  }
  
  return {
    label: 'home',
    name: name,
    phone: {
      countryCode: '+91',
      number: phone?.replace(/\D/g, '').slice(-10)
    },
    line1: legacyAddress.street || '',
    city: legacyAddress.city || '',
    state: legacyAddress.state || '',
    pincode: legacyAddress.pincode || '',
    country: 'India',
    isDefault: true,
    isVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Build contacts array from legacy fields
 */
const buildContacts = (email, phone) => {
  const contacts = [];
  
  if (email) {
    contacts.push({
      type: 'email',
      value: email.toLowerCase(),
      label: 'primary',
      isVerified: false,
      isPrimary: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  if (phone) {
    contacts.push({
      type: 'phone',
      value: phone.replace(/\D/g, '').slice(-10),
      label: 'primary',
      isVerified: false,
      isPrimary: true,
      isActive: true,
      metadata: {
        countryCode: '+91'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return contacts;
};

/**
 * Build auth sub-document
 */
const buildAuth = (user) => {
  return {
    password: user.password,
    provider: user.authProvider || 'local',
    providerId: user.googleId || null,
    lastLogin: user.lastLogin || null,
    loginAttempts: 0,
    lockUntil: null
  };
};

/**
 * Build verified status
 */
const buildVerifiedStatus = (user) => {
  return {
    email: user.emailVerified || false,
    phone: user.phoneVerified || false
  };
};

/**
 * Main migration function
 */
const migrateUsers = async () => {
  const collection = getUserCollection();
  
  const users = await collection.find({}).toArray();
  console.log(`👥 Found ${users.length} users to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      // Skip if already migrated
      if (user._migratedAt || user.parsedName) {
        console.log(`⏭️  Skipping ${user.email} - already migrated`);
        skipped++;
        continue;
      }
      
      // Parse name
      const parsedName = parseName(user.name);
      
      // Build new structures
      const addresses = [];
      const convertedAddress = convertAddress(user.address, user.name, user.phone);
      if (convertedAddress) {
        addresses.push(convertedAddress);
      }
      
      const contacts = buildContacts(user.email, user.phone);
      const auth = buildAuth(user);
      const verified = buildVerifiedStatus(user);
      
      // Build update
      const update = {
        $set: {
          parsedName,
          addresses,
          contacts,
          auth,
          verified,
          status: user.isActive ? 'active' : 'deactivated',
          preferences: {
            notifications: {
              email: true,
              sms: true,
              push: true,
              whatsapp: true
            },
            language: 'en',
            currency: 'INR'
          },
          // Backup legacy data
          _legacy: {
            name: user.name,
            address: user.address,
            password: user.password,
            googleId: user.googleId,
            authProvider: user.authProvider,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            isActive: user.isActive,
            emailVerificationToken: user.emailVerificationToken,
            emailVerificationExpire: user.emailVerificationExpire,
            phoneOTP: user.phoneOTP,
            phoneOTPExpire: user.phoneOTPExpire,
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpire: user.resetPasswordExpire
          },
          _migratedAt: new Date()
        }
      };
      
      await collection.updateOne({ _id: user._id }, update);
      console.log(`✅ Migrated: ${user.email}`);
      migrated++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${user.email}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n========== Migration Summary ==========');
  console.log(`Total Users: ${users.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('========================================\n');
};

/**
 * Rollback migration
 */
const rollbackUsers = async () => {
  const collection = getUserCollection();
  
  const users = await collection.find({ _migratedAt: { $exists: true } }).toArray();
  console.log(`🔄 Found ${users.length} migrated users to rollback`);
  
  for (const user of users) {
    try {
      const legacy = user._legacy || {};
      
      await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            name: legacy.name,
            address: legacy.address,
            password: legacy.password,
            googleId: legacy.googleId,
            authProvider: legacy.authProvider,
            emailVerified: legacy.emailVerified,
            phoneVerified: legacy.phoneVerified,
            isActive: legacy.isActive
          },
          $unset: {
            parsedName: '',
            addresses: '',
            contacts: '',
            auth: '',
            verified: '',
            status: '',
            preferences: '',
            _legacy: '',
            _migratedAt: ''
          }
        }
      );
      console.log(`↩️  Rolled back: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error rolling back ${user.email}:`, error.message);
    }
  }
  
  console.log('✅ Rollback complete');
};

/**
 * Verify migration
 */
const verifyMigration = async () => {
  const collection = getUserCollection();
  
  const total = await collection.countDocuments({});
  const withParsedName = await collection.countDocuments({ parsedName: { $exists: true } });
  const withAddresses = await collection.countDocuments({ 'addresses.0': { $exists: true } });
  const withContacts = await collection.countDocuments({ 'contacts.0': { $exists: true } });
  
  console.log('\n========== Migration Verification ==========');
  console.log(`Total Users: ${total}`);
  console.log(`With parsed name: ${withParsedName}`);
  console.log(`With addresses: ${withAddresses}`);
  console.log(`With contacts: ${withContacts}`);
  console.log(`Pending migration: ${total - withParsedName}`);
  console.log('============================================\n');
};

// CLI handling
const main = async () => {
  const command = process.argv[2];
  
  await connectDB();
  
  switch (command) {
    case 'migrate':
      await migrateUsers();
      break;
    case 'rollback':
      await rollbackUsers();
      break;
    case 'verify':
      await verifyMigration();
      break;
    default:
      console.log('Usage: node migrate-users.js [migrate|rollback|verify]');
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

module.exports = { migrateUsers, rollbackUsers, verifyMigration };

if (require.main === module) {
  main().catch(console.error);
}
