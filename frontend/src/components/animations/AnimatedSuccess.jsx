/**
 * ============================================
 * ANIMATED SUCCESS CHECKMARK COMPONENT
 * Premium success feedback animation
 * ============================================
 */

import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../../utils/animations';
import './AnimatedSuccess.css';

const AnimatedSuccess = ({ 
  size = 80,
  strokeWidth = 3,
  color = 'var(--success, #10B981)',
  bgColor = 'var(--success-light, rgba(16, 185, 129, 0.1))',
  showCircle = true,
  delay = 0,
  className = '',
}) => {
  const reducedMotion = prefersReducedMotion();
  
  const circleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: reducedMotion 
        ? { duration: 0.1 }
        : { 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay
          }
    },
  };

  const checkVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0.1 }
        : {
            pathLength: { 
              duration: 0.4, 
              delay: delay + 0.2,
              ease: [0.4, 0, 0.2, 1]
            },
            opacity: { duration: 0.1, delay: delay + 0.2 }
          }
    },
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: reducedMotion ? {} : {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0, 0],
      transition: {
        duration: 0.8,
        delay: delay + 0.5,
        ease: "easeOut"
      }
    },
  };

  return (
    <div 
      className={`animated-success ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Pulse effect behind */}
      <motion.div
        className="success-pulse"
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        style={{ backgroundColor: color }}
      />
      
      {/* Main circle and check */}
      <motion.svg
        viewBox="0 0 52 52"
        width={size}
        height={size}
        className="success-svg"
      >
        {showCircle && (
          <motion.circle
            className="success-circle"
            cx="26"
            cy="26"
            r="23"
            fill={bgColor}
            stroke={color}
            strokeWidth={strokeWidth}
            variants={circleVariants}
            initial="initial"
            animate="animate"
          />
        )}
        <motion.path
          className="success-check"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkVariants}
          initial="initial"
          animate="animate"
        />
      </motion.svg>
    </div>
  );
};

export default AnimatedSuccess;
