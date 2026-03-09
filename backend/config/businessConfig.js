/**
 * Centralized Business Configuration for Backend
 * 
 * IMPORTANT: All business details are centralized here.
 * Update this file to reflect changes across the entire application.
 */

module.exports = {
  // Business Information
  name: 'Selvi Enterprise',
  tagline: 'Steel & Cement',
  fullName: 'Selvi Enterprise – Steel & Cement',
  description: 'Your trusted partner for quality steel and cement materials.',
  
  // Owners
  owners: [
    { name: 'Anandan S', role: 'Owner' },
    { name: 'Raghavendran S', role: 'Owner' }
  ],
  
  // Contact Information
  contact: {
    phone1: '+91 6380470432',
    phone2: '+91 7904775217',
    phones: ['+91 6380470432', '+91 7904775217'],
    email: 'selvienterprises.ooty@gmail.com',
    whatsapp: '916380470432'
  },
  
  // Location
  location: {
    area: 'Ooty',
    city: 'Ooty',
    state: 'Tamil Nadu',
    country: 'India',
    fullAddress: 'Ooty, Tamil Nadu, India',
    googleMapsUrl: 'https://www.google.com/maps/place//@11.4036779,76.7145812,21z'
  },
  
  // Payment Information
  payment: {
    upiId: 'selvinaga21@okaxis',
    acceptedMethods: ['cod', 'upi', 'online']
  },
  
  // For invoice/receipt generation
  invoice: {
    businessName: 'Selvi Enterprise – Steel & Cement',
    owners: 'Anandan S, Raghavendran S',
    phone: '+91 6380470432, +91 7904775217',
    email: 'selvienterprises.ooty@gmail.com',
    upiId: 'selvinaga21@okaxis',
    location: 'Ooty, Tamil Nadu'
  }
};
