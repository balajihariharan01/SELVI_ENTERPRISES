/**
 * API Configuration
 * 
 * Centralized configuration for API URLs used throughout the application.
 * This file provides utilities for constructing API URLs and handling
 * different environments (development vs production).
 */

// Base API URL from environment variable, with fallback for development
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Base URL without /api suffix (for static assets like images)
export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

/**
 * Get the full URL for an uploaded image
 * @param {string} imagePath - The image path or URL
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already an absolute URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /uploads, prefix with base URL
  if (imagePath.startsWith('/uploads')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If it's just a filename, construct the full uploads path
  if (!imagePath.includes('/')) {
    return `${API_BASE_URL}/uploads/${imagePath}`;
  }
  
  return imagePath;
};

/**
 * Get the full API endpoint URL
 * @param {string} endpoint - The API endpoint (e.g., '/products', '/auth/login')
 * @returns {string} - The full API URL
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
};

export default {
  API_URL,
  API_BASE_URL,
  getImageUrl,
  getApiUrl
};
