import api from './api';

const uploadService = {
  // Upload single image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete image
  deleteImage: async (filename) => {
    const response = await api.delete(`/upload/image/${filename}`);
    return response.data;
  },
};

export default uploadService;
