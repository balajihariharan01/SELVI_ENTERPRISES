import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BUSINESS_CONFIG } from '../config/businessConfig';

/**
 * ============================================
 * PROFESSIONAL RECEIPT GENERATOR
 * ============================================
 * Clean, minimal design matching reference image
 * Optimized for: Screen, PDF Download, A4 Print
 */

// ==============================================
// COLOR PALETTE (Professional & Minimal)
// ==============================================
const COLORS = {
  // Text Colors
  navy: [20, 33, 61],           // #14213d - Primary headings
  darkGray: [51, 51, 51],       // #333333 - Body text
  mediumGray: [102, 102, 102],  // #666666 - Secondary text
  lightGray: [153, 153, 153],   // #999999 - Labels
  
  // Accent Colors
  accent: [200, 50, 50],        // #c83232 - Red accent line
  accentLight: [220, 80, 80],   // Lighter red
  
  // Backgrounds
  white: [255, 255, 255],
  offWhite: [250, 250, 250],
  
  // Lines
  lineGray: [200, 200, 200],    // #c8c8c8 - Table lines
  lineDark: [51, 51, 51],       // Dark separator
};

// ==============================================
// LAYOUT CONSTANTS (A4 Portrait)
// ==============================================
const LAYOUT = {
  // Page dimensions (A4)
  pageWidth: 210,
  pageHeight: 297,
  
  // Margins
  marginLeft: 20,
  marginRight: 20,
  marginTop: 20,
  marginBottom: 20,
  
  // Calculated
  get contentWidth() { return this.pageWidth - this.marginLeft - this.marginRight; },
  get rightEdge() { return this.pageWidth - this.marginRight; },
  
  // Spacing
  lineHeight: 5,
  sectionGap: 12,
  smallGap: 4,
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

      let currentY = LAYOUT.marginTop;

      // ==============================================
      // HEADER SECTION
      // ==============================================
      
      // RECEIPT Title (Top Left)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(...COLORS.navy);
      doc.text('RECEIPT', LAYOUT.marginLeft, currentY + 10);
      
      // Company Info (Below Title)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.navy);
      doc.text(BUSINESS_CONFIG.name, LAYOUT.marginLeft, currentY + 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.mediumGray);
      doc.text(BUSINESS_CONFIG.location.street, LAYOUT.marginLeft, currentY + 23);
      doc.text(
        `${BUSINESS_CONFIG.location.city}, ${BUSINESS_CONFIG.location.state} ${BUSINESS_CONFIG.location.pincode}`,
        LAYOUT.marginLeft,
        currentY + 28
      );
      
      // LOGO (Top Right) - Load actual logo from /logo.png
      const logoSize = 25;
      const logoX = LAYOUT.rightEdge - logoSize;
      const logoY = currentY;
      
      // Try to load the actual logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = '/logo.png';
        });
        
        // Add logo image maintaining aspect ratio
        const aspectRatio = logoImg.width / logoImg.height;
        let imgWidth = logoSize;
        let imgHeight = logoSize;
        
        if (aspectRatio > 1) {
          imgHeight = logoSize / aspectRatio;
        } else {
          imgWidth = logoSize * aspectRatio;
        }
        
        const imgX = logoX + (logoSize - imgWidth) / 2;
        const imgY = logoY + (logoSize - imgHeight) / 2;
        
        doc.addImage(logoImg, 'PNG', imgX, imgY, imgWidth, imgHeight);
      } catch (logoError) {
        // Fallback: Draw company initials if logo fails to load
        doc.setDrawColor(...COLORS.mediumGray);
        doc.setLineWidth(0.5);
        doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...COLORS.mediumGray);
        doc.text('SE', logoX + logoSize / 2, logoY + logoSize / 2 + 2, { align: 'center' });
      }
      
      currentY += 40;

      // ==============================================
      // BILL TO | SHIP TO | RECEIPT INFO (3 Columns)
      // ==============================================
      
      const colWidth = LAYOUT.contentWidth / 3;
      const col1X = LAYOUT.marginLeft;
      const col2X = LAYOUT.marginLeft + colWidth;
      const col3X = LAYOUT.marginLeft + colWidth * 2;
      
      const address = order.shippingAddress || {};
      
      // Column 1: BILL TO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.navy);
      doc.text('BILL TO', col1X, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.darkGray);
      
      let billY = currentY + 5;
      doc.text(truncateText(doc, address.name || 'Customer', colWidth - 5), col1X, billY);
      billY += 4;
      if (address.street) {
        const streetLines = doc.splitTextToSize(address.street, colWidth - 5);
        doc.text(streetLines, col1X, billY);
        billY += streetLines.length * 4;
      }
      const billCityState = `${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim();
      if (billCityState.length > 3) {
        doc.text(billCityState, col1X, billY);
      }
      
      // Column 2: SHIP TO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.navy);
      doc.text('SHIP TO', col2X, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.darkGray);
      
      let shipY = currentY + 5;
      doc.text(truncateText(doc, address.name || 'Customer', colWidth - 5), col2X, shipY);
      shipY += 4;
      if (address.street) {
        const streetLines = doc.splitTextToSize(address.street, colWidth - 5);
        doc.text(streetLines, col2X, shipY);
        shipY += streetLines.length * 4;
      }
      const shipCityState = `${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim();
      if (shipCityState.length > 3) {
        doc.text(shipCityState, col2X, shipY);
      }
      
      // Column 3: RECEIPT INFO (Right Aligned Labels, Left Aligned Values)
      const labelX = col3X;
      const valueX = LAYOUT.rightEdge;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.navy);
      
      let infoY = currentY;
      
      // Receipt #
      doc.text('RECEIPT #', labelX, infoY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      doc.text(String(order.orderNumber || 'N/A'), valueX, infoY, { align: 'right' });
      
      infoY += 5;
      
      // Receipt Date
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.navy);
      doc.text('RECEIPT DATE', labelX, infoY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      doc.text(formatDateShort(order.createdAt), valueX, infoY, { align: 'right' });
      
      infoY += 5;
      
      // P.O.# (Order Number)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.navy);
      doc.text('P.O.#', labelX, infoY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      doc.text(String(order.orderNumber || 'N/A'), valueX, infoY, { align: 'right' });
      
      infoY += 5;
      
      // Due Date (Payment Status)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.navy);
      doc.text('DUE DATE', labelX, infoY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      // Due date is 7 days from order date
      const dueDate = new Date(order.createdAt);
      dueDate.setDate(dueDate.getDate() + 7);
      doc.text(formatDateShort(dueDate), valueX, infoY, { align: 'right' });
      
      currentY += 35;

      // ==============================================
      // RED ACCENT LINE (Separator)
      // ==============================================
      
      doc.setDrawColor(...COLORS.accent);
      doc.setLineWidth(1);
      doc.line(LAYOUT.marginLeft, currentY, LAYOUT.rightEdge, currentY);
      
      currentY += 8;

      // ==============================================
      // ITEMS TABLE
      // ==============================================
      
      // Table column configuration matching reference
      const tableHeaders = [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'AMOUNT']];
      const tableData = (order.items || []).map((item) => [
        `${item.quantity || 0}`,
        String(item.productName || item.product?.productName || 'Product'),
        formatCurrency(item.price || 0),
        formatCurrency(item.subtotal || 0),
      ]);
      
      // Professional table
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: currentY,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
          textColor: COLORS.darkGray,
          overflow: 'linebreak',
          valign: 'middle',
          lineColor: COLORS.lineGray,
          lineWidth: 0,
        },
        headStyles: {
          fillColor: COLORS.white,
          textColor: COLORS.navy,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
        },
        bodyStyles: {
          fillColor: COLORS.white,
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },   // QTY
          1: { cellWidth: 85, halign: 'left' },     // DESCRIPTION
          2: { cellWidth: 35, halign: 'right' },    // UNIT PRICE
          3: { cellWidth: 30, halign: 'right' },    // AMOUNT
        },
        margin: { left: LAYOUT.marginLeft, right: LAYOUT.marginRight },
        tableWidth: LAYOUT.contentWidth,
        
        // Custom header line
        didDrawPage: function(data) {
          // Red line under header
          doc.setDrawColor(...COLORS.accent);
          doc.setLineWidth(0.5);
          const headerY = data.table.head[0].cells[0].y + data.table.head[0].cells[0].height;
          doc.line(LAYOUT.marginLeft, headerY, LAYOUT.rightEdge, headerY);
        },
        
        // Add thin gray line under each row
        didDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 3) {
            doc.setDrawColor(...COLORS.lineGray);
            doc.setLineWidth(0.2);
            const rowBottom = data.cell.y + data.cell.height;
            doc.line(LAYOUT.marginLeft, rowBottom, LAYOUT.rightEdge, rowBottom);
          }
        }
      });
      
      // Get table end position
      const tableEndY = doc.lastAutoTable?.finalY || currentY + 40;
      currentY = tableEndY + 10;

      // ==============================================
      // TOTALS SECTION (Right Aligned)
      // ==============================================
      
      const totalsLabelX = LAYOUT.rightEdge - 70;
      const totalsValueX = LAYOUT.rightEdge;
      
      // Calculate totals
      const subtotal = order.totalAmount || 0;
      const discount = order.discount || 0;
      const taxRate = order.taxRate || 0;
      const taxAmount = order.taxAmount || (subtotal * taxRate / 100);
      const totalDue = order.finalTotal || (subtotal - discount + taxAmount);
      
      let totalsY = currentY;
      
      // Subtotal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.mediumGray);
      doc.text('Subtotal', totalsLabelX, totalsY, { align: 'right' });
      doc.setTextColor(...COLORS.darkGray);
      doc.text(formatCurrency(subtotal), totalsValueX, totalsY, { align: 'right' });
      
      totalsY += 6;
      
      // Discount (if any)
      if (discount > 0) {
        doc.setTextColor(...COLORS.mediumGray);
        doc.text('Discount', totalsLabelX, totalsY, { align: 'right' });
        doc.setTextColor(...COLORS.accent);
        doc.text(`-${formatCurrency(discount)}`, totalsValueX, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      // Tax
      if (taxRate > 0 || taxAmount > 0) {
        doc.setTextColor(...COLORS.mediumGray);
        doc.text(`Sales Tax ${taxRate > 0 ? taxRate + '%' : ''}`, totalsLabelX, totalsY, { align: 'right' });
        doc.setTextColor(...COLORS.darkGray);
        doc.text(formatCurrency(taxAmount), totalsValueX, totalsY, { align: 'right' });
        totalsY += 6;
      }
      
      totalsY += 4;
      
      // TOTAL (Bold, Larger)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.navy);
      doc.text('TOTAL', totalsLabelX, totalsY, { align: 'right' });
      doc.setFontSize(14);
      doc.text(formatCurrency(totalDue), totalsValueX, totalsY, { align: 'right' });
      
      currentY = totalsY + 20;

      // ==============================================
      // SIGNATURE SECTION (Right Side)
      // ==============================================
      
      const signatureX = LAYOUT.rightEdge - 60;
      
      // Signature line (handwritten style placeholder)
      doc.setFont('times', 'italic');
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.navy);
      doc.text(getSignatureText(), signatureX + 30, currentY, { align: 'center' });
      
      currentY += 5;
      
      // Line under signature
      doc.setDrawColor(...COLORS.lineGray);
      doc.setLineWidth(0.3);
      doc.line(signatureX, currentY, signatureX + 60, currentY);
      
      currentY += 5;
      
      // Printed name under signature
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.mediumGray);
      doc.text('Authorized Signature', signatureX + 30, currentY, { align: 'center' });

      // ==============================================
      // FOOTER SECTION
      // ==============================================
      
      const footerY = LAYOUT.pageHeight - 50;
      
      // Thank You (Left Side - Stylish)
      doc.setFont('times', 'italic');
      doc.setFontSize(28);
      doc.setTextColor(...COLORS.accent);
      doc.text('Thank you', LAYOUT.marginLeft, footerY + 15);
      
      // Terms & Conditions Box (Right Side)
      const termsX = LAYOUT.rightEdge - 80;
      const termsWidth = 80;
      
      // Terms header with red background
      doc.setFillColor(...COLORS.accent);
      doc.rect(termsX, footerY, termsWidth, 6, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.text('TERMS & CONDITIONS', termsX + termsWidth / 2, footerY + 4, { align: 'center' });
      
      // Terms content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.mediumGray);
      
      const termsY = footerY + 12;
      const termsLines = [
        'Payment is due within 15 days',
        '',
        `Please make checks payable to: ${BUSINESS_CONFIG.name}`,
      ];
      
      termsLines.forEach((line, index) => {
        if (line) {
          doc.text(line, termsX, termsY + (index * 4));
        }
      });
      
      // ==============================================
      // PAYMENT INFO (Small, Bottom)
      // ==============================================
      
      const paymentY = LAYOUT.pageHeight - 15;
      
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.lightGray);
      doc.text(
        `Payment: ${formatPaymentMethod(order.paymentMethod)} | Status: ${capitalizeFirst(order.paymentStatus || 'pending')}`,
        LAYOUT.marginLeft,
        paymentY
      );
      
      // Generated timestamp
      doc.text(
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        LAYOUT.rightEdge,
        paymentY,
        { align: 'right' }
      );

      // ==============================================
      // DOWNLOAD PDF
      // ==============================================
      
      const filename = `Receipt_${order.orderNumber}.pdf`;
      
      // Try blob download first
      try {
        const pdfBlob = doc.output('blob');
        downloadBlob(pdfBlob, filename);
        resolve(filename);
        return;
      } catch (blobError) {
        console.warn('Blob download failed, trying alternative');
      }
      
      // Fallback to data URI
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
        console.warn('Data URI download failed');
      }
      
      // Last resort
      doc.save(filename);
      resolve(filename);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(new Error(`Failed to generate receipt: ${error.message}`));
    }
  });
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Download blob as file
 */
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Format currency (INR)
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

/**
 * Format date (DD/MM/YYYY)
 */
const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format payment method
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
 * Truncate text to fit width
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

/**
 * Generate handwritten-style signature text
 */
const getSignatureText = () => {
  // Simple cursive-like signature
  return 'Selvi Enterprise';
};

export default generateReceipt;
