const nodemailer = require('nodemailer');
const { generateReceiptPDF } = require('./receiptService');

/**
 * ============================================
 * EMAIL SERVICE - Production Ready
 * ============================================
 * Centralized email service for Selvi Enterprise
 * Handles: Contact forms, Order receipts, Notifications
 * Features: Retry logic, Connection pooling, Error tracking
 * ============================================
 */

// Business Configuration
const BUSINESS_INFO = {
  name: 'Selvi Enterprise',
  tagline: 'Steel & Cement Suppliers',
  email: 'selvienterprises.ooty@gmail.com',
  phone1: '+91 6380470432',
  phone2: '+91 7904775217',
  address: {
    street: 'Opposite to Eye Foundation',
    area: 'Coonoor Main Road',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pincode: '643001'
  },
  website: 'www.selvienterprises.com'
};

// Email Templates Colors
const COLORS = {
  primary: '#0F0689',
  secondary: '#0857BE',
  accent: '#EFB523',
  success: '#22c55e',
  dark: '#1f2937',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  white: '#ffffff'
};

// Email service state
let transporter = null;
let isConfigured = false;
let lastConnectionCheck = null;
let connectionStatus = 'unknown';

/**
 * Check if email service is properly configured
 */
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) {
    return { configured: false, reason: 'EMAIL_USER or EMAIL_PASS not set in .env' };
  }
  
  if (pass === 'your_16_char_app_password_here' || pass.length < 16) {
    return { configured: false, reason: 'EMAIL_PASS is placeholder or invalid. Get App Password from Google.' };
  }
  
  return { configured: true };
};

/**
 * Initialize email transporter with robust configuration
 */
const initializeTransporter = async () => {
  const configCheck = isEmailConfigured();
  
  if (!configCheck.configured) {
    console.warn(`⚠️ Email service not configured: ${configCheck.reason}`);
    isConfigured = false;
    connectionStatus = 'not_configured';
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      rateDelta: 10000,
      rateLimit: 3,
      // Additional Gmail-specific settings
      secure: true,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      // Connection timeouts
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    isConfigured = true;
    connectionStatus = 'connected';
    lastConnectionCheck = new Date();
    return transporter;
    
  } catch (error) {
    console.error('❌ Email service initialization failed:', error.message);
    isConfigured = false;
    connectionStatus = 'error';
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
      console.error('   → Gmail authentication failed. Check:');
      console.error('   → 1. EMAIL_USER is correct');
      console.error('   → 2. EMAIL_PASS is a 16-char App Password (NOT your regular password)');
      console.error('   → 3. 2-Step Verification is enabled on your Google account');
      console.error('   → Get App Password: Google Account → Security → App passwords');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('   → Could not connect to Gmail servers. Check internet connection.');
    }
    
    return null;
  }
};

/**
 * Get or create transporter (lazy initialization)
 */
const getTransporter = async () => {
  if (transporter && isConfigured) {
    return transporter;
  }
  return initializeTransporter();
};

/**
 * Test email configuration without sending
 */
const testEmailConfiguration = async () => {
  const configCheck = isEmailConfigured();
  
  if (!configCheck.configured) {
    return {
      success: false,
      status: 'not_configured',
      message: configCheck.reason,
      steps: [
        '1. Enable 2-Step Verification in your Google Account',
        '2. Go to: Google Account → Security → App passwords',
        '3. Generate a new App Password for "Mail"',
        '4. Copy the 16-character password (no spaces)',
        '5. Update EMAIL_PASS in your .env file',
        '6. Restart the server'
      ]
    };
  }

  try {
    const transport = await getTransporter();
    if (!transport) {
      return {
        success: false,
        status: 'initialization_failed',
        message: 'Failed to create email transporter'
      };
    }

    await transport.verify();
    return {
      success: true,
      status: 'connected',
      message: 'Email service is properly configured and connected',
      emailUser: process.env.EMAIL_USER
    };
  } catch (error) {
    return {
      success: false,
      status: 'connection_failed',
      message: error.message,
      code: error.code
    };
  }
};

/**
 * Get email service status
 */
const getEmailServiceStatus = () => {
  const configCheck = isEmailConfigured();
  return {
    configured: configCheck.configured,
    reason: configCheck.reason,
    connectionStatus,
    lastConnectionCheck,
    emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}****` : 'Not set'
  };
};

/**
 * Get email header HTML with logo
 * @param {string} title - Email title
 */
const getEmailHeader = (title) => `
  <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <img src="https://selvienterprises.com/logo.png" alt="Selvi Enterprise" style="height: 60px; margin-bottom: 15px;" onerror="this.style.display='none'" />
    <h1 style="color: ${COLORS.white}; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">${title}</h1>
  </div>
`;

/**
 * Get email footer HTML
 */
const getEmailFooter = () => `
  <div style="background: ${COLORS.dark}; color: ${COLORS.gray}; padding: 20px; text-align: center; font-size: 12px; font-family: Arial, sans-serif; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 5px 0; color: ${COLORS.accent}; font-weight: bold;">${BUSINESS_INFO.name}</p>
    <p style="margin: 0 0 5px 0;">${BUSINESS_INFO.tagline}</p>
    <p style="margin: 0 0 5px 0;">${BUSINESS_INFO.address.street}, ${BUSINESS_INFO.address.area}</p>
    <p style="margin: 0 0 10px 0;">${BUSINESS_INFO.address.city}, ${BUSINESS_INFO.address.state} - ${BUSINESS_INFO.address.pincode}</p>
    <p style="margin: 0;">📞 ${BUSINESS_INFO.phone1} | ${BUSINESS_INFO.phone2}</p>
    <p style="margin: 5px 0 0 0;">📧 ${BUSINESS_INFO.email}</p>
  </div>
`;

/**
 * Send email with retry logic
 * @param {Object} options - Email options
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async (options, retries = 3) => {
  const configCheck = isEmailConfigured();
  
  if (!configCheck.configured) {
    const error = new Error(`Email not configured: ${configCheck.reason}`);
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const transport = await getTransporter();
  if (!transport) {
    const error = new Error('Email transporter not available');
    error.code = 'TRANSPORTER_UNAVAILABLE';
    throw error;
  }

  const mailOptions = {
    from: options.from || `"${BUSINESS_INFO.name}" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo || process.env.EMAIL_USER,
    attachments: options.attachments || []
  };

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await transport.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${options.to} (attempt ${attempt})`);
      console.log(`   → Message ID: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
        attempt
      };
    } catch (error) {
      lastError = error;
      console.error(`❌ Email send attempt ${attempt}/${retries} failed:`, error.message);
      
      // Don't retry for authentication errors
      if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`   → Retrying in ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  const errorResult = new Error(`Failed to send email after ${retries} attempts: ${lastError.message}`);
  errorResult.code = lastError.code || 'SEND_FAILED';
  errorResult.originalError = lastError;
  throw errorResult;
};

/**
 * Send contact form message to admin
 * @param {Object} data - Contact form data
 */
const sendContactToAdmin = async (data) => {
  const { name, email, phone, subject, message } = data;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  const emailSubject = `New Contact Message – ${BUSINESS_INFO.name}${subject ? ` – ${subject}` : ''}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: ${COLORS.lightGray};">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${getEmailHeader('📧 New Contact Form Submission')}
        
        <div style="background: ${COLORS.white}; padding: 25px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; background: ${COLORS.lightGray}; font-weight: bold; color: ${COLORS.dark}; width: 120px; border-radius: 4px 0 0 4px;">👤 Name</td>
              <td style="padding: 12px; background: ${COLORS.white}; border: 1px solid #e5e7eb; border-radius: 0 4px 4px 0;">${name}</td>
            </tr>
            <tr><td colspan="2" style="height: 10px;"></td></tr>
            <tr>
              <td style="padding: 12px; background: ${COLORS.lightGray}; font-weight: bold; color: ${COLORS.dark}; border-radius: 4px 0 0 4px;">📧 Email</td>
              <td style="padding: 12px; background: ${COLORS.white}; border: 1px solid #e5e7eb; border-radius: 0 4px 4px 0;">
                <a href="mailto:${email}" style="color: ${COLORS.secondary}; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr><td colspan="2" style="height: 10px;"></td></tr>
            <tr>
              <td style="padding: 12px; background: ${COLORS.lightGray}; font-weight: bold; color: ${COLORS.dark}; border-radius: 4px 0 0 4px;">📱 Phone</td>
              <td style="padding: 12px; background: ${COLORS.white}; border: 1px solid #e5e7eb; border-radius: 0 4px 4px 0;">
                <a href="tel:${phone}" style="color: ${COLORS.secondary}; text-decoration: none;">${phone}</a>
              </td>
            </tr>
            ${subject ? `
            <tr><td colspan="2" style="height: 10px;"></td></tr>
            <tr>
              <td style="padding: 12px; background: ${COLORS.lightGray}; font-weight: bold; color: ${COLORS.dark}; border-radius: 4px 0 0 4px;">📋 Subject</td>
              <td style="padding: 12px; background: ${COLORS.white}; border: 1px solid #e5e7eb; border-radius: 0 4px 4px 0;">${subject}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="margin-top: 20px;">
            <div style="font-weight: bold; color: ${COLORS.dark}; margin-bottom: 10px;">💬 Message</div>
            <div style="padding: 15px; background: ${COLORS.lightGray}; border-left: 4px solid ${COLORS.secondary}; border-radius: 4px; white-space: pre-wrap; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 4px; border-left: 4px solid ${COLORS.accent};">
            <strong>⏰ Received:</strong> ${timestamp}
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;

  const text = `
New Contact Form Submission
===========================

Name: ${name}
Email: ${email}
Phone: ${phone}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}

---
Received: ${timestamp}
  `;

  return sendEmail({
    to: adminEmail,
    subject: emailSubject,
    html,
    text,
    replyTo: email
  });
};

/**
 * Send acknowledgment email to customer
 * @param {Object} data - Contact form data
 */
const sendContactAcknowledgment = async (data) => {
  const { name, email } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: ${COLORS.lightGray};">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${getEmailHeader('Thank You for Contacting Us!')}
        
        <div style="background: ${COLORS.white}; padding: 25px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: ${COLORS.dark}; line-height: 1.6;">
            Dear <strong>${name}</strong>,
          </p>
          <p style="color: ${COLORS.gray}; line-height: 1.6;">
            Thank you for reaching out to ${BUSINESS_INFO.name}. We have received your message and will get back to you within <strong>24-48 hours</strong>.
          </p>
          <p style="color: ${COLORS.gray}; line-height: 1.6;">
            If your inquiry is urgent, please feel free to contact us directly.
          </p>
          
          <div style="margin-top: 20px; padding: 20px; background: ${COLORS.primary}; color: ${COLORS.white}; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: ${COLORS.accent};">📞 Contact Information</h3>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${BUSINESS_INFO.phone1} / ${BUSINESS_INFO.phone2}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${BUSINESS_INFO.email}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${BUSINESS_INFO.address.street}, ${BUSINESS_INFO.address.area}, ${BUSINESS_INFO.address.city} - ${BUSINESS_INFO.address.pincode}</p>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Thank you for contacting ${BUSINESS_INFO.name}`,
    html
  });
};

/**
 * Send receipt/invoice email to customer after successful payment
 * @param {Object} order - Order document with populated user
 * @param {Buffer} pdfBuffer - PDF receipt buffer (optional)
 */
const sendReceiptEmail = async (order, pdfBuffer = null) => {
  const user = order.user;
  const customerEmail = user?.email || order.shippingAddress?.email;
  const customerName = user?.name || order.shippingAddress?.name || 'Valued Customer';
  
  if (!customerEmail) {
    throw new Error('Customer email not found');
  }

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Build items table
  let itemsHtml = '';
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? COLORS.white : COLORS.lightGray;
      itemsHtml += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name || item.product?.name || 'Product'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `;
    });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: ${COLORS.lightGray};">
      <div style="max-width: 650px; margin: 0 auto; padding: 20px;">
        ${getEmailHeader(`Your Receipt from ${BUSINESS_INFO.name}`)}
        
        <div style="background: ${COLORS.white}; padding: 25px; border: 1px solid #e5e7eb;">
          <!-- Greeting -->
          <div style="margin-bottom: 20px;">
            <p style="font-size: 16px; color: ${COLORS.dark}; margin: 0;">
              Dear <strong>${customerName}</strong>,
            </p>
            <p style="color: ${COLORS.gray}; margin-top: 10px; line-height: 1.6;">
              Thank you for your purchase! Your payment has been successfully processed.
              Please find your receipt details below.
            </p>
          </div>

          <!-- Order Info Box -->
          <div style="background: ${COLORS.success}; color: ${COLORS.white}; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
            <table style="width: 100%;">
              <tr>
                <td>
                  <strong style="font-size: 14px;">Order #${order.orderNumber}</strong>
                </td>
                <td style="text-align: right;">
                  <span style="background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 15px; font-size: 12px;">
                    ✓ PAID
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Order Details -->
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.gray};">Order Date:</td>
              <td style="padding: 8px 0; color: ${COLORS.dark}; text-align: right;">${orderDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.gray};">Payment Method:</td>
              <td style="padding: 8px 0; color: ${COLORS.dark}; text-align: right;">Online Payment (Stripe)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.gray};">Payment Status:</td>
              <td style="padding: 8px 0; text-align: right;">
                <span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 12px;">Paid</span>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <div style="margin: 20px 0;">
            <h3 style="color: ${COLORS.dark}; margin: 0 0 15px 0; font-size: 16px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: ${COLORS.primary}; color: ${COLORS.white};">
                  <th style="padding: 12px; text-align: left; border-radius: 4px 0 0 4px;">Item</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                  <th style="padding: 12px; text-align: right; border-radius: 0 4px 4px 0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="border-top: 2px solid ${COLORS.lightGray}; padding-top: 15px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: ${COLORS.gray};">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.subtotal || order.totalAmount)}</td>
              </tr>
              ${order.deliveryCharges ? `
              <tr>
                <td style="padding: 8px 0; color: ${COLORS.gray};">Delivery Charges:</td>
                <td style="padding: 8px 0; text-align: right;">${formatCurrency(order.deliveryCharges)}</td>
              </tr>
              ` : ''}
              ${order.discount ? `
              <tr>
                <td style="padding: 8px 0; color: ${COLORS.success};">Discount:</td>
                <td style="padding: 8px 0; text-align: right; color: ${COLORS.success};">-${formatCurrency(order.discount)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid ${COLORS.dark};">
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: ${COLORS.dark};">Total Amount:</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; text-align: right; color: ${COLORS.primary};">
                  ${formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </table>
          </div>

          <!-- Shipping Address -->
          ${order.shippingAddress ? `
          <div style="margin-top: 25px; padding: 15px; background: ${COLORS.lightGray}; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: ${COLORS.dark};">📦 Delivery Address</h4>
            <p style="margin: 0; color: ${COLORS.gray}; line-height: 1.6;">
              ${order.shippingAddress.name || ''}<br>
              ${order.shippingAddress.addressLine1 || ''}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
              ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.pincode || ''}<br>
              Phone: ${order.shippingAddress.phone || ''}
            </p>
          </div>
          ` : ''}

          <!-- Support Info -->
          <div style="margin-top: 25px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid ${COLORS.accent};">
            <h4 style="margin: 0 0 10px 0; color: ${COLORS.dark};">Need Help?</h4>
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
              If you have any questions about your order, please contact us:<br>
              📞 ${BUSINESS_INFO.phone1} / ${BUSINESS_INFO.phone2}<br>
              📧 ${BUSINESS_INFO.email}
            </p>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  
  // Generate PDF if not provided
  let pdfData = pdfBuffer;
  if (!pdfData) {
    try {
      pdfData = await generateReceiptPDF(order);
      console.log(`📄 Generated PDF receipt for order ${order.orderNumber}`);
    } catch (pdfError) {
      console.error(`⚠️ Failed to generate PDF for order ${order.orderNumber}:`, pdfError.message);
      // Continue without PDF attachment
    }
  }
  
  if (pdfData) {
    attachments.push({
      filename: `Receipt_${order.orderNumber}.pdf`,
      content: pdfData,
      contentType: 'application/pdf'
    });
  }

  return sendEmail({
    to: customerEmail,
    subject: `Your Receipt from ${BUSINESS_INFO.name} – Order #${order.orderNumber}`,
    html,
    attachments
  });
};

/**
 * Send order status update email
 * @param {Object} order - Order document
 * @param {string} status - New status
 */
const sendOrderStatusEmail = async (order, status) => {
  const user = order.user;
  const customerEmail = user?.email || order.shippingAddress?.email;
  const customerName = user?.name || order.shippingAddress?.name || 'Valued Customer';

  if (!customerEmail) {
    throw new Error('Customer email not found');
  }

  const statusMessages = {
    confirmed: {
      title: 'Order Confirmed! ✓',
      message: 'Great news! Your order has been confirmed and is being processed.',
      color: COLORS.success
    },
    processing: {
      title: 'Order Being Processed',
      message: 'Your order is currently being prepared for shipment.',
      color: COLORS.secondary
    },
    shipped: {
      title: 'Order Shipped! 🚚',
      message: 'Your order has been shipped and is on its way to you.',
      color: COLORS.primary
    },
    delivered: {
      title: 'Order Delivered! 📦',
      message: 'Your order has been successfully delivered. Thank you for shopping with us!',
      color: COLORS.success
    },
    cancelled: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact us.',
      color: '#ef4444'
    }
  };

  const statusInfo = statusMessages[status] || {
    title: 'Order Status Update',
    message: `Your order status has been updated to: ${status}`,
    color: COLORS.secondary
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: ${COLORS.lightGray};">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${getEmailHeader(statusInfo.title)}
        
        <div style="background: ${COLORS.white}; padding: 25px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: ${COLORS.dark};">Dear <strong>${customerName}</strong>,</p>
          <p style="color: ${COLORS.gray}; line-height: 1.6;">${statusInfo.message}</p>
          
          <div style="background: ${statusInfo.color}; color: ${COLORS.white}; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Order #${order.orderNumber}</strong><br>
            <span style="font-size: 14px; opacity: 0.9;">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>

          <p style="color: ${COLORS.gray}; line-height: 1.6;">
            For any questions, please contact us at ${BUSINESS_INFO.phone1} or reply to this email.
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order #${order.orderNumber} - ${statusInfo.title}`,
    html
  });
};

module.exports = {
  initializeTransporter,
  getTransporter,
  sendEmail,
  sendContactToAdmin,
  sendContactAcknowledgment,
  sendReceiptEmail,
  sendOrderStatusEmail,
  testEmailConfiguration,
  getEmailServiceStatus,
  isEmailConfigured,
  BUSINESS_INFO
};
