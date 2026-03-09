/**
 * ============================================
 * SKELETON LOADER COMPONENT
 * Premium loading placeholder animations
 * ============================================
 */

import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../../utils/animations';
import './Skeleton.css';

// Individual skeleton element
export const Skeleton = ({ 
  width = '100%', 
  height = '1rem',
  borderRadius = 'var(--radius-sm, 4px)',
  className = '',
  variant = 'text', // 'text', 'circle', 'rect', 'card', 'avatar'
  animation = true,
}) => {
  const reducedMotion = prefersReducedMotion();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
      case 'avatar':
        return { 
          width: height, 
          height, 
          borderRadius: '50%' 
        };
      case 'card':
        return { 
          width: '100%', 
          height: '200px', 
          borderRadius: 'var(--radius-lg, 12px)' 
        };
      default:
        return { width, height, borderRadius };
    }
  };

  const shimmerVariants = {
    animate: reducedMotion ? {} : {
      opacity: [0.4, 0.7, 0.4],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut"
      }
    },
  };

  return (
    <motion.div
      className={`skeleton ${variant} ${animation ? 'shimmer' : ''} ${className}`}
      style={getVariantStyles()}
      variants={shimmerVariants}
      animate={animation ? "animate" : undefined}
    />
  );
};

// Skeleton for product cards
export const SkeletonProductCard = () => (
  <div className="skeleton-product-card">
    <Skeleton variant="rect" height="200px" className="skeleton-image" />
    <div className="skeleton-content">
      <Skeleton width="70%" height="1.25rem" />
      <Skeleton width="50%" height="1rem" />
      <div className="skeleton-footer">
        <Skeleton width="40%" height="1.5rem" />
        <Skeleton width="30%" height="2.5rem" borderRadius="var(--radius-md)" />
      </div>
    </div>
  </div>
);

// Skeleton for table rows
export const SkeletonTableRow = ({ columns = 4 }) => (
  <div className="skeleton-table-row">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} width={`${70 + Math.random() * 30}%`} height="1rem" />
    ))}
  </div>
);

// Skeleton for list items
export const SkeletonListItem = () => (
  <div className="skeleton-list-item">
    <Skeleton variant="avatar" height="40px" />
    <div className="skeleton-list-content">
      <Skeleton width="60%" height="1rem" />
      <Skeleton width="40%" height="0.875rem" />
    </div>
  </div>
);

// Skeleton for dashboard stat cards
export const SkeletonStatCard = () => (
  <div className="skeleton-stat-card">
    <div className="skeleton-stat-header">
      <Skeleton variant="circle" height="48px" />
      <Skeleton width="60%" height="1rem" />
    </div>
    <Skeleton width="40%" height="2rem" />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);

// Skeleton for profile header
export const SkeletonProfileHeader = () => (
  <div className="skeleton-profile-header">
    <Skeleton variant="avatar" height="80px" />
    <div className="skeleton-profile-info">
      <Skeleton width="200px" height="1.5rem" />
      <Skeleton width="150px" height="1rem" />
      <Skeleton width="120px" height="0.875rem" />
    </div>
  </div>
);

export default Skeleton;
