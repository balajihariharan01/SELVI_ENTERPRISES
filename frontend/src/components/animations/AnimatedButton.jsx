/**
 * ============================================
 * ANIMATED BUTTON COMPONENT
 * Button with hover, tap, and loading animations
 * ============================================
 */

import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';
import { prefersReducedMotion } from '../../utils/animations';
import './AnimatedButton.css';

const AnimatedButton = ({ 
  children, 
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props 
}) => {
  const reducedMotion = prefersReducedMotion();

  const buttonVariants = {
    initial: { scale: 1 },
    hover: reducedMotion ? {} : { 
      scale: 1.02,
      transition: { duration: 0.15 }
    },
    tap: reducedMotion ? {} : { 
      scale: 0.97,
      transition: { duration: 0.1 }
    },
  };

  const spinnerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      rotate: 360,
      transition: {
        opacity: { duration: 0.15 },
        scale: { duration: 0.15 },
        rotate: { repeat: Infinity, duration: 0.8, ease: "linear" }
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.1 }
    },
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const classes = [
    'animated-btn',
    `animated-btn-${variant}`,
    `animated-btn-${size}`,
    loading ? 'is-loading' : '',
    disabled ? 'is-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={classes}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !loading ? "hover" : undefined}
      whileTap={!disabled && !loading ? "tap" : undefined}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="spinner"
            className="btn-spinner"
            variants={spinnerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <FiLoader />
          </motion.span>
        ) : (
          <motion.span
            key="content"
            className="btn-content"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {icon && iconPosition === 'left' && (
              <span className="btn-icon btn-icon-left">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="btn-icon btn-icon-right">{icon}</span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AnimatedButton;
