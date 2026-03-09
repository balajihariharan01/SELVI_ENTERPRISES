/**
 * ============================================
 * ANIMATED CARD COMPONENT
 * Reusable card with hover/tap animations
 * ============================================
 */

import { motion } from 'framer-motion';
import { cardVariants, prefersReducedMotion } from '../../utils/animations';

const AnimatedCard = ({ 
  children, 
  className = '',
  onClick,
  delay = 0,
  disabled = false,
  ...props 
}) => {
  const reducedMotion = prefersReducedMotion();

  const variants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.98 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.25, 
        delay,
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    hover: reducedMotion ? {} : {
      y: -4,
      scale: 1.01,
      boxShadow: "0 12px 24px -8px rgba(15, 6, 137, 0.12), 0 4px 8px -4px rgba(15, 6, 137, 0.08)",
      transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
    },
    tap: reducedMotion ? {} : {
      scale: 0.99,
      transition: { duration: 0.1 }
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
