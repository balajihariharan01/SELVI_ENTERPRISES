/**
 * ============================================
 * ANIMATED MODAL COMPONENT
 * Modal with backdrop blur and smooth animations
 * ============================================
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { prefersReducedMotion } from '../../utils/animations';
import './AnimatedModal.css';

const AnimatedModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title = '',
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
}) => {
  const reducedMotion = prefersReducedMotion();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: reducedMotion ? 0.1 : 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: reducedMotion ? 0.1 : 0.15 }
    },
  };

  const modalVariants = {
    initial: { 
      opacity: 0, 
      scale: reducedMotion ? 1 : 0.95, 
      y: reducedMotion ? 0 : 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: reducedMotion ? 0.15 : 0.25, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    exit: { 
      opacity: 0, 
      scale: reducedMotion ? 1 : 0.97, 
      y: reducedMotion ? 0 : 10,
      transition: { duration: reducedMotion ? 0.1 : 0.15 }
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="modal-portal">
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          
          {/* Modal Container */}
          <div className="modal-container">
            <motion.div
              className={`modal-content modal-${size} ${className}`}
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="modal-header">
                  {title && (
                    <h2 id="modal-title" className="modal-title">{title}</h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      className="modal-close-btn"
                      onClick={onClose}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Close modal"
                    >
                      <FiX />
                    </motion.button>
                  )}
                </div>
              )}
              
              {/* Body */}
              <div className="modal-body">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedModal;
