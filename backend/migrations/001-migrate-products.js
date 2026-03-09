/**
 * Database Migration: Migrate Products to Unified Media Schema
 * 
 * This migration converts the legacy image/images fields to the unified media structure.
 * 
 * BEFORE:
 * {
 *   image: "product-123.jpg",
 *   images: ["image1.jpg", "image2.jpg"]
 * }
 * 
 * AFTER:
 * {
 *   media: {
 *     primary: { url: "...", source: "upload", type: "image", ... },
 *     gallery: [{ url: "...", source: "upload", type: "image", ... }]
 *   }
 * }
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

// Get Product model without schema validation (to access raw documents)
const getProductCollection = () => mongoose.connection.collection('products');

/**
 * Convert legacy image field to MediaSchema format
 */
const convertToMedia = (url, isPrimary = false, index = 0) => {
  if (!url || url === 'default-product.jpg') return null;
  
  return {
    url,
    source: 'upload',
    type: 'image',
    metadata: {
      originalName: url.split('/').pop(),
      format: url.split('.').pop()?.toLowerCase()
    },
    storage: {
      provider: 'local',
      key: url.split('/').pop()
    },
    isPrimary,
    isPublic: true,
    sortOrder: index,
    uploadedAt: new Date()
  };
};

/**
 * Main migration function
 */
const migrateProducts = async () => {
  const collection = getProductCollection();
  
  // Find all products
  const products = await collection.find({}).toArray();
  console.log(`📦 Found ${products.length} products to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      // Skip if already migrated
      if (product.media?.primary || product.media?.gallery?.length > 0) {
        console.log(`⏭️  Skipping ${product.productName} - already migrated`);
        skipped++;
        continue;
      }
      
      // Build new media structure
      const media = {
        primary: null,
        gallery: []
      };
      
      // Convert primary image
      if (product.image && product.image !== 'default-product.jpg') {
        media.primary = convertToMedia(product.image, true, 0);
      }
      
      // Convert gallery images
      if (product.images && Array.isArray(product.images)) {
        media.gallery = product.images
          .filter(img => img && img !== 'default-product.jpg')
          .map((img, index) => convertToMedia(img, false, index + 1));
      }
      
      // Update product with new media structure
      await collection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            media,
            // Keep legacy fields for backwards compatibility
            _legacyImage: product.image,
            _legacyImages: product.images,
            _migratedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Migrated: ${product.productName}`);
      migrated++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${product.productName}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n========== Migration Summary ==========');
  console.log(`Total Products: ${products.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('========================================\n');
};

/**
 * Rollback migration
 */
const rollbackProducts = async () => {
  const collection = getProductCollection();
  
  const products = await collection.find({ _migratedAt: { $exists: true } }).toArray();
  console.log(`🔄 Found ${products.length} migrated products to rollback`);
  
  for (const product of products) {
    try {
      await collection.updateOne(
        { _id: product._id },
        {
          $set: {
            image: product._legacyImage,
            images: product._legacyImages
          },
          $unset: {
            media: '',
            _legacyImage: '',
            _legacyImages: '',
            _migratedAt: ''
          }
        }
      );
      console.log(`↩️  Rolled back: ${product.productName}`);
    } catch (error) {
      console.error(`❌ Error rolling back ${product.productName}:`, error.message);
    }
  }
  
  console.log('✅ Rollback complete');
};

/**
 * Verify migration
 */
const verifyMigration = async () => {
  const collection = getProductCollection();
  
  const total = await collection.countDocuments({});
  const withMedia = await collection.countDocuments({ 'media.primary': { $exists: true } });
  const withLegacy = await collection.countDocuments({ _migratedAt: { $exists: true } });
  
  console.log('\n========== Migration Verification ==========');
  console.log(`Total Products: ${total}`);
  console.log(`With unified media: ${withMedia}`);
  console.log(`With migration marker: ${withLegacy}`);
  console.log(`Pending migration: ${total - withLegacy}`);
  console.log('============================================\n');
};

// CLI handling
const main = async () => {
  const command = process.argv[2];
  
  await connectDB();
  
  switch (command) {
    case 'migrate':
      await migrateProducts();
      break;
    case 'rollback':
      await rollbackProducts();
      break;
    case 'verify':
      await verifyMigration();
      break;
    default:
      console.log('Usage: node migrate-products.js [migrate|rollback|verify]');
  }
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Export for testing
module.exports = { migrateProducts, rollbackProducts, verifyMigration };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
