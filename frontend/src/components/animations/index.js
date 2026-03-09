/**
 * ============================================
 * ANIMATIONS COMPONENTS - INDEX
 * Export all animation components
 * ============================================
 */

// Animation Utilities
export { default as animations } from '../../utils/animations';
export * from '../../utils/animations';

// Framer Motion Components
export { default as PageTransition } from './PageTransition';
export { default as AnimatedCard } from './AnimatedCard';
export { default as AnimatedButton } from './AnimatedButton';
export { default as AnimatedModal } from './AnimatedModal';
export { default as AnimatedCounter } from './AnimatedCounter';
export { default as AnimatedInput } from './AnimatedInput';
export { default as AnimatedSuccess } from './AnimatedSuccess';
export { AnimatedList, AnimatedListItem } from './AnimatedList';

// Tailwind CSS Animation Components
export { 
  default as TwPageTransition,
  TwAnimatedSection,
  TwStaggerContainer,
} from './TwPageTransition';

// Skeleton Loaders
export { 
  default as Skeleton,
  SkeletonProductCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonStatCard,
  SkeletonProfileHeader,
} from './Skeleton';

// Re-export framer-motion essentials for convenience
export { 
  motion, 
  AnimatePresence, 
  useAnimation,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion';
