import React, { useState, useEffect } from 'react';
import { 
  FaClipboardCheck, 
  FaCreditCard, 
  FaBoxOpen, 
  FaTruck, 
  FaCheckCircle,
  FaMapMarkerAlt,
  FaClock,
  FaPhoneAlt,
  FaWhatsapp
} from 'react-icons/fa';
import './OrderTimeline.css';

// Order stages configuration
const ORDER_STAGES = [
  {
    key: 'placed',
    label: 'Order Placed',
    icon: FaClipboardCheck,
    description: 'Your order has been received',
    color: '#285570'
  },
  {
    key: 'confirmed',
    label: 'Payment Confirmed',
    icon: FaCreditCard,
    description: 'Payment verified successfully',
    color: '#285570'
  },
  {
    key: 'processing',
    label: 'Being Packed',
    icon: FaBoxOpen,
    description: 'Your items are being prepared',
    color: '#285570'
  },
  {
    key: 'shipped',
    label: 'Out for Delivery',
    icon: FaTruck,
    description: 'On the way to your location',
    color: '#285570'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: FaCheckCircle,
    description: 'Successfully delivered',
    color: '#285570'
  }
];

// Map backend status to stage index
const STATUS_TO_STAGE = {
  'pending': 0,
  'placed': 0,
  'confirmed': 1,
  'payment_confirmed': 1,
  'processing': 2,
  'packed': 2,
  'shipped': 3,
  'out_for_delivery': 3,
  'delivered': 4,
  'completed': 4,
  'cancelled': -1
};

const OrderTimeline = ({ 
  order, 
  variant = 'vertical', // 'vertical', 'horizontal', 'compact'
  showEstimate = true,
  showActions = true,
  onTrackDelivery = null,
  onContactSupport = null 
}) => {
  const [animatedStage, setAnimatedStage] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  // Determine current stage from order status
  const orderStatus = order?.status?.toLowerCase() || 'pending';
  const currentStageIndex = STATUS_TO_STAGE[orderStatus] ?? 0;
  const isCancelled = currentStageIndex === -1;

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    
    // Animate stages progressively
    if (!isCancelled) {
      ORDER_STAGES.forEach((_, index) => {
        setTimeout(() => {
          if (index <= currentStageIndex) {
            setAnimatedStage(index);
          }
        }, (index + 1) * 300);
      });
    }
  }, [currentStageIndex, isCancelled]);

  // Calculate estimated delivery
  const getEstimatedDelivery = () => {
    if (!order?.createdAt) return null;
    
    const orderDate = new Date(order.createdAt);
    const estimatedDate = new Date(orderDate);
    
    // Add 3-5 days for delivery estimate
    const daysToAdd = currentStageIndex >= 3 ? 1 : (5 - currentStageIndex);
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    
    return estimatedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get time for each completed stage
  const getStageTime = (stageIndex) => {
    if (!order?.createdAt || stageIndex > currentStageIndex) return null;
    
    const orderDate = new Date(order.createdAt);
    const stageDate = new Date(orderDate);
    stageDate.setHours(stageDate.getHours() + (stageIndex * 4)); // Simulated progression
    
    return stageDate.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cancelled order display
  if (isCancelled) {
    return (
      <div className={`order-timeline timeline-cancelled ${isVisible ? 'visible' : ''}`}>
        <div className="cancelled-content">
          <div className="cancelled-icon">
            <FaClipboardCheck />
          </div>
          <div className="cancelled-info">
            <h3>Order Cancelled</h3>
            <p>This order has been cancelled. If you have questions, please contact support.</p>
          </div>
          {showActions && (
            <button className="support-btn" onClick={onContactSupport}>
              <FaPhoneAlt /> Contact Support
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    const CurrentIcon = ORDER_STAGES[currentStageIndex].icon;
    const progress = ((currentStageIndex + 1) / ORDER_STAGES.length) * 100;

    return (
      <div className={`timeline-compact ${isVisible ? 'visible' : ''}`}>
        <div className="compact-status">
          <div className="compact-icon">
            <CurrentIcon />
          </div>
          <div className="compact-info">
            <span className="compact-label">{ORDER_STAGES[currentStageIndex].label}</span>
            <span className="compact-desc">{ORDER_STAGES[currentStageIndex].description}</span>
          </div>
        </div>
        <div className="compact-progress">
          <div className="compact-track">
            <div className="compact-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="compact-step">{currentStageIndex + 1}/{ORDER_STAGES.length}</span>
        </div>
      </div>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div className={`timeline-horizontal ${isVisible ? 'visible' : ''}`}>
        <div className="horizontal-stages">
          {ORDER_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isAnimated = index <= animatedStage;

            return (
              <div 
                key={stage.key}
                className={`horizontal-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isAnimated ? 'animated' : ''}`}
              >
                <div className="stage-marker">
                  <div className="marker-circle">
                    <StageIcon />
                  </div>
                  {index < ORDER_STAGES.length - 1 && (
                    <div className="marker-line">
                      <div className={`line-fill ${index < currentStageIndex ? 'filled' : ''}`} />
                    </div>
                  )}
                </div>
                <div className="stage-label">{stage.label}</div>
              </div>
            );
          })}
        </div>

        {showEstimate && currentStageIndex < ORDER_STAGES.length - 1 && (
          <div className="horizontal-estimate">
            <FaClock />
            <span>Expected by {getEstimatedDelivery()}</span>
          </div>
        )}
      </div>
    );
  }

  // Default vertical variant
  return (
    <div className={`order-timeline timeline-vertical ${isVisible ? 'visible' : ''}`}>
      {/* Header */}
      <div className="timeline-header">
        <h3>Order Status</h3>
        {showEstimate && currentStageIndex < ORDER_STAGES.length - 1 && (
          <div className="delivery-estimate">
            <FaClock />
            <span>Expected by {getEstimatedDelivery()}</span>
          </div>
        )}
      </div>

      {/* Timeline Stages */}
      <div className="timeline-stages">
        {ORDER_STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isAnimated = index <= animatedStage;
          const stageTime = getStageTime(index);

          return (
            <div 
              key={stage.key}
              className={`timeline-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isAnimated ? 'animated' : ''}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index > 0 && (
                <div className="stage-connector">
                  <div className={`connector-line ${index <= currentStageIndex ? 'filled' : ''}`} />
                </div>
              )}

              {/* Stage Icon */}
              <div className="stage-icon-wrapper">
                <div className="stage-icon">
                  <StageIcon />
                </div>
                {isCurrent && <div className="pulse-ring" />}
              </div>

              {/* Stage Content */}
              <div className="stage-content">
                <div className="stage-header">
                  <span className="stage-title">{stage.label}</span>
                  {stageTime && <span className="stage-time">{stageTime}</span>}
                </div>
                <p className="stage-description">{stage.description}</p>
                
                {/* Current stage extra info */}
                {isCurrent && index === 3 && order?.deliveryAddress && (
                  <div className="stage-extra">
                    <FaMapMarkerAlt />
                    <span>Delivering to: {order.deliveryAddress.city || 'Your location'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="timeline-actions">
          {currentStageIndex >= 3 && onTrackDelivery && (
            <button className="action-btn track-btn" onClick={onTrackDelivery}>
              <FaMapMarkerAlt /> Track Delivery
            </button>
          )}
          <button className="action-btn whatsapp-btn" onClick={onContactSupport}>
            <FaWhatsapp /> Need Help?
          </button>
        </div>
      )}

      {/* Delivery Complete Message */}
      {currentStageIndex === ORDER_STAGES.length - 1 && (
        <div className="delivery-complete">
          <FaCheckCircle />
          <span>Your order has been delivered successfully!</span>
        </div>
      )}
    </div>
  );
};

// Export stages for external use
export { ORDER_STAGES, STATUS_TO_STAGE };
export default OrderTimeline;
