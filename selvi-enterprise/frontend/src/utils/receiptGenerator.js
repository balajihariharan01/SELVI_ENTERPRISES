import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a PDF receipt for an order
 * @param {Object} order - The order object
 * @param {boolean} isAdmin - Whether the receipt is for admin view
 * @returns {Promise<string>} - The filename of the downloaded PDF
 */
export const generateReceipt = async (order, isAdmin = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate order data
      if (!order || !order.orderNumber) {
        throw new Error('Invalid order data');
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Colors
      const primaryColor = [67, 56, 202]; // #4338ca - indigo
      const secondaryColor = [99, 102, 241]; // #6366f1 - lighter indigo
      const textDark = [31, 41, 55]; // #1f2937
      const textGray = [107, 114, 128]; // #6b7280
      
      // Try to load logo, fallback to text if fails
      let logoLoaded = false;
      try {
        const logoImg = await loadImage('/logo.png');
        if (logoImg) {
          doc.addImage(logoImg, 'PNG', 14, 10, 35, 35);
          logoLoaded = true;
        }
      } catch (error) {
        console.warn('Logo loading failed, using text fallback');
      }
      
      // Text fallback for logo
      if (!logoLoaded) {
        doc.setFontSize(24);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('SE', 28, 32);
      }
      
      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Selvi Enterprise', 55, 22);
      
      doc.setFontSize(9);
      doc.setTextColor(...textGray);
      doc.setFont('helvetica', 'normal');
      doc.text('Quality Products for Your Business', 55, 30);
      doc.text('Phone: +91 98765 43210', 55, 36);
      doc.text('Email: selvi.enterprise@gmail.com', 55, 42);
      
      // Receipt Title
      doc.setFontSize(16);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      const title = order.orderStatus === 'delivered' ? 'RECEIPT' : 'ORDER INVOICE';
      doc.text(title, pageWidth / 2, 56, { align: 'center' });
      
      // Draw a line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(14, 60, pageWidth - 14, 60);
      
      // Order Info Section
      const startY = 70;
      
      // Left column - Order details
      doc.setFontSize(9);
      doc.setTextColor(...textGray);
      doc.setFont('helvetica', 'normal');
      doc.text('Order Number:', 14, startY);
      doc.text('Order Date:', 14, startY + 6);
      doc.text('Payment Method:', 14, startY + 12);
      doc.text('Payment Status:', 14, startY + 18);
      doc.text('Order Status:', 14, startY + 24);
      
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text(String(order.orderNumber || 'N/A'), 50, startY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(order.createdAt), 50, startY + 6);
      doc.text(formatPaymentMethod(order.paymentMethod), 50, startY + 12);
      doc.text(capitalizeFirst(order.paymentStatus || 'pending'), 50, startY + 18);
      
      // Status with color
      const statusColor = getStatusColor(order.orderStatus);
      doc.setTextColor(...statusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(capitalizeFirst(order.orderStatus || 'pending'), 50, startY + 24);
      
      // Right column - Customer/Shipping details
      const rightCol = pageWidth / 2 + 5;
      doc.setTextColor(...textGray);
      doc.setFont('helvetica', 'normal');
      doc.text('Bill To:', rightCol, startY);
      
      const address = order.shippingAddress || {};
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text(String(address.name || 'N/A'), rightCol, startY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(String(address.phone || ''), rightCol, startY + 12);
      
      // Multi-line address
      const addressLines = [
        address.street,
        `${address.city || ''}, ${address.state || ''}`,
        address.pincode
      ].filter(Boolean);
      
      let addressY = startY + 18;
      addressLines.forEach(line => {
        doc.text(String(line), rightCol, addressY);
        addressY += 5;
      });
      
      // Items Table
      const tableStartY = startY + 40;
      
      const tableHeaders = [['#', 'Product', 'Unit Price', 'Qty', 'Subtotal']];
      const tableData = (order.items || []).map((item, index) => [
        String(index + 1),
        String(item.productName || item.product?.productName || 'Product'),
        `Rs.${(item.price || 0).toLocaleString('en-IN')}/${item.unit || 'unit'}`,
        String(item.quantity || 0),
        `Rs.${(item.subtotal || 0).toLocaleString('en-IN')}`
      ]);
      
      // Use autoTable function (jspdf-autotable 5.x syntax)
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: tableStartY,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: {
          textColor: textDark,
          halign: 'center',
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 65, halign: 'left' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });
      
      // Totals Section - get finalY from the doc's previous table
      const finalY = (doc.lastAutoTable?.finalY || tableStartY + 50) + 10;
      
      // Total box
      const boxWidth = 65;
      const boxX = pageWidth - 14 - boxWidth;
      
      doc.setDrawColor(...primaryColor);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(boxX, finalY, boxWidth, 28, 3, 3, 'FD');
      
      // Subtotal
      doc.setFontSize(9);
      doc.setTextColor(...textGray);
      doc.text('Subtotal:', boxX + 5, finalY + 10);
      doc.setTextColor(...textDark);
      doc.text(`Rs.${(order.totalAmount || 0).toLocaleString('en-IN')}`, boxX + boxWidth - 5, finalY + 10, { align: 'right' });
      
      // Grand Total
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Total:', boxX + 5, finalY + 22);
      doc.text(`Rs.${(order.totalAmount || 0).toLocaleString('en-IN')}`, boxX + boxWidth - 5, finalY + 22, { align: 'right' });
      
      // Notes section if exists
      let currentY = finalY + 40;
      if (order.notes) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textGray);
        doc.text('Order Notes:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const noteLines = doc.splitTextToSize(order.notes, pageWidth - 28);
        doc.text(noteLines, 14, currentY + 6);
        currentY += 6 + (noteLines.length * 5);
      }
      
      // Admin notes (only for admin view)
      if (isAdmin && order.adminNotes) {
        currentY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.text('Admin Notes:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        const adminNoteLines = doc.splitTextToSize(order.adminNotes, pageWidth - 28);
        doc.text(adminNoteLines, 14, currentY + 6);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 22;
      
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.3);
      doc.line(14, footerY, pageWidth - 14, footerY);
      
      doc.setFontSize(8);
      doc.setTextColor(...textGray);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', pageWidth / 2, footerY + 6, { align: 'center' });
      doc.text('For any queries, please contact us at selvi.enterprise@gmail.com', pageWidth / 2, footerY + 11, { align: 'center' });
      
      // Generated timestamp
      doc.setFontSize(7);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, footerY + 16, { align: 'right' });
      
      // Generate filename
      const filename = `Receipt_${order.orderNumber}.pdf`;
      
      // Method 1: Try direct blob download (most reliable)
      try {
        const pdfBlob = doc.output('blob');
        downloadBlob(pdfBlob, filename);
        resolve(filename);
        return;
      } catch (blobError) {
        console.warn('Blob download failed, trying alternative method');
      }
      
      // Method 2: Fallback to data URI
      try {
        const pdfDataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(filename);
        return;
      } catch (uriError) {
        console.warn('Data URI download failed, trying save method');
      }
      
      // Method 3: Last resort - use jsPDF save
      doc.save(filename);
      resolve(filename);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(new Error(`Failed to generate receipt: ${error.message}`));
    }
  });
};

/**
 * Download blob as file
 */
const downloadBlob = (blob, filename) => {
  // Create object URL
  const url = window.URL.createObjectURL(blob);
  
  // Create temporary link
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  
  // Cleanup after small delay
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Load an image and return as base64
 */
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Image load failed'));
    };
    
    img.src = src;
  });
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format payment method for display
 */
const formatPaymentMethod = (method) => {
  const methods = {
    cod: 'Cash on Delivery',
    online: 'Online Payment',
    credit: 'Credit'
  };
  return methods[method] || method || 'N/A';
};

/**
 * Capitalize first letter
 */
const capitalizeFirst = (str) => {
  if (!str) return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get status color as RGB array
 */
const getStatusColor = (status) => {
  const colors = {
    pending: [234, 179, 8],     // amber
    confirmed: [59, 130, 246],  // blue
    processing: [99, 102, 241], // indigo
    shipped: [14, 165, 233],    // sky
    delivered: [34, 197, 94],   // green
    cancelled: [239, 68, 68]    // red
  };
  return colors[status] || [107, 114, 128];
};

export default generateReceipt;
