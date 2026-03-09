

const business = {

  identity: {
    name: 'Selvi Enterprise',
    tagline: 'Steel & Cement',
    legalName: 'Selvi Enterprise – Steel & Cement',
    description: 'Your trusted partner for quality steel and cement materials. Serving the construction industry with excellence.',
    
    // Legal/Tax Info
    legal: {
      gst: '33AADCS1234F1Z5',
      pan: 'AADCS1234F',
      cin: null,
      registrationType: 'Proprietorship'
    },
    
    // Branding
    branding: {
      logoUrl: '/images/logo.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#0F0689',
      secondaryColor: '#0857BE',
      accentColor: '#EFB523'
    }
  },

  // ========================
  // OWNERS / TEAM
  // ========================
  owners: [
    {
      name: 'Anandan S',
      role: 'Owner',
      phone: '+91 6380470432',
      email: null,
      isPrimary: true
    },
    {
      name: 'Raghavendran S',
      role: 'Owner',
      phone: '+91 7904775217',
      email: null,
      isPrimary: false
    }
  ],

  // ========================
  // CONTACT INFORMATION
  // ========================
  contact: {
    // Primary phone
    phone: {
      primary: {
        number: '+91 6380470432',
        label: 'primary',
        whatsapp: true
      },
      secondary: {
        number: '+91 7904775217',
        label: 'secondary',
        whatsapp: false
      }
    },
    
    // All phone numbers (array format)
    phones: ['+91 6380470432', '+91 7904775217'],
    
    // Email
    email: {
      primary: 'selvienterprises.ooty@gmail.com',
      support: 'selvienterprises.ooty@gmail.com',
      orders: 'selvienterprises.ooty@gmail.com'
    },
    
    // WhatsApp
    whatsapp: {
      number: '916380470432',
      displayNumber: '+91 6380470432',
      link: 'https://wa.me/916380470432'
    },
    
    // Website
    website: {
      url: 'https://www.selvienterprises.com',
      displayUrl: 'www.selvienterprises.com'
    }
  },

  // ========================
  // LOCATION
  // ========================
  location: {
    // Structured address
    address: {
      line1: 'Opposite to Eye Foundation',
      line2: 'Coonoor Main Road',
      landmark: 'Opposite to Eye Foundation',
      city: 'Ooty',
      district: 'Nilgiris',
      state: 'Tamil Nadu',
      pincode: '643001',
      country: 'India'
    },
    
    // Formatted addresses
    formatted: {
      short: 'Ooty, Tamil Nadu',
      medium: 'Coonoor Main Road, Ooty – 643001',
      full: 'Selvi Enterprises – Steel & Cement, Opposite to Eye Foundation, Coonoor Main Road, Ooty – 643001, Tamil Nadu, India',
      multiline: [
        'Selvi Enterprises – Steel & Cement',
        'Opposite to Eye Foundation,',
        'Coonoor Main Road,',
        'Ooty – 643001,',
        'Tamil Nadu, India'
      ]
    },
    
    // Geo-coordinates
    coordinates: {
      latitude: 11.4036779,
      longitude: 76.7145812
    },
    
    // Google Maps
    googleMaps: {
      url: 'https://www.google.com/maps/place//@11.4036779,76.7145812,21z',
      embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.58!2d76.7145812!3d11.4036779',
      placeId: null
    }
  },

  // ========================
  // BUSINESS HOURS
  // ========================
  hours: {
    timezone: 'Asia/Kolkata',
    schedule: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: null, close: null, isOpen: false }
    },
    display: {
      weekdays: '9:00 AM - 5:00 PM',
      saturday: '9:00 AM - 5:00 PM',
      sunday: 'Closed'
    }
  },

  // ========================
  // PAYMENT CONFIGURATION
  // ========================
  payment: {
    currency: {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee'
    },
    
    // Accepted methods
    methods: {
      cod: {
        enabled: true,
        label: 'Cash on Delivery',
        description: 'Pay when your order is delivered'
      },
      upi: {
        enabled: true,
        label: 'UPI Payment',
        id: 'selvinaga21@okaxis',
        displayName: 'Selvi Enterprise'
      },
      online: {
        enabled: true,
        label: 'Online Payment',
        provider: 'stripe',
        description: 'Pay securely with card'
      },
      credit: {
        enabled: true,
        label: 'Credit',
        description: 'Pay later (approved customers only)',
        requiresApproval: true
      }
    },
    
    // Tax settings
    tax: {
      gstRate: 18,
      isInclusive: true,
      showBreakdown: false
    },
    
    // Shipping
    shipping: {
      freeAbove: null,
      defaultCharge: 0,
      estimatedDays: {
        local: '1-2 days',
        regional: '3-5 days'
      }
    }
  },

  // ========================
  // INVOICE / RECEIPT
  // ========================
  invoice: {
    prefix: 'SE',
    footer: 'Thank you for your business!',
    terms: [
      'Goods once sold will not be taken back.',
      'Subject to Ooty jurisdiction.',
      'E. & O.E.'
    ],
    bankDetails: {
      bankName: null,
      accountNumber: null,
      ifsc: null,
      branch: null
    }
  },

  // ========================
  // ORDER SETTINGS
  // ========================
  orders: {
    numberPrefix: 'SE',
    modificationWindowHours: 24,
    cancellationWindowHours: 24,
    statuses: [
      { key: 'pending', label: 'Pending', color: '#f59e0b' },
      { key: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
      { key: 'processing', label: 'Processing', color: '#8b5cf6' },
      { key: 'shipped', label: 'Shipped', color: '#06b6d4' },
      { key: 'delivered', label: 'Delivered', color: '#22c55e' },
      { key: 'cancelled', label: 'Cancelled', color: '#ef4444' }
    ]
  },

  // ========================
  // PRODUCT SETTINGS
  // ========================
  products: {
    categories: ['cement', 'steel', 'others'],
    units: [
      'bags', 'kg', 'tons', 'pieces', 'rods', 'bundles',
      'loads', 'cft', 'sqft', 'meters', 'feet', 'liters',
      'boxes', 'sets', 'numbers'
    ],
    lowStockThreshold: 10,
    defaultImage: 'default-product.jpg'
  },

  // ========================
  // EMAIL SETTINGS
  // ========================
  email: {
    from: {
      name: 'Selvi Enterprise',
      email: 'selvienterprises.ooty@gmail.com'
    },
    replyTo: 'selvienterprises.ooty@gmail.com',
    templates: {
      orderConfirmation: 'order_confirmation',
      orderReceipt: 'order_receipt',
      shippingUpdate: 'shipping_update',
      contactAcknowledgment: 'contact_ack'
    }
  },

  // ========================
  // SOCIAL MEDIA
  // ========================
  social: {
    facebook: null,
    instagram: null,
    twitter: null,
    youtube: null,
    linkedin: null
  },

  // ========================
  // SEO / META
  // ========================
  seo: {
    title: 'Selvi Enterprise – Steel & Cement Suppliers in Ooty',
    description: 'Quality steel and cement materials for construction in Ooty and Nilgiris district. Trusted supplier since establishment.',
    keywords: ['steel', 'cement', 'construction materials', 'ooty', 'nilgiris', 'building materials'],
    ogImage: '/images/og-image.jpg'
  }
};

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Get WhatsApp chat link with optional message
 */
business.getWhatsAppLink = (message = '') => {
  const base = business.contact.whatsapp.link;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
};

/**
 * Get WhatsApp link for order inquiry
 */
business.getOrderInquiryLink = (orderNumber) => {
  return business.getWhatsAppLink(
    `Hi, I have a query regarding my order #${orderNumber} at ${business.identity.name}.`
  );
};

/**
 * Get WhatsApp link for product inquiry
 */
business.getProductInquiryLink = (productName) => {
  return business.getWhatsAppLink(
    `Hi, I'm interested in ${productName}. Please share more details.`
  );
};

/**
 * Get formatted phone for tel: links
 */
business.getTelLink = (type = 'primary') => {
  const phone = business.contact.phone[type]?.number || business.contact.phones[0];
  return `tel:${phone.replace(/\s/g, '')}`;
};

/**
 * Get mailto link
 */
business.getMailtoLink = (subject = '') => {
  const email = business.contact.email.primary;
  if (subject) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }
  return `mailto:${email}`;
};

/**
 * Check if currently open
 */
business.isCurrentlyOpen = () => {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const schedule = business.hours.schedule[today];
  
  if (!schedule.isOpen) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(schedule.open.replace(':', ''));
  const closeTime = parseInt(schedule.close.replace(':', ''));

  return currentTime >= openTime && currentTime <= closeTime;
};

/**
 * Get public config (safe to expose to frontend)
 */
business.getPublicConfig = () => {
  // Remove sensitive data
  const publicConfig = JSON.parse(JSON.stringify(business));

  // Remove internal functions
  delete publicConfig.getWhatsAppLink;
  delete publicConfig.getOrderInquiryLink;
  delete publicConfig.getProductInquiryLink;
  delete publicConfig.getTelLink;
  delete publicConfig.getMailtoLink;
  delete publicConfig.isCurrentlyOpen;
  delete publicConfig.getPublicConfig;

  // Remove sensitive business data
  delete publicConfig.invoice.bankDetails;

  return publicConfig;
};

// Freeze to prevent accidental modifications
Object.freeze(business.identity);
Object.freeze(business.contact);
Object.freeze(business.location);

module.exports = business;
