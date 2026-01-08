const { sendContactToAdmin, sendContactAcknowledgment } = require('../services/emailService');
const ContactMessage = require('../models/ContactMessage');

/**
 * Contact Controller
 * Handles contact form submissions and sends email to admin
 */

/**
 * Send contact message to admin
 * POST /api/contact
 */
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, message)'
      });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone format (10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
    }

    // Get client IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    // Save contact message to database first
    const contactMessage = new ContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phoneDigits,
      subject: subject?.trim() || 'General Inquiry',
      message: message.trim(),
      ipAddress
    });

    await contactMessage.save();
    console.log(`📝 Contact message saved to database: ${contactMessage._id}`);

    const contactData = { name, email, phone, subject, message };

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
      console.warn('⚠️ Email service not configured properly. Message saved to database.');
      
      // Still return success since message is saved
      return res.status(200).json({
        success: true,
        message: 'Your message has been received! We will get back to you within 24 hours.'
      });
    }

    // Try to send email to admin
    let emailSentToAdmin = false;
    let emailSentToCustomer = false;

    try {
      await sendContactToAdmin(contactData);
      emailSentToAdmin = true;
      console.log(`📧 Contact form from ${name} (${email}) - Admin email sent`);

      // Send acknowledgment to customer (non-blocking)
      sendContactAcknowledgment(contactData)
        .then(() => {
          emailSentToCustomer = true;
          // Update database
          ContactMessage.findByIdAndUpdate(contactMessage._id, {
            emailSentToAdmin: true,
            emailSentToCustomer: true
          }).catch(err => console.error('Failed to update contact message status:', err));
        })
        .catch(err => {
          console.error('⚠️ Failed to send acknowledgment email:', err.message);
        });

      // Update admin email status
      contactMessage.emailSentToAdmin = true;
      await contactMessage.save();

      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you within 24 hours.'
      });

    } catch (emailError) {
      console.error('❌ Email send failed:', emailError.message);

      // Message is still saved in database, so partial success
      // Determine user-friendly error message
      let errorMessage = 'Your message has been received but we could not send a confirmation email. We will still respond within 24 hours.';
      
      if (emailError.message.includes('Invalid login') || emailError.message.includes('authentication') || emailError.message.includes('EAUTH')) {
        console.error('⚠️ Gmail authentication failed. Ensure App Password is used, not regular password.');
      } else if (emailError.message.includes('ECONNREFUSED') || emailError.message.includes('ETIMEDOUT') || emailError.message.includes('ENOTFOUND')) {
        console.error('⚠️ Could not connect to email server.');
      }

      // Return success since message is saved to database
      return res.status(200).json({
        success: true,
        message: errorMessage
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again or contact us via phone at +91 6380470432.'
    });
  }
};

/**
 * Get all contact messages (Admin)
 * GET /api/contact/admin/messages
 */
exports.getContactMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // read, unread, all

    let query = {};
    if (status === 'unread') {
      query.isRead = false;
    } else if (status === 'read') {
      query.isRead = true;
    }

    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages'
    });
  }
};

/**
 * Resend contact email to admin
 * POST /api/contact/admin/:id/resend
 */
exports.resendContactEmail = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    const contactData = {
      name: message.name,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message: message.message
    };

    try {
      await sendContactToAdmin(contactData);
      
      // Update message status
      message.emailSentToAdmin = true;
      await message.save();

      res.json({
        success: true,
        message: 'Contact email resent successfully to admin'
      });
    } catch (emailError) {
      res.status(500).json({
        success: false,
        message: 'Failed to resend email',
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('Resend contact email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend contact email'
    });
  }
};
