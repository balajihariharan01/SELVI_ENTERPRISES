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

  // Admin: Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export default userService;
