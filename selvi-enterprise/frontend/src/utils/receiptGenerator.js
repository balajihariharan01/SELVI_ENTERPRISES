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
 * - Spacing: Consistent 5mm grid system
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
  title: { size: 22, style: 'bold' },
  companyName: { size: 13, style: 'bold' },
  sectionHeading: { size: 11, style: 'bold' },
  label: { size: 9, style: 'normal' },
  value: { size: 9, style: 'bold' },
  body: { size: 9, style: 'normal' },
  small: { size: 8, style: 'normal' },
  tiny: { size: 7, style: 'normal' },
};

// ==============================================
// LAYOUT CONSTANTS (A4 Portrait - Mobile Optimized)
// ==============================================
const LAYOUT = {
  margin: 15,           // Smaller margins for better mobile viewing
  pageWidth: 210,       // A4 width in mm
  pageHeight: 297,      // A4 height in mm
  contentWidth: 180,    // 210 - (15 * 2)
  columnGap: 12,        // Gap between columns
  rowGap: 4.5,          // Gap between rows
  sectionGap: 10,       // Gap between sections
  lineHeight: 4.5,      // Consistent line height
  labelWidth: 20,       // Fixed width for labels
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
      doc.text('RECEIPT', leftX, currentY + 7);
      
      // Company Name
      doc.setFont('helvetica', FONTS.companyName.style);
      doc.setFontSize(FONTS.companyName.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text(BUSINESS_CONFIG.name, leftX, currentY + 15);
      
      // Company Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      
      const companyLines = [
        BUSINESS_CONFIG.location.street,
        `${BUSINESS_CONFIG.location.city}, ${BUSINESS_CONFIG.location.state} - ${BUSINESS_CONFIG.location.pincode}`,
        `Phone: ${BUSINESS_CONFIG.contact.phones.join(' / ')}`,
        `Email: ${BUSINESS_CONFIG.contact.email}`,
      ];
      
      let companyY = currentY + 21;
      companyLines.forEach((line, index) => {
        doc.text(line, leftX, companyY + (index * 4));
      });
      
      // RIGHT SIDE: Logo placeholder, Date, Receipt No
      const logoSize = 22;
      const logoX = rightX - logoSize;
      const logoY = currentY;
      
      // Circular logo placeholder
      doc.setDrawColor(...COLORS.border);
      doc.setFillColor(...COLORS.tableHeader);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'FD');
      
      // Logo text fallback
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.primaryAccent);
      doc.text('SE', logoX + logoSize/2, logoY + logoSize/2 + 2, { align: 'center' });
      
      // Date and Receipt info (right aligned below logo)
      const metaX = rightX;
      const metaY = logoY + logoSize + 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Date:', metaX - 40, metaY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text(formatDateShort(order.createdAt), metaX, metaY, { align: 'right' });
      
      // Receipt Number
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textGray);
      doc.text('Receipt No:', metaX - 40, metaY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(order.orderNumber || 'N/A'), metaX, metaY + 5, { align: 'right' });
      
      currentY += 50;
      
      // Divider line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(leftX, currentY, rightX, currentY);
      
      currentY += LAYOUT.sectionGap;

      // ==============================================
      // BILLING & SHIPPING INFORMATION SECTION
      // ==============================================
      
      const colWidth = (contentWidth - LAYOUT.columnGap) / 2;
      const leftColX = leftX;
      const rightColX = leftX + colWidth + LAYOUT.columnGap;
      const labelWidth = LAYOUT.labelWidth;
      
      // Section Headers
      doc.setFont('helvetica', FONTS.sectionHeading.style);
      doc.setFontSize(FONTS.sectionHeading.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text('BILL TO', leftColX, currentY);
      doc.text('SHIPPING ADDRESS', rightColX, currentY);
      
      currentY += 6;
      
      const address = order.shippingAddress || {};
      const valueStartX = leftColX + labelWidth;
      const rightValueStartX = rightColX + labelWidth;
      const maxValueWidth = colWidth - labelWidth - 3;
      
      // BILL TO section (Left Column)
      let leftY = currentY;
      
      // Name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Name:', leftColX, leftY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.textDark);
      doc.text(truncateText(doc, String(address.name || 'N/A'), maxValueWidth), valueStartX, leftY);
      
      leftY += LAYOUT.lineHeight;
      
      // Phone
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textGray);
      doc.text('Phone:', leftColX, leftY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(address.phone || 'N/A'), valueStartX, leftY);
      
      leftY += LAYOUT.lineHeight;
      
      // Email
      const userEmail = order.user?.email || '';
      if (userEmail) {
        doc.setTextColor(...COLORS.textGray);
        doc.text('Email:', leftColX, leftY);
        doc.setTextColor(...COLORS.textDark);
        doc.text(truncateText(doc, userEmail, maxValueWidth), valueStartX, leftY);
        leftY += LAYOUT.lineHeight;
      }
      
      // SHIPPING ADDRESS section (Right Column)
      let rightY = currentY;
      
      // Street - handle multi-line with proper wrapping
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Street:', rightColX, rightY);
      doc.setTextColor(...COLORS.textDark);
      const streetText = String(address.street || 'N/A');
      const streetLines = doc.splitTextToSize(streetText, maxValueWidth);
      doc.text(streetLines, rightValueStartX, rightY);
      rightY += (streetLines.length * LAYOUT.lineHeight);
      
      // City & State
      doc.setTextColor(...COLORS.textGray);
      doc.text('City:', rightColX, rightY);
      doc.setTextColor(...COLORS.textDark);
      const cityText = address.city || '';
      const stateText = address.state || '';
      const cityStateText = cityText && stateText ? `${cityText}, ${stateText}` : (cityText || stateText || 'N/A');
      doc.text(truncateText(doc, cityStateText, maxValueWidth), rightValueStartX, rightY);
      
      rightY += LAYOUT.lineHeight;
      
      // Pincode
      doc.setTextColor(...COLORS.textGray);
      doc.text('Pincode:', rightColX, rightY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(address.pincode || 'N/A'), rightValueStartX, rightY);
      
      currentY = Math.max(leftY, rightY) + LAYOUT.sectionGap;
      
      // Divider line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(leftX, currentY, rightX, currentY);
      
      currentY += LAYOUT.sectionGap;

      // ==============================================
      // ITEMS TABLE (ACCOUNTING-GRADE)
      // ==============================================
      
      // Optimized table column widths for perfect alignment
      const tableHeaders = [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']];
      const tableData = (order.items || []).map((item) => [
        String(item.productName || item.product?.productName || 'Product'),
        `${item.quantity || 0} ${item.unit || 'unit'}`,
        formatCurrency(item.price || 0),
        formatCurrency(item.subtotal || 0),
      ]);
      
      // Professional table using autoTable with optimized widths
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
          lineColor: COLORS.border,
          lineWidth: 0.3,
          textColor: COLORS.textDark,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: COLORS.tableHeader,
          textColor: COLORS.textDark,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
          cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
        },
        bodyStyles: {
          fillColor: COLORS.white,
        },
        alternateRowStyles: {
          fillColor: [250, 251, 252],
        },
        columnStyles: {
          0: { cellWidth: 90, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 32, halign: 'right' },
          3: { cellWidth: 33, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: leftX, right: LAYOUT.margin },
        tableWidth: contentWidth,
        tableLineColor: COLORS.border,
        tableLineWidth: 0.3,
      });
      
      // Get table end position
      const tableEndY = doc.lastAutoTable?.finalY || currentY + 40;
      currentY = tableEndY + LAYOUT.sectionGap;

      // ==============================================
      // TOTALS SECTION (RIGHT ALIGNED BOX)
      // ==============================================
      
      const totalsWidth = 80;
      const totalsX = rightX - totalsWidth;
      const labelPadding = 6;
      const valuePadding = 6;
      
      // Calculate totals
      const subtotal = order.totalAmount || 0;
      const discount = order.discount || 0;
      const subtotalLessDiscount = subtotal - discount;
      const taxRate = order.taxRate || 0;
      const taxAmount = order.taxAmount || 0;
      const totalDue = order.finalTotal || subtotalLessDiscount + taxAmount;
      
      // Calculate box height based on content
      let boxHeight = 28; // Base height for subtotal + total
      if (discount > 0) boxHeight += 12;
      if (taxRate > 0 || taxAmount > 0) boxHeight += 6;
      
      // Totals box background
      doc.setDrawColor(...COLORS.border);
      doc.setFillColor(...COLORS.white);
      doc.roundedRect(totalsX, currentY, totalsWidth, boxHeight, 2, 2, 'FD');
      
      let totalsY = currentY + 7;
      
      // Subtotal row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Subtotal', totalsX + labelPadding, totalsY);
      doc.setTextColor(...COLORS.textDark);
      doc.text(formatCurrency(subtotal), totalsX + totalsWidth - valuePadding, totalsY, { align: 'right' });
      
      totalsY += 6;
      
      // Discount (if any)
      if (discount > 0) {
        doc.setTextColor(...COLORS.textGray);
        doc.text('Discount', totalsX + labelPadding, totalsY);
        doc.setTextColor([239, 68, 68]); // Red for discount
        doc.text(`-${formatCurrency(discount)}`, totalsX + totalsWidth - valuePadding, totalsY, { align: 'right' });
        totalsY += 6;
        
        // Subtotal Less Discount
        doc.setTextColor(...COLORS.textGray);
        doc.text('After Discount', totalsX + labelPadding, totalsY);
        doc.setTextColor(...COLORS.textDark);
        doc.text(formatCurrency(subtotalLessDiscount), totalsX + totalsWidth - valuePadding, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      // Tax (if any)
      if (taxRate > 0 || taxAmount > 0) {
        doc.setTextColor(...COLORS.textGray);
        doc.text(`Tax (${taxRate}%)`, totalsX + labelPadding, totalsY);
        doc.setTextColor(...COLORS.textDark);
        doc.text(formatCurrency(taxAmount), totalsX + totalsWidth - valuePadding, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      // Separator line before total
      totalsY += 1;
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.4);
      doc.line(totalsX + 3, totalsY, totalsX + totalsWidth - 3, totalsY);
      totalsY += 5;
      
      // Total Due (highlighted)
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(totalsX + 3, totalsY - 4, totalsWidth - 6, 11, 1, 1, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.textDark);
      doc.text('TOTAL DUE', totalsX + labelPadding + 2, totalsY + 2);
      doc.setFontSize(11);
      doc.text(formatCurrency(totalDue), totalsX + totalsWidth - valuePadding - 2, totalsY + 2, { align: 'right' });
      
      currentY = currentY + boxHeight + 12;

      // ==============================================
      // PAYMENT INFORMATION (Clean Grid Layout)
      // ==============================================
      
      // Section Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.sectionHeading.size);
      doc.setTextColor(...COLORS.textDark);
      doc.text('PAYMENT INFORMATION', leftX, currentY);
      
      currentY += 7;
      
      const paymentLabelWidth = 32;
      const paymentCol1X = leftX;
      const paymentCol2X = leftX + 80;
      
      // Row 1: Payment Method and Payment Status
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.body.size);
      
      // Payment Method
      doc.setTextColor(...COLORS.textGray);
      doc.text('Payment Method:', paymentCol1X, currentY);
      doc.setTextColor(...COLORS.primaryAccent);
      doc.text(formatPaymentMethod(order.paymentMethod), paymentCol1X + paymentLabelWidth + 8, currentY);
      
      // Payment Status
      doc.setTextColor(...COLORS.textGray);
      doc.text('Payment Status:', paymentCol2X, currentY);
      const paymentStatusColor = order.paymentStatus === 'paid' ? [34, 197, 94] : [234, 179, 8];
      doc.setTextColor(...paymentStatusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(capitalizeFirst(order.paymentStatus || 'pending'), paymentCol2X + paymentLabelWidth + 6, currentY);
      
      currentY += LAYOUT.lineHeight;
      
      // Row 2: Order Status
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textGray);
      doc.text('Order Status:', paymentCol1X, currentY);
      const statusColor = getStatusColor(order.orderStatus);
      doc.setTextColor(...statusColor);
      doc.setFont('helvetica', 'bold');
      doc.text(capitalizeFirst(order.orderStatus || 'pending'), paymentCol1X + paymentLabelWidth + 8, currentY);
      
      currentY += LAYOUT.sectionGap;

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
        const noteLines = doc.splitTextToSize(order.notes, contentWidth - 18);
        doc.text(noteLines, leftX + 18, currentY);
        currentY += (noteLines.length * 4) + 6;
      }
      
      // Admin notes (only for admin view)
      if (isAdmin && order.adminNotes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONTS.small.size);
        doc.setTextColor(...COLORS.primaryAccent);
        doc.text('Admin Notes:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textDark);
        const adminNoteLines = doc.splitTextToSize(order.adminNotes, contentWidth - 28);
        doc.text(adminNoteLines, leftX + 28, currentY);
        currentY += (adminNoteLines.length * 4) + 6;
      }

      // ==============================================
      // FOOTER SECTION
      // ==============================================
      
      const footerY = pageHeight - 25;
      
      // Footer divider
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(leftX, footerY, rightX, footerY);
      
      // Thank you message
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.small.size);
      doc.setTextColor(...COLORS.textGray);
      doc.text('Thank you for your business!', pageWidth / 2, footerY + 5, { align: 'center' });
      
      // Contact info
      doc.setFontSize(FONTS.tiny.size);
      doc.text(`For queries: ${BUSINESS_CONFIG.contact.email} | WhatsApp: ${BUSINESS_CONFIG.contact.whatsappDisplay}`, pageWidth / 2, footerY + 10, { align: 'center' });
      
      // UPI Payment info
      doc.text(`UPI: ${BUSINESS_CONFIG.payment.upiId}`, pageWidth / 2, footerY + 15, { align: 'center' });
      
      // Generated timestamp (bottom right)
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.textGray);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, rightX, footerY + 20, { align: 'right' });
      
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

/**
 * Truncate text to fit within a given width
 */
const truncateText = (doc, text, maxWidth) => {
  if (!text) return 'N/A';
  const textWidth = doc.getTextWidth(text);
  if (textWidth <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
};

export default generateReceipt;
