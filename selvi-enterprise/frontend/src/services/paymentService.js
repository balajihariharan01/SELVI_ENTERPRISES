import api from './api';

export const paymentService = {
  // Create payment intent for an order
  createPaymentIntent: async (orderId, amount, email) => {
    const response = await api.post('/payments/create-intent', {
      orderId,
      amount,
      email
    });
    return response.data;
  },

  // Get payment status for an order
  getPaymentStatus: async (orderId) => {
    const response = await api.get(`/payments/status/${orderId}`);
    return response.data;
  },

  // Confirm payment after successful Stripe payment
  confirmPayment: async (paymentIntentId, orderId) => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId,
      orderId
    });
    return response.data;
  },

  // ==================== ADMIN ENDPOINTS ====================

  // Get all payments (Admin)
  getAllPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params.method && params.method !== 'all') {
      queryParams.append('method', params.method);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }

    const queryString = queryParams.toString();
    const url = `/payments/admin/all${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Get payment by ID (Admin)
  getPaymentById: async (paymentId) => {
    const response = await api.get(`/payments/admin/${paymentId}`);
    return response.data;
  },

  // Get payment statistics (Admin)
  getPaymentStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const queryString = queryParams.toString();
    const url = `/payments/admin/stats${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Sync payments from orders (Admin utility)
  syncPayments: async () => {
    const response = await api.post('/payments/admin/sync');
    return response.data;
  }
};

export default paymentService;
