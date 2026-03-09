import api from './api';

export const userService = {
  // Admin: Get all users
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Admin: Get all customers with stats
  getAllCustomers: async () => {
    const response = await api.get('/users/customers');
    return response.data;
  },

  // Admin: Get single user with orders
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Admin: Get frequent buyers
  getFrequentBuyers: async () => {
    const response = await api.get('/users/frequent-buyers');
    return response.data;
  },

  // Admin: Delete user (hard delete) - requires confirmation
  deleteUser: async (id, options = { confirmDeletion: true, preserveOrders: true }) => {
    const response = await api.delete(`/users/${id}`, { data: options });
    return response.data;
  },

  // Admin: Deactivate user (soft delete) - with optional reason
  deactivateUser: async (id, reason = null) => {
    const response = await api.put(`/users/${id}/deactivate`, { reason });
    return response.data;
  },

  // Admin: Reactivate user
  reactivateUser: async (id) => {
    const response = await api.put(`/users/${id}/reactivate`);
    return response.data;
  }
};

export default userService;
