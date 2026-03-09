/**
 * ============================================
 * ANIMATED FORM INPUT COMPONENT
 * Input with focus animations and validation
 * ============================================
 */

import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';
import { prefersReducedMotion } from '../../utils/animations';
import './AnimatedInput.css';

const AnimatedInput = forwardRef(({ 
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  type = 'text',
  disabled = false,
  required = false,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const reducedMotion = prefersReducedMotion();

  const hasError = !!error;
  const hasSuccess = !!success;
  const showMessage = error || helperText || success;

  // Shake animation for errors
  const shakeVariants = {
    shake: {
      x: reducedMotion ? 0 : [0, -8, 8, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 }
    },
  };

  const messageVariants = {
    initial: { opacity: 0, y: -8, height: 0 },
    animate: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
      opacity: 0, 
      y: -4, 
      height: 0,
      transition: { duration: 0.15 }
    },
  };

  const inputClasses = [
    'animated-input',
    isFocused ? 'is-focused' : '',
    hasError ? 'has-error' : '',
    hasSuccess ? 'has-success' : '',
    disabled ? 'is-disabled' : '',
    leftIcon ? 'has-left-icon' : '',
    rightIcon ? 'has-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div 
      className={`animated-input-container ${containerClassName}`}
      animate={hasError ? "shake" : ""}
      variants={shakeVariants}
    >
      {/* Label */}
      {label && (
        <label className="animated-input-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="animated-input-wrapper">
        {/* Left Icon */}
        {leftIcon && (
          <span className="input-icon input-icon-left">
            {leftIcon}
          </span>
        )}

        {/* Input */}
        <motion.input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Focus Ring Animation */}
        <motion.span 
          className="input-focus-ring"
          initial={{ scaleX: 0 }}
          animate={{ 
            scaleX: isFocused ? 1 : 0,
            transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
          }}
        />

        {/* Right Icon or Status Icon */}
        {(rightIcon || hasError || hasSuccess) && (
          <span className={`input-icon input-icon-right ${hasError ? 'error' : ''} ${hasSuccess ? 'success' : ''}`}>
            {hasError ? <FiAlertCircle /> : hasSuccess ? <FiCheck /> : rightIcon}
          </span>
        )}
      </div>

      {/* Helper Text / Error Message */}
      <AnimatePresence mode="wait">
        {showMessage && (
          <motion.p
            key={error || helperText || success}
            className={`input-message ${hasError ? 'error' : ''} ${hasSuccess ? 'success' : ''}`}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {error || success || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;
