/**
 * Config Routes
 * 
 * Serves business configuration to frontend
 */

const express = require('express');
const router = express.Router();
const business = require('../config/business');

/**
 * @desc    Get public business configuration
 * @route   GET /api/config/business
 * @access  Public
 */
router.get('/business', (req, res) => {
  try {
    const publicConfig = business.getPublicConfig();
    
    res.json({
      success: true,
      config: publicConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load business configuration'
    });
  }
});

/**
 * @desc    Get product configuration (categories, units)
 * @route   GET /api/config/products
 * @access  Public
 */
router.get('/products', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        categories: business.products.categories,
        units: business.products.units,
        lowStockThreshold: business.products.lowStockThreshold
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load product configuration'
    });
  }
});

/**
 * @desc    Get payment configuration
 * @route   GET /api/config/payment
 * @access  Public
 */
router.get('/payment', (req, res) => {
  try {
    const { methods, currency, tax, shipping } = business.payment;
    
    // Only return enabled methods
    const enabledMethods = Object.entries(methods)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({
        key,
        label: config.label,
        description: config.description
      }));
    
    res.json({
      success: true,
      config: {
        currency,
        methods: enabledMethods,
        tax: {
          rate: tax.gstRate,
          isInclusive: tax.isInclusive
        },
        shipping
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load payment configuration'
    });
  }
});

/**
 * @desc    Get contact information
 * @route   GET /api/config/contact
 * @access  Public
 */
router.get('/contact', (req, res) => {
  try {
    res.json({
      success: true,
      contact: {
        phones: business.contact.phones,
        email: business.contact.email.primary,
        whatsapp: business.contact.whatsapp,
        address: business.location.formatted.full,
        addressLines: business.location.formatted.multiline,
        coordinates: business.location.coordinates,
        googleMaps: business.location.googleMaps.url,
        hours: business.hours.display
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load contact information'
    });
  }
});

/**
 * @desc    Get order status labels and colors
 * @route   GET /api/config/order-statuses
 * @access  Public
 */
router.get('/order-statuses', (req, res) => {
  try {
    res.json({
      success: true,
      statuses: business.orders.statuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load order statuses'
    });
  }
});

module.exports = router;
