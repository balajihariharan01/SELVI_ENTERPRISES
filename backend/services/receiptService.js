const PDFDocument = require('pdfkit');

/**
 * ============================================
 * SERVER-SIDE RECEIPT GENERATOR
 * ============================================
 * Generates PDF receipts for email attachments
 * Uses pdfkit for server-side PDF generation
 * ============================================
 */

// Business Configuration
const BUSINESS_INFO = {
  name: 'Selvi Enterprise',
  tagline: 'Steel & Cement Suppliers',
  email: 'selvienterprises.ooty@gmail.com',
  phone1: '+91 6380470432',
  phone2: '+91 7904775217',
  gst: '33AADCS1234F1Z5',
  address: {
    street: 'Opposite to Eye Foundation',
    area: 'Coonoor Main Road',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pincode: '643001'
  }
};

// Colors (RGB)
const COLORS = {
  primary: '#0F0689',
  secondary: '#0857BE',
  accent: '#EFB523',
  dark: '#1a1a2e',
  gray: '#666666',
  lightGray: '#f5f5f5'
};

/**
 * Format currency in INR
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Format date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Generate PDF receipt buffer
 * @param {Object} order - Order document
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateReceiptPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Receipt - Order #${order.orderNumber}`,
          Author: BUSINESS_INFO.name,
          Subject: 'Order Receipt'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // ===== HEADER SECTION =====
      // Company Name
      doc.fontSize(24)
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .text(BUSINESS_INFO.name, margin, 50, { align: 'left' });

      // Tagline
      doc.fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text(BUSINESS_INFO.tagline, margin, 78);

      // RECEIPT title on right
      doc.fontSize(28)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('RECEIPT', pageWidth - margin - 150, 50, { width: 150, align: 'right' });

      // Company Address
      doc.fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text(`${BUSINESS_INFO.address.street}`, margin, 95)
        .text(`${BUSINESS_INFO.address.area}`, margin, 107)
        .text(`${BUSINESS_INFO.address.city}, ${BUSINESS_INFO.address.state} - ${BUSINESS_INFO.address.pincode}`, margin, 119)
        .text(`Phone: ${BUSINESS_INFO.phone1}`, margin, 131);

      // Accent line
      doc.strokeColor(COLORS.accent)
        .lineWidth(3)
        .moveTo(margin, 150)
        .lineTo(pageWidth - margin, 150)
        .stroke();

      // ===== ORDER INFO SECTION =====
      let yPos = 170;

      // Left column: Bill To
      doc.fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .text('BILL TO:', margin, yPos);

      const customerName = order.shippingAddress?.name || order.user?.name || 'Customer';
      const customerAddress = order.shippingAddress;

      doc.fontSize(11)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(customerName, margin, yPos + 15);

      if (customerAddress) {
        doc.fontSize(9)
          .fillColor(COLORS.gray)
          .font('Helvetica')
          .text(customerAddress.addressLine1 || '', margin, yPos + 30)
          .text(customerAddress.addressLine2 || '', margin, yPos + 42)
          .text(`${customerAddress.city || ''}, ${customerAddress.state || ''} - ${customerAddress.pincode || ''}`, margin, yPos + 54)
          .text(`Phone: ${customerAddress.phone || ''}`, margin, yPos + 66);
      }

      // Right column: Receipt Info
      const rightCol = pageWidth - margin - 150;
      doc.fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .text('RECEIPT INFO:', rightCol, yPos, { width: 150 });

      doc.fontSize(9)
        .fillColor(COLORS.dark)
        .font('Helvetica')
        .text(`Receipt #: ${order.orderNumber}`, rightCol, yPos + 15, { width: 150 })
        .text(`Date: ${formatDate(order.createdAt)}`, rightCol, yPos + 30, { width: 150 })
        .text(`Status: ${order.paymentStatus?.toUpperCase() || 'PAID'}`, rightCol, yPos + 45, { width: 150 });

      // ===== ITEMS TABLE =====
      yPos = 270;

      // Table Header
      const colWidths = {
        item: contentWidth * 0.4,
        qty: contentWidth * 0.15,
        price: contentWidth * 0.2,
        total: contentWidth * 0.25
      };

      // Header background
      doc.fillColor(COLORS.primary)
        .rect(margin, yPos, contentWidth, 25)
        .fill();

      // Header text
      doc.fontSize(10)
        .fillColor('#ffffff')
        .font('Helvetica-Bold');

      let xPos = margin + 10;
      doc.text('ITEM', xPos, yPos + 8, { width: colWidths.item - 10 });
      xPos += colWidths.item;
      doc.text('QTY', xPos, yPos + 8, { width: colWidths.qty, align: 'center' });
      xPos += colWidths.qty;
      doc.text('PRICE', xPos, yPos + 8, { width: colWidths.price, align: 'right' });
      xPos += colWidths.price;
      doc.text('TOTAL', xPos, yPos + 8, { width: colWidths.total - 10, align: 'right' });

      yPos += 25;

      // Table Rows
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const rowBg = index % 2 === 0 ? '#ffffff' : COLORS.lightGray;
          
          doc.fillColor(rowBg)
            .rect(margin, yPos, contentWidth, 25)
            .fill();

          doc.fontSize(9)
            .fillColor(COLORS.dark)
            .font('Helvetica');

          xPos = margin + 10;
          doc.text(item.name || item.product?.name || 'Product', xPos, yPos + 8, { width: colWidths.item - 10 });
          xPos += colWidths.item;
          doc.text(String(item.quantity), xPos, yPos + 8, { width: colWidths.qty, align: 'center' });
          xPos += colWidths.qty;
          doc.text(formatCurrency(item.price), xPos, yPos + 8, { width: colWidths.price, align: 'right' });
          xPos += colWidths.price;
          doc.text(formatCurrency(item.price * item.quantity), xPos, yPos + 8, { width: colWidths.total - 10, align: 'right' });

          yPos += 25;
        });
      }

      // Border around table
      doc.strokeColor('#cccccc')
        .lineWidth(0.5)
        .rect(margin, 270, contentWidth, yPos - 270)
        .stroke();

      // ===== TOTALS SECTION =====
      yPos += 20;

      const totalsX = pageWidth - margin - 200;

      // Subtotal
      doc.fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text('Subtotal:', totalsX, yPos, { width: 100 })
        .fillColor(COLORS.dark)
        .text(formatCurrency(order.subtotal || order.totalAmount), totalsX + 100, yPos, { width: 100, align: 'right' });

      yPos += 18;

      // Delivery (if applicable)
      if (order.deliveryCharges) {
        doc.fillColor(COLORS.gray)
          .text('Delivery:', totalsX, yPos, { width: 100 })
          .fillColor(COLORS.dark)
          .text(formatCurrency(order.deliveryCharges), totalsX + 100, yPos, { width: 100, align: 'right' });
        yPos += 18;
      }

      // Discount (if applicable)
      if (order.discount) {
        doc.fillColor('#22c55e')
          .text('Discount:', totalsX, yPos, { width: 100 })
          .text(`-${formatCurrency(order.discount)}`, totalsX + 100, yPos, { width: 100, align: 'right' });
        yPos += 18;
      }

      // Separator line
      doc.strokeColor(COLORS.dark)
        .lineWidth(1)
        .moveTo(totalsX, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();

      yPos += 10;

      // Grand Total
      doc.fontSize(14)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalsX, yPos, { width: 100 })
        .fillColor(COLORS.primary)
        .text(formatCurrency(order.totalAmount), totalsX + 100, yPos, { width: 100, align: 'right' });

      // ===== PAYMENT STATUS BOX =====
      yPos += 40;
      
      doc.fillColor('#dcfce7')
        .roundedRect(margin, yPos, 150, 35, 5)
        .fill();

      doc.fontSize(10)
        .fillColor('#166534')
        .font('Helvetica-Bold')
        .text('✓ PAYMENT RECEIVED', margin + 15, yPos + 12);

      // ===== FOOTER =====
      const footerY = doc.page.height - 80;

      doc.strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(margin, footerY - 20)
        .lineTo(pageWidth - margin, footerY - 20)
        .stroke();

      doc.fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text('Thank you for your business!', margin, footerY, { width: contentWidth, align: 'center' })
        .text(`${BUSINESS_INFO.name} | ${BUSINESS_INFO.email} | ${BUSINESS_INFO.phone1}`, margin, footerY + 15, { width: contentWidth, align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptPDF };
