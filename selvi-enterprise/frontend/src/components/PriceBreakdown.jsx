import { useState, useEffect } from 'react';
import { FiPercent, FiTruck, FiPackage, FiTag, FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import './PriceBreakdown.css';

/**
 * Smart Price Breakdown Component
 * Displays detailed price breakdown with GST, delivery, and savings
 */
const PriceBreakdown = ({ 
  items = [], 
  showDelivery = true, 
  compact = false,
  className = '' 
}) => {
  const [expanded, setExpanded] = useState(!compact);
  const [breakdown, setBreakdown] = useState({
    subtotal: 0,
    gstAmount: 0,
    deliveryCharge: 0,
    totalBeforeDiscount: 0,
    bulkDiscount: 0,
    finalAmount: 0,
    savings: 0
  });

  // GST Rate (18% for construction materials in India)
  const GST_RATE = 0.18;
  
  // Delivery thresholds
  const FREE_DELIVERY_THRESHOLD = 5000;
  const DELIVERY_CHARGE = 150;
  
  // Bulk discount tiers
  const BULK_DISCOUNT_TIERS = [
    { minQty: 50, discount: 0.05 },  // 5% off for 50+ units
    { minQty: 100, discount: 0.08 }, // 8% off for 100+ units
    { minQty: 200, discount: 0.10 }, // 10% off for 200+ units
  ];

  useEffect(() => {
    calculateBreakdown();
  }, [items]);

  const calculateBreakdown = () => {
    if (!items || items.length === 0) {
      setBreakdown({
        subtotal: 0,
        gstAmount: 0,
        deliveryCharge: 0,
        totalBeforeDiscount: 0,
        bulkDiscount: 0,
        finalAmount: 0,
        savings: 0
      });
      return;
    }

    // Calculate subtotal (base price without GST)
    let subtotal = 0;
    let totalQuantity = 0;

    items.forEach(item => {
      const price = item.product?.price || item.price || 0;
      const quantity = item.quantity || 1;
      subtotal += price * quantity;
      totalQuantity += quantity;
    });

    // Calculate GST
    const gstAmount = subtotal * GST_RATE;

    // Determine delivery charge
    const deliveryCharge = showDelivery && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_CHARGE : 0;

    // Calculate bulk discount
    let bulkDiscountRate = 0;
    for (const tier of BULK_DISCOUNT_TIERS) {
      if (totalQuantity >= tier.minQty) {
        bulkDiscountRate = tier.discount;
      }
    }
    const bulkDiscount = subtotal * bulkDiscountRate;

    // Calculate totals
    const totalBeforeDiscount = subtotal + gstAmount + deliveryCharge;
    const finalAmount = totalBeforeDiscount - bulkDiscount;
    
    // Total savings (bulk discount + free delivery if applicable)
    const deliverySavings = showDelivery && subtotal >= FREE_DELIVERY_THRESHOLD ? DELIVERY_CHARGE : 0;
    const savings = bulkDiscount + deliverySavings;

    setBreakdown({
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      deliveryCharge,
      totalBeforeDiscount: Math.round(totalBeforeDiscount * 100) / 100,
      bulkDiscount: Math.round(bulkDiscount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      totalQuantity,
      bulkDiscountRate
    });
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`price-breakdown ${compact ? 'compact' : ''} ${className}`}>
      {/* Header with toggle */}
      <div 
        className="breakdown-header"
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="header-left">
          <FiPackage className="header-icon" />
          <span className="header-title">Price Breakdown</span>
        </div>
        {compact && (
          <button className="toggle-btn">
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        )}
      </div>

      {/* Breakdown Details */}
      {expanded && (
        <div className="breakdown-details">
          {/* Subtotal */}
          <div className="breakdown-row">
            <span className="row-label">
              <FiTag className="row-icon" />
              Base Price ({items.length} item{items.length > 1 ? 's' : ''})
            </span>
            <span className="row-value">{formatPrice(breakdown.subtotal)}</span>
          </div>

          {/* GST */}
          <div className="breakdown-row gst">
            <span className="row-label">
              <FiPercent className="row-icon" />
              GST (18%)
            </span>
            <span className="row-value">+{formatPrice(breakdown.gstAmount)}</span>
          </div>

          {/* Delivery */}
          {showDelivery && (
            <div className="breakdown-row delivery">
              <span className="row-label">
                <FiTruck className="row-icon" />
                Delivery Charges
              </span>
              <span className={`row-value ${breakdown.deliveryCharge === 0 ? 'free' : ''}`}>
                {breakdown.deliveryCharge === 0 ? (
                  <span className="free-badge">FREE</span>
                ) : (
                  `+${formatPrice(breakdown.deliveryCharge)}`
                )}
              </span>
            </div>
          )}

          {/* Bulk Discount */}
          {breakdown.bulkDiscount > 0 && (
            <div className="breakdown-row discount">
              <span className="row-label">
                <FiTag className="row-icon" />
                Bulk Discount ({Math.round(breakdown.bulkDiscountRate * 100)}% off)
              </span>
              <span className="row-value discount-value">
                -{formatPrice(breakdown.bulkDiscount)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="breakdown-divider"></div>

          {/* Final Amount */}
          <div className="breakdown-row total">
            <span className="row-label">Total Payable</span>
            <span className="row-value total-value">
              {formatPrice(breakdown.finalAmount)}
            </span>
          </div>

          {/* Savings Banner */}
          {breakdown.savings > 0 && (
            <div className="savings-banner">
              <div className="savings-icon">🎉</div>
              <div className="savings-content">
                <span className="savings-label">You're Saving</span>
                <span className="savings-amount">{formatPrice(breakdown.savings)}</span>
              </div>
            </div>
          )}

          {/* Free Delivery Progress */}
          {showDelivery && breakdown.subtotal < FREE_DELIVERY_THRESHOLD && (
            <div className="free-delivery-progress">
              <div className="progress-info">
                <FiInfo className="info-icon" />
                <span>
                  Add {formatPrice(FREE_DELIVERY_THRESHOLD - breakdown.subtotal)} more for 
                  <strong> FREE delivery</strong>
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((breakdown.subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Bulk Discount Info */}
          {breakdown.totalQuantity < 50 && (
            <div className="bulk-discount-hint">
              <FiInfo className="info-icon" />
              <span>Order 50+ units to get <strong>5% bulk discount</strong>!</span>
            </div>
          )}
        </div>
      )}

      {/* Compact Summary */}
      {!expanded && compact && (
        <div className="compact-summary">
          <span className="compact-total">Total: {formatPrice(breakdown.finalAmount)}</span>
          {breakdown.savings > 0 && (
            <span className="compact-savings">Save {formatPrice(breakdown.savings)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
