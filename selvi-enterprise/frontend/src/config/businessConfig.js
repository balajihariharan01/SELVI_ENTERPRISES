/**
 * Centralized Business Configuration
 * 
 * IMPORTANT: All business details are centralized here.
 * Update this file to reflect changes across the entire application.
 */

export const BUSINESS_CONFIG = {
  // Business Information
  name: 'Selvi Enterprise',
  tagline: 'Steel & Cement',
  fullName: 'Selvi Enterprise – Steel & Cement',
  description: 'Your trusted partner for quality steel and cement materials. Serving the construction industry with excellence.',
  
  // Owners with phone numbers
  owners: [
    { name: 'Anandan S', role: 'Owner', phone: '+91 6380470432' },
    { name: 'Raghavendran S', role: 'Owner', phone: '+91 7904775217' }
  ],
  
  // Contact Information
  contact: {
    phone1: '+91 6380470432',
    phone2: '+91 7904775217',
    phones: ['+91 6380470432', '+91 7904775217'],
    email: 'selvienterprises.ooty@gmail.com',
    whatsapp: '916380470432', // Format for wa.me (country code + number, no spaces/special chars)
    whatsappDisplay: '+91 6380470432'
  },
  
  // Location
  location: {
    area: 'Ooty',
    city: 'Ooty',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '643001',
    landmark: 'Opposite to Eye Foundation',
    street: 'Coonoor Main Road',
    fullAddress: 'Selvi Enterprises – Steel & Cement, Opposite to Eye Foundation, Coonoor Main Road, Ooty – 643001, Tamil Nadu, India',
    addressLines: [
      'Selvi Enterprises – Steel & Cement',
      'Opposite to Eye Foundation,',
      'Coonoor Main Road,',
      'Ooty – 643001,',
      'Tamil Nadu, India'
    ],
    googleMapsUrl: 'https://www.google.com/maps/place//@11.4036779,76.7145812,21z/data=!4m2!3m1!4b1entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.58!2d76.7145812!3d11.4036779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDI0JzEzLjIiTiA3NsKwNDInNTIuNSJF!5e0!3m2!1sen!2sin!4v1703500000000!5m2!1sen!2sin',
    coordinates: {
      lat: 11.4036779,
      lng: 76.7145812
    }
  },
  
  // Payment Information
  payment: {
    upiId: 'selvinaga21@okaxis',
    acceptedMethods: ['Cash on Delivery', 'UPI Payment', 'Online Payment']
  },
  
  // Social Media & Links
  social: {
    whatsappLink: 'https://wa.me/916380470432',
    googleMapsLink: 'https://www.google.com/maps/place//@11.4036779,76.7145812,21z/data=!4m2!3m1!4b1entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D'
  },
  
  // Business Hours (optional)
  businessHours: {
    weekdays: '  9:00 AM - 5:00 PM',
    sunday: 'HOLIDAY'
  }
};

/**
 * Generate WhatsApp chat link with optional message
 * @param {string} message - Optional pre-filled message
 * @returns {string} - WhatsApp click-to-chat URL
 */
export const getWhatsAppLink = (message = '') => {
  const baseUrl = `https://wa.me/${BUSINESS_CONFIG.contact.whatsapp}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

/**
 * Generate WhatsApp link for order inquiry
 * @param {string} orderNumber - Order number for inquiry
 * @returns {string} - WhatsApp URL with pre-filled message
 */
export const getWhatsAppOrderLink = (orderNumber) => {
  const message = `Hi, I have a query regarding my order #${orderNumber} at ${BUSINESS_CONFIG.name}.`;
  return getWhatsAppLink(message);
};

/**
 * Generate WhatsApp link for product inquiry
 * @param {string} productName - Product name for inquiry
 * @returns {string} - WhatsApp URL with pre-filled message
 */
export const getWhatsAppProductLink = (productName) => {
  const message = `Hi, I'm interested in ${productName}. Can you provide more details?`;
  return getWhatsAppLink(message);
};

/**
 * Generate WhatsApp link for general inquiry
 * @returns {string} - WhatsApp URL with pre-filled message
 */
export const getWhatsAppGeneralLink = () => {
  const message = `Hi, I would like to know more about your products and services at ${BUSINESS_CONFIG.name}.`;
  return getWhatsAppLink(message);
};

export default BUSINESS_CONFIG;
