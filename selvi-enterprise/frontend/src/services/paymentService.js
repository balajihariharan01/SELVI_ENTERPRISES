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
  }
};

export default paymentService;
