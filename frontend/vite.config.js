import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 ,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-framer': ['framer-motion'],
          // Stripe payment
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          // UI utilities
          'vendor-ui': ['react-icons', 'react-hot-toast'],
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
