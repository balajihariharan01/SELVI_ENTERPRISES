/**
 * Enhanced Upload Routes with Unified Media Response
 * 
 * This module demonstrates the unified media response format.
 * Replace the existing uploadRoutes.js with this version.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // Optional: for image metadata
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const MediaSchema = require('../schemas/media');

/**
 * Helper: Extract image metadata
 */
const getImageMetadata = async (filePath) => {
  try {
    // If sharp is installed, get detailed metadata
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  } catch (error) {
    // Fallback: basic info from file
    return {
      width: null,
      height: null,
      format: path.extname(filePath).slice(1).toLowerCase()
    };
  }
};

/**
 * @desc    Upload single image with unified media response
 * @route   POST /api/upload/image
 * @access  Private/Admin
 * 
 * Request body (multipart/form-data):
 *   - image: File
 *   - source: 'upload' | 'camera' | 'gallery' (optional, default: 'upload')
 *   - altText: string (optional)
 *   - caption: string (optional)
 */
router.post('/image', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { source = 'upload', altText, caption } = req.body;
    
    // Build full URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    
    // Get image metadata (dimensions, format)
    const imageMeta = await getImageMetadata(filePath);

    // Build unified media response
    const media = {
      url: imageUrl,
      source: ['upload', 'camera', 'gallery', 'external_link'].includes(source) ? source : 'upload',
      type: 'image',
      metadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width: imageMeta.width,
        height: imageMeta.height,
        format: imageMeta.format || req.file.mimetype.split('/')[1],
        altText: altText || null,
        caption: caption || null
      },
      storage: {
        provider: 'local',
        key: req.file.filename
      },
      isPrimary: false,
      isPublic: true,
      sortOrder: 0,
      uploadedBy: req.user?.id || null,
      uploadedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: media,
      
      // Legacy response fields for backwards compatibility
      // TODO: Remove in next major version
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

/**
 * @desc    Upload multiple images with unified media response
 * @route   POST /api/upload/images
 * @access  Private/Admin
 */
router.post('/images', protect, adminOnly, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { source = 'upload' } = req.body;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    const mediaList = await Promise.all(req.files.map(async (file, index) => {
      const imageUrl = `${baseUrl}/uploads/${file.filename}`;
      const filePath = path.join(__dirname, '..', 'uploads', file.filename);
      const imageMeta = await getImageMetadata(filePath);
      
      return {
        url: imageUrl,
        source,
        type: 'image',
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: imageMeta.width,
          height: imageMeta.height,
          format: imageMeta.format || file.mimetype.split('/')[1]
        },
        storage: {
          provider: 'local',
          key: file.filename
        },
        isPrimary: index === 0,
        isPublic: true,
        sortOrder: index,
        uploadedBy: req.user?.id || null,
        uploadedAt: new Date()
      };
    }));

    res.status(201).json({
      success: true,
      message: `${mediaList.length} images uploaded successfully`,
      data: mediaList,
      count: mediaList.length
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

/**
 * @desc    Create media from external URL
 * @route   POST /api/upload/from-url
 * @access  Private/Admin
 */
router.post('/from-url', protect, adminOnly, async (req, res) => {
  try {
    const { url, altText, caption, type = 'image' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }
    
    // Build unified media response for external URL
    const media = {
      url,
      source: 'external_link',
      type,
      metadata: {
        altText: altText || null,
        caption: caption || null
      },
      storage: {
        provider: 'external'
      },
      isPrimary: false,
      isPublic: true,
      sortOrder: 0,
      uploadedBy: req.user?.id || null,
      uploadedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Media created from URL',
      data: media
    });
    
  } catch (error) {
    console.error('URL media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating media from URL',
      error: error.message
    });
  }
});

/**
 * @desc    Delete image
 * @route   DELETE /api/upload/image/:filename
 * @access  Private/Admin
 */
router.delete('/image/:filename', protect, adminOnly, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: { filename }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

/**
 * @desc    Get image info
 * @route   GET /api/upload/info/:filename
 * @access  Private
 */
router.get('/info/:filename', protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const stats = fs.statSync(filePath);
    const imageMeta = await getImageMetadata(filePath);
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      data: {
        url: `${baseUrl}/uploads/${filename}`,
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        ...imageMeta
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting image info',
      error: error.message
    });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum is 10'
    });
  }
  
  res.status(400).json({
    success: false,
    message: error.message || 'Error uploading file'
  });
});

module.exports = router;
