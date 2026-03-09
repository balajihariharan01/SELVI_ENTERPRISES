import api from './api';

export const productService = {
  // Get all products (public)
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get product options (categories and units)
  getProductOptions: async () => {
    const response = await api.get('/products/meta/options');
    return response.data;
  },

  // Admin: Get all products including inactive
  getAllProductsAdmin: async () => {
    const response = await api.get('/products/admin/all');
    return response.data;
  },

  // Admin: Get low stock products
  getLowStockProducts: async () => {
    const response = await api.get('/products/admin/low-stock');
    return response.data;
  },

  // Admin: Create product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Admin: Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Admin: Update stock
  updateStock: async (id, stockData) => {
    const response = await api.put(`/products/${id}/stock`, stockData);
    return response.data;
  },

  // Admin: Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export default productService;
