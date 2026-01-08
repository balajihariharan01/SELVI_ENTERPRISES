import React, { useState, useEffect } from 'react';
import { FaBoxOpen, FaBell, FaBellSlash, FaExclamationTriangle, FaCheckCircle, FaTimes, FaFire, FaClock, FaTruck } from 'react-icons/fa';
import './StockAlerts.css';

// Stock threshold constants
const STOCK_THRESHOLDS = {
  CRITICAL: 10,      // Red alert - immediate action needed
  LOW: 25,           // Orange alert - reorder soon
  MODERATE: 50,      // Yellow alert - monitor closely
  HEALTHY: 100       // Green - good stock level
};

const StockAlerts = ({ 
  product, 
  showSubscribe = true, 
  variant = 'default', // 'default', 'compact', 'badge', 'detailed'
  onSubscribe = null,
  showAnimation = true 
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const stock = product?.stock || 0;
  const productName = product?.name || 'Product';

  // Determine stock status
  const getStockStatus = () => {
    if (stock <= 0) return { level: 'out', label: 'Out of Stock', icon: FaBoxOpen, color: '#333333' };
    if (stock <= STOCK_THRESHOLDS.CRITICAL) return { level: 'critical', label: 'Almost Gone!', icon: FaFire, color: '#285570' };
    if (stock <= STOCK_THRESHOLDS.LOW) return { level: 'low', label: 'Low Stock', icon: FaExclamationTriangle, color: '#285570' };
    if (stock <= STOCK_THRESHOLDS.MODERATE) return { level: 'moderate', label: 'Limited Stock', icon: FaClock, color: '#333333' };
    return { level: 'healthy', label: 'In Stock', icon: FaCheckCircle, color: '#285570' };
  };

  const status = getStockStatus();
  const StatusIcon = status.icon;

  // Animation on mount
  useEffect(() => {
    if (showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [stock, showAnimation]);

  // Handle subscription toggle
  const handleSubscribe = () => {
    const newState = !isSubscribed;
    setIsSubscribed(newState);
    
    if (newState) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Store subscription (in real app, this would call backend)
      const subscriptions = JSON.parse(localStorage.getItem('stockSubscriptions') || '[]');
      if (!subscriptions.includes(product._id)) {
        subscriptions.push(product._id);
        localStorage.setItem('stockSubscriptions', JSON.stringify(subscriptions));
      }
    } else {
      const subscriptions = JSON.parse(localStorage.getItem('stockSubscriptions') || '[]');
      const filtered = subscriptions.filter(id => id !== product._id);
      localStorage.setItem('stockSubscriptions', JSON.stringify(filtered));
    }
    
    if (onSubscribe) {
      onSubscribe(product._id, newState);
    }
  };

  // Check if already subscribed on mount
  useEffect(() => {
    const subscriptions = JSON.parse(localStorage.getItem('stockSubscriptions') || '[]');
    setIsSubscribed(subscriptions.includes(product?._id));
  }, [product?._id]);

  // Calculate stock percentage for progress bar
  const stockPercentage = Math.min((stock / STOCK_THRESHOLDS.HEALTHY) * 100, 100);

  // Estimate restock time based on stock level
  const getRestockEstimate = () => {
    if (stock <= 0) return 'Restocking in 2-3 days';
    if (stock <= STOCK_THRESHOLDS.CRITICAL) return 'Order now - selling fast!';
    if (stock <= STOCK_THRESHOLDS.LOW) return 'Restock expected soon';
    return null;
  };

  // Badge variant - minimal display
  if (variant === 'badge') {
    return (
      <div className={`stock-badge stock-badge--${status.level} ${isAnimating ? 'animate-pulse' : ''}`}>
        <StatusIcon className="badge-icon" />
        <span>{stock > 0 ? `${stock} left` : 'Out'}</span>
      </div>
    );
  }

  // Compact variant - single line
  if (variant === 'compact') {
    return (
      <div className={`stock-compact stock-compact--${status.level}`}>
        <div className="compact-indicator">
          <StatusIcon />
          <span className="compact-label">{status.label}</span>
          {stock > 0 && stock <= STOCK_THRESHOLDS.LOW && (
            <span className="compact-count">({stock} remaining)</span>
          )}
        </div>
        {showSubscribe && stock <= STOCK_THRESHOLDS.LOW && (
          <button 
            className={`compact-subscribe ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
            title={isSubscribed ? 'Unsubscribe from alerts' : 'Get restock alerts'}
          >
            {isSubscribed ? <FaBellSlash /> : <FaBell />}
          </button>
        )}
      </div>
    );
  }

  // Detailed variant - full information panel
  if (variant === 'detailed') {
    const restockEstimate = getRestockEstimate();
    
    return (
      <div className={`stock-detailed stock-detailed--${status.level} ${isAnimating ? 'animate-in' : ''}`}>
        {/* Notification Toast */}
        {showNotification && (
          <div className="stock-toast">
            <FaBell />
            <span>You'll be notified when {productName} is restocked!</span>
            <button onClick={() => setShowNotification(false)}><FaTimes /></button>
          </div>
        )}

        <div className="detailed-header">
          <div className="status-indicator">
            <StatusIcon className="status-icon" />
            <div className="status-text">
              <span className="status-label">{status.label}</span>
              {stock > 0 && <span className="stock-number">{stock} units available</span>}
            </div>
          </div>
          
          {showSubscribe && stock <= STOCK_THRESHOLDS.MODERATE && (
            <button 
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? (
                <>
                  <FaBellSlash /> Subscribed
                </>
              ) : (
                <>
                  <FaBell /> Notify Me
                </>
              )}
            </button>
          )}
        </div>

        {/* Stock Progress Bar */}
        <div className="stock-progress-container">
          <div className="progress-track">
            <div 
              className={`progress-fill progress-fill--${status.level}`}
              style={{ width: `${stockPercentage}%` }}
            />
            <div className="progress-markers">
              <span className="marker marker--critical" style={{ left: `${(STOCK_THRESHOLDS.CRITICAL / STOCK_THRESHOLDS.HEALTHY) * 100}%` }} />
              <span className="marker marker--low" style={{ left: `${(STOCK_THRESHOLDS.LOW / STOCK_THRESHOLDS.HEALTHY) * 100}%` }} />
              <span className="marker marker--moderate" style={{ left: `${(STOCK_THRESHOLDS.MODERATE / STOCK_THRESHOLDS.HEALTHY) * 100}%` }} />
            </div>
          </div>
          <div className="progress-labels">
            <span>Critical</span>
            <span>Low</span>
            <span>Good</span>
            <span>Optimal</span>
          </div>
        </div>

        {/* Restock Estimate */}
        {restockEstimate && (
          <div className="restock-estimate">
            <FaTruck />
            <span>{restockEstimate}</span>
          </div>
        )}

        {/* Urgency Message */}
        {stock > 0 && stock <= STOCK_THRESHOLDS.CRITICAL && (
          <div className="urgency-banner">
            <FaFire className="urgency-icon" />
            <span>High demand! {stock} people are viewing this product</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`stock-alert stock-alert--${status.level} ${isAnimating ? 'animate-shake' : ''}`}>
      {/* Notification Toast */}
      {showNotification && (
        <div className="stock-toast">
          <FaBell />
          <span>Subscribed to restock alerts!</span>
          <button onClick={() => setShowNotification(false)}><FaTimes /></button>
        </div>
      )}

      <div className="alert-content">
        <div className="alert-icon-wrapper">
          <StatusIcon className="alert-icon" />
        </div>
        
        <div className="alert-info">
          <span className="alert-status">{status.label}</span>
          {stock > 0 && stock <= STOCK_THRESHOLDS.LOW && (
            <span className="alert-count">Only {stock} left!</span>
          )}
          {stock === 0 && (
            <span className="alert-out">Check back soon</span>
          )}
        </div>

        {showSubscribe && stock <= STOCK_THRESHOLDS.LOW && (
          <button 
            className={`alert-subscribe ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
          >
            {isSubscribed ? <FaBellSlash /> : <FaBell />}
            <span>{isSubscribed ? 'Subscribed' : 'Alert Me'}</span>
          </button>
        )}
      </div>

      {/* Mini Progress Bar */}
      {stock > 0 && stock <= STOCK_THRESHOLDS.MODERATE && (
        <div className="alert-progress">
          <div 
            className={`alert-progress-fill alert-progress-fill--${status.level}`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Export thresholds for use in other components
export { STOCK_THRESHOLDS };
export default StockAlerts;
