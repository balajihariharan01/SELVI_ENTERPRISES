import React, { useState, useRef, useCallback } from 'react';
import {
  FaFileInvoiceDollar,
  FaDownload,
  FaWhatsapp,
  FaPrint,
  FaQrcode,
  FaShareAlt,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCalendarAlt,
  FaReceipt,
  FaCopy,
  FaExternalLinkAlt
} from 'react-icons/fa';
import './InvoiceGenerator.css';

// Business details from config
const BUSINESS_INFO = {
  name: 'Selvi Enterprises',
  tagline: 'Quality Construction Materials',
  address: '123 Industrial Area, Chennai, Tamil Nadu - 600001',
  phone: '+91 98765 43210',
  email: 'contact@selvienterprises.com',
  gstin: '33XXXXX1234X1Z5',
  website: 'www.selvienterprises.com'
};

const GST_RATE = 0.18;

const InvoiceGenerator = ({
  order,
  onClose,
  whatsappNumber = '+919876543210'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const invoiceRef = useRef(null);

  // Generate unique invoice number
  const invoiceNumber = `INV-${order?._id?.slice(-8).toUpperCase() || 'XXXXXX'}`;
  const invoiceDate = new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate totals
  const calculateTotals = useCallback(() => {
    if (!order?.items) return { subtotal: 0, gst: 0, delivery: 0, discount: 0, total: 0 };

    const subtotal = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const gst = subtotal * GST_RATE;
    const delivery = order.deliveryCharge || 0;
    const discount = order.discount || 0;
    const total = subtotal + gst + delivery - discount;

    return { subtotal, gst, delivery, discount, total };
  }, [order]);

  const totals = calculateTotals();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Generate PDF
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Using browser print functionality for PDF
      const printWindow = window.open('', '_blank');
      const invoiceHTML = generateInvoiceHTML();
      
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        setIsGenerating(false);
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  // Generate Invoice HTML for print
  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            padding: 40px; 
            color: #333333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #285570;
            margin-bottom: 30px;
          }
          .company-info h1 { 
            color: #285570; 
            font-size: 28px; 
            margin-bottom: 5px; 
          }
          .company-info p { 
            color: #666; 
            font-size: 12px; 
            line-height: 1.6; 
          }
          .invoice-meta { 
            text-align: right; 
          }
          .invoice-meta h2 { 
            color: #285570; 
            font-size: 24px; 
            margin-bottom: 10px; 
          }
          .invoice-meta p { 
            font-size: 12px; 
            color: #666; 
          }
          .addresses { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
            gap: 40px;
          }
          .address-box { 
            flex: 1; 
          }
          .address-box h3 { 
            color: #285570; 
            font-size: 14px; 
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e3ded7;
          }
          .address-box p { 
            font-size: 12px; 
            line-height: 1.6; 
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          th { 
            background: #285570; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-size: 12px;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #e3ded7; 
            font-size: 12px;
          }
          tr:nth-child(even) { 
            background: #faf7f6; 
          }
          .totals { 
            width: 300px; 
            margin-left: auto;
          }
          .totals table td { 
            padding: 8px 12px;
          }
          .totals .total-row { 
            background: #285570; 
            color: white; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e3ded7; 
            text-align: center;
          }
          .footer p { 
            font-size: 11px; 
            color: #666; 
            margin-bottom: 5px;
          }
          .qr-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
            padding: 15px;
            background: #faf7f6;
            border-radius: 8px;
          }
          .qr-placeholder {
            width: 80px;
            height: 80px;
            background: #285570;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            border-radius: 4px;
          }
          .qr-text {
            font-size: 11px;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <img src="/logo.png" alt="Selvi Enterprise Logo" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.style.display='none'" />
              <h1 style="margin: 0;">${BUSINESS_INFO.name}</h1>
            </div>
            <p>${BUSINESS_INFO.tagline}</p>
            <p>${BUSINESS_INFO.address}</p>
            <p>Phone: ${BUSINESS_INFO.phone} | Email: ${BUSINESS_INFO.email}</p>
            <p>GSTIN: ${BUSINESS_INFO.gstin}</p>
          </div>
          <div class="invoice-meta">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Order ID:</strong> ${order?._id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        
        <div class="addresses">
          <div class="address-box">
            <h3>Bill To</h3>
            <p><strong>${order?.user?.name || 'Customer'}</strong></p>
            <p>${order?.deliveryAddress?.address || ''}</p>
            <p>${order?.deliveryAddress?.city || ''}, ${order?.deliveryAddress?.state || ''}</p>
            <p>PIN: ${order?.deliveryAddress?.pincode || ''}</p>
            <p>Phone: ${order?.deliveryAddress?.phone || order?.user?.phone || ''}</p>
          </div>
          <div class="address-box">
            <h3>Ship To</h3>
            <p><strong>${order?.user?.name || 'Customer'}</strong></p>
            <p>${order?.deliveryAddress?.address || ''}</p>
            <p>${order?.deliveryAddress?.city || ''}, ${order?.deliveryAddress?.state || ''}</p>
            <p>PIN: ${order?.deliveryAddress?.pincode || ''}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order?.items?.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name || 'Product'}</td>
                <td>6810</td>
                <td>${item.quantity} ${item.unit || 'pcs'}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right">${formatCurrency(totals.subtotal)}</td>
            </tr>
            <tr>
              <td>CGST (9%)</td>
              <td style="text-align: right">${formatCurrency(totals.gst / 2)}</td>
            </tr>
            <tr>
              <td>SGST (9%)</td>
              <td style="text-align: right">${formatCurrency(totals.gst / 2)}</td>
            </tr>
            ${totals.delivery > 0 ? `
              <tr>
                <td>Delivery</td>
                <td style="text-align: right">${formatCurrency(totals.delivery)}</td>
              </tr>
            ` : ''}
            ${totals.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td style="text-align: right">-${formatCurrency(totals.discount)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>Total</td>
              <td style="text-align: right">${formatCurrency(totals.total)}</td>
            </tr>
          </table>
        </div>
        
        <div class="qr-section">
          <div class="qr-placeholder">QR CODE</div>
          <div class="qr-text">
            <p><strong>Scan to verify invoice</strong></p>
            <p>Invoice ID: ${invoiceNumber}</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>Terms: Payment due within 30 days. Please include invoice number with payment.</p>
          <p>For queries: ${BUSINESS_INFO.phone} | ${BUSINESS_INFO.email}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Handle print
  const handlePrint = () => {
    handleDownloadPDF();
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `*${BUSINESS_INFO.name}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📄 *INVOICE*\n\n` +
      `Invoice No: ${invoiceNumber}\n` +
      `Date: ${invoiceDate}\n` +
      `Order ID: ${order?._id?.slice(-8).toUpperCase()}\n\n` +
      `*Customer:* ${order?.user?.name || 'Customer'}\n\n` +
      `*Items:*\n` +
      `${order?.items?.map((item, i) => `${i + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`).join('\n')}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Subtotal: ${formatCurrency(totals.subtotal)}\n` +
      `GST (18%): ${formatCurrency(totals.gst)}\n` +
      `${totals.delivery > 0 ? `Delivery: ${formatCurrency(totals.delivery)}\n` : ''}` +
      `*TOTAL: ${formatCurrency(totals.total)}*\n\n` +
      `Thank you for your business! 🙏\n` +
      `${BUSINESS_INFO.phone}`
    );

    const whatsappURL = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappURL, '_blank');
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  // Copy invoice link
  const handleCopyLink = () => {
    const link = `${window.location.origin}/invoice/${order?._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR data
  const qrData = JSON.stringify({
    invoiceNo: invoiceNumber,
    orderId: order?._id,
    amount: totals.total,
    date: invoiceDate,
    business: BUSINESS_INFO.name
  });

  if (!order) return null;

  return (
    <div className="invoice-overlay" onClick={onClose}>
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-info">
            <FaFileInvoiceDollar className="header-icon" />
            <div>
              <h2>Invoice / Receipt</h2>
              <span>{invoiceNumber}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="invoice-preview" ref={invoiceRef}>
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="business-info">
              <h1>{BUSINESS_INFO.name}</h1>
              <p className="tagline">{BUSINESS_INFO.tagline}</p>
              <div className="contact-info">
                <span><FaMapMarkerAlt /> {BUSINESS_INFO.address}</span>
                <span><FaPhone /> {BUSINESS_INFO.phone}</span>
                <span><FaEnvelope /> {BUSINESS_INFO.email}</span>
              </div>
              <p className="gstin">GSTIN: {BUSINESS_INFO.gstin}</p>
            </div>
            <div className="invoice-meta">
              <div className="invoice-badge">TAX INVOICE</div>
              <div className="meta-row">
                <FaReceipt />
                <span>{invoiceNumber}</span>
              </div>
              <div className="meta-row">
                <FaCalendarAlt />
                <span>{invoiceDate}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-section">
            <div className="bill-to">
              <h3>Bill To</h3>
              <p className="customer-name">{order?.user?.name || 'Customer'}</p>
              <p>{order?.deliveryAddress?.address}</p>
              <p>{order?.deliveryAddress?.city}, {order?.deliveryAddress?.state}</p>
              <p>PIN: {order?.deliveryAddress?.pincode}</p>
              <p>Phone: {order?.deliveryAddress?.phone || order?.user?.phone}</p>
            </div>
            
            {/* QR Code Section */}
            <div className="qr-section">
              <div 
                className={`qr-container ${showQR ? 'show' : ''}`}
                onClick={() => setShowQR(!showQR)}
              >
                <FaQrcode className="qr-icon" />
                <span>Scan to Verify</span>
              </div>
              {showQR && (
                <div className="qr-details">
                  <p>Invoice verification QR</p>
                  <small>{invoiceNumber}</small>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order?.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="item-name">{item.name || 'Product'}</td>
                    <td>6810</td>
                    <td>{item.quantity} {item.unit || 'pcs'}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td className="amount">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="total-row">
                <span>CGST (9%)</span>
                <span>{formatCurrency(totals.gst / 2)}</span>
              </div>
              <div className="total-row">
                <span>SGST (9%)</span>
                <span>{formatCurrency(totals.gst / 2)}</span>
              </div>
              {totals.delivery > 0 && (
                <div className="total-row">
                  <span>Delivery Charges</span>
                  <span>{formatCurrency(totals.delivery)}</span>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="total-row discount">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <p className="thank-you">Thank you for your business!</p>
            <p className="terms">Terms: Payment due within 30 days. Please include invoice number with payment.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button 
            className="action-btn download-btn"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? <FaSpinner className="spin" /> : <FaDownload />}
            <span>Download PDF</span>
          </button>

          <button 
            className="action-btn print-btn"
            onClick={handlePrint}
          >
            <FaPrint />
            <span>Print</span>
          </button>

          <button 
            className={`action-btn whatsapp-btn ${shareSuccess ? 'success' : ''}`}
            onClick={handleWhatsAppShare}
          >
            {shareSuccess ? <FaCheck /> : <FaWhatsapp />}
            <span>{shareSuccess ? 'Sent!' : 'Share via WhatsApp'}</span>
          </button>

          <button 
            className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyLink}
          >
            {copied ? <FaCheck /> : <FaCopy />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Payment Status */}
        <div className="payment-status">
          <div className={`status-badge status-${order?.paymentStatus?.toLowerCase() || 'pending'}`}>
            {order?.paymentStatus === 'paid' ? <FaCheck /> : <FaClock />}
            <span>Payment {order?.paymentStatus || 'Pending'}</span>
          </div>
          {order?.paymentMethod && (
            <span className="payment-method">via {order.paymentMethod}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
