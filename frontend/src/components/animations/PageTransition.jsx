/**
 * ============================================
 * PAGE TRANSITION WRAPPER COMPONENT
 * Smooth page enter/exit animations
 * ============================================
 */

import { motion } from 'framer-motion';
import { pageVariants, prefersReducedMotion } from '../../utils/animations';

const PageTransition = ({ 
  children, 
  className = '',
  variant = 'default', // 'default', 'fast', 'slide'
  ...props 
}) => {
  // Respect reduced motion preference
  const reducedMotion = prefersReducedMotion();

  const variants = {
    default: pageVariants,
    fast: {
      initial: { opacity: 0, y: 12 },
      enter: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      },
      exit: { 
        opacity: 0,
        transition: { duration: 0.1 }
      },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      enter: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      },
      exit: { 
        opacity: 0, 
        x: -20,
        transition: { duration: 0.15 }
      },
    },
  };

  // Simple fade for reduced motion
  const reducedVariants = {
    initial: { opacity: 0 },
    enter: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const selectedVariants = reducedMotion ? reducedVariants : variants[variant];

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={selectedVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
