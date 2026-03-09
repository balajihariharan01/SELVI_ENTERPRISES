/**
 * ============================================
 * ANIMATED LIST / STAGGER CONTAINER
 * For staggered animations on lists/grids
 * ============================================
 */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, prefersReducedMotion } from '../../utils/animations';

export const AnimatedList = ({ 
  children, 
  className = '',
  staggerDelay = 0.08,
  initialDelay = 0.1,
  ...props 
}) => {
  const reducedMotion = prefersReducedMotion();

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: reducedMotion ? 0 : staggerDelay,
        delayChildren: reducedMotion ? 0 : initialDelay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedListItem = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const reducedMotion = prefersReducedMotion();

  const itemVariants = {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: reducedMotion ? 0.15 : 0.25, 
        ease: [0.4, 0, 0.2, 1] 
      }
    },
  };

  return (
    <motion.div
      className={className}
      variants={itemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedList;
