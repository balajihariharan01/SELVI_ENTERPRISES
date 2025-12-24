import api from './api';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get user's orders
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Cancel order (user)
  cancelOrder: async (id) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },

  // Update order (user - only pending orders)
  updateOrder: async (id, orderData) => {
    const response = await api.put(`/orders/${id}/update`, orderData);
    return response.data;
  },

  // Delete order (user - only pending orders)
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Admin: Get all orders
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  // Admin: Get all orders with stats
  getAllOrdersAdmin: async () => {
    const response = await api.get('/orders/admin/all');
    return response.data;
  },

  // Admin: Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/orders/admin/dashboard');
    return response.data;
  },

  // Admin: Update order status
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  }
};

export default orderService;
