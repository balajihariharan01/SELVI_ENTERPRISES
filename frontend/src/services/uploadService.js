import api from './api';

const uploadService = {
  // Upload single image (for profile photos)
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Return normalized response with url at top level
    return {
      success: response.data.success,
      url: response.data.url || response.data.data?.url,
      filename: response.data.data?.filename,
      message: response.data.message
    };
  },

  // Upload product image (admin only)
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: response.data.success,
      url: response.data.url || response.data.data?.url,
      filename: response.data.data?.filename,
      message: response.data.message
    };
  },

  // Delete image
  deleteImage: async (filename) => {
    const response = await api.delete(`/upload/image/${filename}`);
    return response.data;
  },
};

export default uploadService;
