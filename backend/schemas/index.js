/**
 * Unified Reusable Schemas for MongoDB
 * 
 * This module exports all reusable schemas that can be embedded
 * in your Mongoose models to maintain consistency across the application.
 * 
 * @example
 * const { MediaSchema, AddressSchema } = require('./schemas');
 * 
 * const ProductSchema = new mongoose.Schema({
 *   media: {
 *     primary: MediaSchema,
 *     gallery: [MediaSchema]
 *   }
 * });
 */

const MediaSchema = require('./media');
const AddressSchema = require('./address');
const ContactSchema = require('./contact');
const VerificationTokenSchema = require('./verificationToken');
const NotificationSchema = require('./notification');
const AuditSchema = require('./audit');
const { MoneySchema, PriceBreakdownSchema } = require('./money');

module.exports = {
  // Media/File storage
  MediaSchema,
  
  // Location/Address
  AddressSchema,
  
  // Contact information
  ContactSchema,
  
  // Authentication tokens
  VerificationTokenSchema,
  
  // Notification tracking
  NotificationSchema,
  
  // Audit/History
  AuditSchema,
  
  // Money/Pricing
  MoneySchema,
  PriceBreakdownSchema
};
