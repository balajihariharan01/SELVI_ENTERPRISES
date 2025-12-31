import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BUSINESS_CONFIG } from '../config/businessConfig';

/**
 * Professional Receipt Generator
 * Accounting-grade, print-ready PDF receipt
 * 
 * Design System:
 * - Colors: Soft blue (#dbeafe), Dark slate (#1e293b), Gray (#64748b), Light gray (#e5e7eb)
 * - Typography: Helvetica (closest to Inter in jsPDF)
 * - Spacing: 4px/8px system converted to PDF units
 */

// ==============================================
// COLOR SYSTEM (Professional & Minimal)
// ==============================================
const COLORS = {
  primary: [219, 234, 254],      // #dbeafe - Soft blue background
  primaryDark: [191, 219, 254],  // #bfdbfe - Slightly darker blue
  primaryAccent: [59, 130, 246], // #3b82f6 - Blue accent
  textDark: [30, 41, 59],        // #1e293b - Dark slate
  textGray: [100, 116, 139],     // #64748b - Muted gray
  border: [229, 231, 235],       // #e5e7eb - Light gray border
  white: [255, 255, 255],        // #ffffff
  tableHeader: [241, 245, 249],  // #f1f5f9 - Very light blue-gray
  totalBg: [239, 246, 255],      // #eff6ff - Lightest blue
};

// ==============================================
// TYPOGRAPHY SETTINGS
// ==============================================
const FONTS = {
  title: { size: 20, style: 'bold' },
  sectionHeading: { size: 12, style: 'bold' },
  label: { size: 10, style: 'normal' },
  value: { size: 10, style: 'bold' },
  body: { size: 10, style: 'normal' },
  small: { size: 9, style: 'normal' },
  tiny: { size: 8, style: 'normal' },
};

// ==============================================
// LAYOUT CONSTANTS (A4 Portrait)
// ==============================================
const LAYOUT = {
  margin: 20,           // Equal margins on all sides
  pageWidth: 210,       // A4 width in mm
  pageHeight: 297,      // A4 height in mm
  contentWidth: 170,    // 210 - (20 * 2)
  columnGap: 10,
  rowGap: 4,
  sectionGap: 16,
};

/**
 * Generate and download a professional PDF receipt
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

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (LAYOUT.margin * 2);
      const leftX = LAYOUT.margin;
      const rightX = pageWidth - LAYOUT.margin;
      
      let currentY = LAYOUT.margin;

      // ==============================================
      // HEADER SECTION
      // ==============================================
      
      // LEFT SIDE: Receipt title and company info
      // RECEIPT Title
      doc.setFont('helvetica', FONTS.title.style);
      doc.setFontSize(FONTS.title.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text('RECEIPT', leftX, currentY + 6);
      
      // Company Name (bold)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.textDark);
      doc.text(BUSINESS_CONFIG.name, leftX, currentY + 14);
      
      // Company Details (normal)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      
      const companyLines = [
        BUSINESS_CONFIG.location.street,
        `${BUSINESS_CONFIG.location.city}, ${BUSINESS_CONFIG.location.state} - ${BUSINESS_CONFIG.location.pincode}`,
        `Phone: ${BUSINESS_CONFIG.contact.phones.join(' / ')}`,
        `Email: ${BUSINESS_CONFIG.contact.email}`,
      ];
      
      let companyY = currentY + 20;
      companyLines.forEach((line, index) => {
        doc.text(line, leftX, companyY + (index * 4.5));
      });
      
      // RIGHT SIDE: Logo placeholder, Date, Receipt No
      const logoX = rightX - 25;
      const logoY = currentY;
      const logoSize = 20;
      
      // Circular logo placeholder
      doc.setDrawColor(...COLORS.border);
      doc.setFillColor(...COLORS.tableHeader);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'FD');
      
      // Logo text fallback
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.primaryAccent);
      doc.text('SE', logoX + logoSize/2, logoY + logoSize/2 + 2, { align: 'center' });
      
      // Date (below logo, right aligned)
      const metaX = rightX;
      const metaY = logoY + logoSize + 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Date:', metaX - 35, metaY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(formatDateShort(order.createdAt), metaX, metaY, { align: 'right' });
      
      // Receipt Number (below date)
      doc.setTextColor(...COLORS.textGray);
      doc.text('Receipt No:', metaX - 35, metaY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(order.orderNumber || 'N/A'), metaX, metaY + 5, { align: 'right' });
      
      currentY += 48;
      
      // Divider line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(leftX, currentY, rightX, currentY);
      
      currentY += LAYOUT.sectionGap;

      // ==============================================
      // BILLING INFORMATION SECTION
      // ==============================================
      
      const colWidth = (contentWidth - LAYOUT.columnGap) / 2;
      const leftColX = leftX;
      const rightColX = leftX + colWidth + LAYOUT.columnGap;
      
      // BILL TO Section (Left)
      doc.setFont('helvetica', FONTS.sectionHeading.style);
      doc.setFontSize(FONTS.sectionHeading.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text('BILL TO', leftColX, currentY);
      
      // SITE / LOCATION Section (Right)
      doc.text('SHIPPING ADDRESS', rightColX, currentY);
      
      currentY += 6;
      
      const address = order.shippingAddress || {};
      
      // Bill To Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      
      // Customer Name
      doc.setTextColor(...COLORS.textGray);
      doc.text('Name:', leftColX, currentY);
      doc.setTextColor(...COLORS.textDark);
      doc.setFont('helvetica', 'bold');
      doc.text(String(address.name || 'N/A'), leftColX + 18, currentY);
      
      // Phone
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textGray);
      doc.text('Phone:', leftColX, currentY + 5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(address.phone || 'N/A'), leftColX + 18, currentY + 5);
      
      // Email (if available from user)
      const userEmail = order.user?.email || '';
      if (userEmail) {
        doc.setTextColor(...COLORS.textGray);
        doc.text('Email:', leftColX, currentY + 10);
        doc.setTextColor(...COLORS.textDark);
        doc.text(userEmail, leftColX + 18, currentY + 10);
      }
      
      // Shipping Address Details (Right column)
      doc.setTextColor(...COLORS.textGray);
      doc.text('Street:', rightColX, currentY);
      doc.setTextColor(...COLORS.textDark);
      const streetText = doc.splitTextToSize(String(address.street || 'N/A'), colWidth - 18);
      doc.text(streetText, rightColX + 18, currentY);
      
      doc.setTextColor(...COLORS.textGray);
      doc.text('City:', rightColX, currentY + 5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(`${address.city || ''}, ${address.state || ''}`, rightColX + 18, currentY + 5);
      
      doc.setTextColor(...COLORS.textGray);
      doc.text('Pincode:', rightColX, currentY + 10);
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(address.pincode || 'N/A'), rightColX + 18, currentY + 10);
      
      currentY += 22;
      
      // Divider line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(leftX, currentY, rightX, currentY);
      
      currentY += LAYOUT.sectionGap;

      // ==============================================
      // ITEMS TABLE (ACCOUNTING-GRADE)
      // ==============================================
      
      // Table column configuration
      const tableColumns = {
        description: { width: 85, align: 'left' },
        qty: { width: 25, align: 'center' },
        unitPrice: { width: 30, align: 'right' },
        total: { width: 30, align: 'right' },
      };
      
      const tableHeaders = [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']];
      const tableData = (order.items || []).map((item) => [
        String(item.productName || item.product?.productName || 'Product'),
        String(item.quantity || 0) + ' ' + (item.unit || 'unit'),
        formatCurrency(item.price || 0),
        formatCurrency(item.subtotal || 0),
      ]);
      
      // Professional table using autoTable
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: FONTS.body.size,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineColor: COLORS.border,
          lineWidth: 0.3,
          textColor: COLORS.textDark,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: COLORS.tableHeader,
          textColor: COLORS.textDark,
          fontStyle: 'bold',
          fontSize: FONTS.small.size,
          halign: 'left',
        },
        bodyStyles: {
          fillColor: COLORS.white,
        },
        alternateRowStyles: {
          fillColor: [250, 251, 252], // Very subtle alternating
        },
        columnStyles: {
          0: { cellWidth: tableColumns.description.width, halign: 'left' },
          1: { cellWidth: tableColumns.qty.width, halign: 'center' },
          2: { cellWidth: tableColumns.unitPrice.width, halign: 'right', font: 'helvetica' },
          3: { cellWidth: tableColumns.total.width, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: leftX, right: LAYOUT.margin },
        tableLineColor: COLORS.border,
        tableLineWidth: 0.3,
        didDrawPage: function(data) {
          // Draw outer border
          doc.setDrawColor(...COLORS.border);
          doc.setLineWidth(0.5);
        },
      });
      
      // Get table end position
      const tableEndY = doc.lastAutoTable?.finalY || currentY + 40;
      currentY = tableEndY + LAYOUT.sectionGap;

      // ==============================================
      // TOTALS SECTION (RIGHT ALIGNED)
      // ==============================================
      
      const totalsWidth = 75;
      const totalsX = rightX - totalsWidth;
      const labelX = totalsX + 4;
      const valueX = rightX - 4;
      
      // Calculate totals
      const subtotal = order.totalAmount || 0;
      const discount = order.discount || 0;
      const subtotalLessDiscount = subtotal - discount;
      const taxRate = order.taxRate || 0;
      const taxAmount = order.taxAmount || 0;
      const totalDue = order.finalTotal || subtotalLessDiscount + taxAmount;
      
      // Totals box background
      doc.setDrawColor(...COLORS.border);
      doc.setFillColor(...COLORS.white);
      doc.roundedRect(totalsX, currentY, totalsWidth, 48, 2, 2, 'FD');
      
      let totalsY = currentY + 6;
      
      // Subtotal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Subtotal', labelX, totalsY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(formatCurrency(subtotal), valueX, totalsY, { align: 'right' });
      
      totalsY += 6;
      
      // Discount (if any)
      if (discount > 0) {
        doc.setTextColor(...COLORS.textGray);
        doc.text('Discount', labelX, totalsY);
        doc.setTextColor([239, 68, 68]); // Red for discount
        doc.text(`-${formatCurrency(discount)}`, valueX, totalsY, { align: 'right' });
        totalsY += 6;
        
        // Subtotal Less Discount
        doc.setTextColor(...COLORS.textGray);
        doc.text('Subtotal Less Discount', labelX, totalsY);
        doc.setTextColor(...COLORS.textDark);
        doc.text(formatCurrency(subtotalLessDiscount), valueX, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      // Tax (if any)
      if (taxRate > 0 || taxAmount > 0) {
        doc.setTextColor(...COLORS.textGray);
        doc.text(`Tax (${taxRate}%)`, labelX, totalsY);
        doc.setTextColor(...COLORS.textDark);
        doc.text(formatCurrency(taxAmount), valueX, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      // Separator line before total
      totalsY += 2;
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(totalsX + 2, totalsY, rightX - 2, totalsY);
      totalsY += 6;
      
      // Total Due (highlighted)
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(totalsX + 2, totalsY - 4, totalsWidth - 4, 10, 1, 1, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.textDark);
      doc.text('TOTAL DUE', labelX + 2, totalsY + 2);
      doc.text(formatCurrency(totalDue), valueX - 2, totalsY + 2, { align: 'right' });
      
      currentY = totalsY + 16;

      // ==============================================
      // PAYMENT INFORMATION
      // ==============================================
      
      currentY += 8;
      
      // Payment method and status box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.sectionHeading.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text('PAYMENT INFORMATION', leftX, currentY);
      
      currentY += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      
      // Payment Method
      doc.setTextColor(...COLORS.textGray);
      doc.text('Payment Method:', leftX, currentY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(formatPaymentMethod(order.paymentMethod), leftX + 38, currentY);
      
      // Payment Status
      doc.setTextColor(...COLORS.textGray);
      doc.text('Payment Status:', leftX + 85, currentY);
      const paymentStatusColor = order.paymentStatus === 'paid' ? [34, 197, 94] : COLORS.textDark;
      doc.setTextColor(...paymentStatusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(capitalizeFirst(order.paymentStatus || 'pending'), leftX + 120, currentY);
      
      // Order Status
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textGray);
      doc.text('Order Status:', leftX, currentY + 5);
      const statusColor = getStatusColor(order.orderStatus);
      doc.setTextColor(...statusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(capitalizeFirst(order.orderStatus || 'pending'), leftX + 38, currentY + 5);
      
      currentY += 16;

      // ==============================================
      // NOTES SECTION (if any)
      // ==============================================
      
      if (order.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONTS.small.size);
        doc.setTextColor(...COLORS.textGray);
        doc.text('Notes:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textDark);
        const noteLines = doc.splitTextToSize(order.notes, contentWidth - 20);
        doc.text(noteLines, leftX + 15, currentY);
        currentY += (noteLines.length * 4) + 8;
      }
      
      // Admin notes (only for admin view)
      if (isAdmin && order.adminNotes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONTS.small.size);
        doc.setTextColor(...COLORS.primaryAccent);
        doc.text('Admin Notes:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textDark);
        const adminNoteLines = doc.splitTextToSize(order.adminNotes, contentWidth - 25);
        doc.text(adminNoteLines, leftX + 25, currentY);
        currentY += (adminNoteLines.length * 4) + 8;
      }

      // ==============================================
      // FOOTER SECTION
      // ==============================================
      
      const footerY = pageHeight - 28;
      
      // Footer divider
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(leftX, footerY, rightX, footerY);
      
      // Thank you message
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Thank you for your business!', pageWidth / 2, footerY + 6, { align: 'center' });
      
      // Contact info
      doc.setFontSize(FONTS.tiny.size);
      doc.text(`For queries: ${BUSINESS_CONFIG.contact.email} | WhatsApp: ${BUSINESS_CONFIG.contact.whatsappDisplay}`, pageWidth / 2, footerY + 11, { align: 'center' });
      
      // UPI Payment info
      doc.text(`UPI: ${BUSINESS_CONFIG.payment.upiId}`, pageWidth / 2, footerY + 16, { align: 'center' });
      
      // Generated timestamp (bottom right)
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textGray);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, rightX, footerY + 21, { align: 'right' });
      
      // ==============================================
      // DOWNLOAD PDF
      // ==============================================
      
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
 * Format currency with proper alignment (INR)
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format date for display (short format)
 */
const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format date for display (full format)
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
    credit: 'Credit',
    upi: 'UPI Payment',
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
  return colors[status] || [100, 116, 139];
};

export default generateReceipt;
