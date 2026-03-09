import api from './api';

/**
 * Contact Service
 * Handles contact form submissions
 */

const contactService = {
  /**
   * Send contact message to admin/owner
   * @param {Object} data - Contact form data
   * @returns {Promise} - API response
   */
  sendContactMessage: async (data) => {
    const response = await api.post('/contact', data);
    return response.data;
  }
};

export default contactService;
