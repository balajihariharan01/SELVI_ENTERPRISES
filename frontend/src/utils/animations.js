/**
 * ============================================
 * SELVI ENTERPRISE - ANIMATION UTILITIES
 * Professional, Premium Animation System
 * ============================================
 * 
 * This file contains reusable animation variants
 * and configurations for Framer Motion.
 * 
 * Design Philosophy:
 * - Subtle and smooth (not flashy)
 * - Professional business aesthetic
 * - Performance-optimized
 * - Accessibility-conscious
 */

// ============================================
// TIMING CONSTANTS
// ============================================
export const TIMING = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
};

// Professional easing curves
export const EASING = {
  smooth: [0.4, 0, 0.2, 1],       // Material Design standard
  smoothOut: [0, 0, 0.2, 1],      // Decelerate
  smoothIn: [0.4, 0, 1, 1],       // Accelerate
  bounce: [0.68, -0.55, 0.265, 1.55], // Subtle bounce
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentleSpring: { type: "spring", stiffness: 200, damping: 25 },
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.normal,
      ease: EASING.smooth,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: TIMING.fast,
      ease: EASING.smoothIn,
    },
  },
};

// Faster page transition for snappy navigation
export const pageVariantsFast = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.fast,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================
// FADE VARIANTS
// ============================================
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0,
    transition: { duration: TIMING.fast }
  },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: TIMING.fast }
  },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: TIMING.fast }
  },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: TIMING.fast }
  },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// SCALE VARIANTS
// ============================================
export const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { duration: TIMING.fast }
  },
};

export const scaleInCenter = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// STAGGER CONTAINER VARIANTS
// ============================================
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// ============================================
// STAGGER CHILD VARIANTS
// ============================================
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
};

export const staggerItemLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
};

// ============================================
// CARD VARIANTS (Products, Orders, Dashboard)
// ============================================
export const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: TIMING.normal, ease: EASING.smooth }
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: "0 12px 24px -8px rgba(15, 6, 137, 0.12), 0 4px 8px -4px rgba(15, 6, 137, 0.08)",
    transition: { duration: TIMING.fast, ease: EASING.smooth }
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 }
  },
};

export const productCardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: TIMING.slow, ease: EASING.smooth }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: TIMING.fast, ease: EASING.smooth }
  },
  tap: {
    scale: 0.98,
  },
};

// ============================================
// BUTTON VARIANTS
// ============================================
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.97,
    transition: { duration: 0.1 }
  },
};

export const buttonPrimaryVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    boxShadow: "0 8px 20px -6px rgba(8, 87, 190, 0.4)",
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.97,
    boxShadow: "0 2px 8px -2px rgba(8, 87, 190, 0.3)",
    transition: { duration: 0.1 }
  },
};

// ============================================
// MODAL & DRAWER VARIANTS
// ============================================
export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: TIMING.fast }
  },
  exit: { 
    opacity: 0,
    transition: { duration: TIMING.fast }
  },
};

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: TIMING.normal, 
      ease: EASING.smooth 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.97, 
    y: 10,
    transition: { duration: TIMING.fast }
  },
};

export const drawerVariants = {
  initial: { x: "100%" },
  animate: { 
    x: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    x: "100%",
    transition: { duration: TIMING.fast, ease: EASING.smoothIn }
  },
};

export const slideUpDrawerVariants = {
  initial: { y: "100%" },
  animate: { 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    y: "100%",
    transition: { duration: TIMING.fast, ease: EASING.smoothIn }
  },
};

// ============================================
// DASHBOARD STAT CARD VARIANTS
// ============================================
export const statCardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: TIMING.slow,
      delay: index * 0.1,
      ease: EASING.smooth
    }
  }),
  hover: {
    y: -5,
    scale: 1.02,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// FORM INPUT VARIANTS
// ============================================
export const inputFocusVariants = {
  rest: { 
    borderColor: "var(--border-color)",
    boxShadow: "none"
  },
  focus: { 
    borderColor: "var(--primary)",
    boxShadow: "0 0 0 3px rgba(8, 87, 190, 0.1)",
    transition: { duration: TIMING.fast }
  },
};

export const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  },
};

// ============================================
// NOTIFICATION / TOAST VARIANTS
// ============================================
export const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// LOADING SPINNER VARIANTS
// ============================================
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "linear"
    }
  },
};

export const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut"
    }
  },
};

// ============================================
// PROGRESS / TIMELINE VARIANTS
// ============================================
export const progressVariants = {
  initial: { width: 0 },
  animate: (percentage) => ({
    width: `${percentage}%`,
    transition: { 
      duration: TIMING.slower,
      ease: EASING.smooth
    }
  }),
};

export const timelineStepVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: (index) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMING.normal,
      delay: index * 0.15,
      ease: EASING.smooth
    }
  }),
  active: {
    scale: 1.1,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// NAVBAR / MENU VARIANTS
// ============================================
export const navMenuVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { 
    opacity: 1, 
    height: "auto",
    transition: { 
      duration: TIMING.normal,
      ease: EASING.smooth
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: { duration: TIMING.fast }
  },
};

export const dropdownVariants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: TIMING.fast,
      ease: EASING.smooth
    }
  },
  exit: { 
    opacity: 0, 
    y: -5, 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

// ============================================
// BADGE / TAG VARIANTS
// ============================================
export const badgeVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { 
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut"
    }
  },
};

// ============================================
// ANIMATED COUNTER HELPER
// ============================================
export const counterAnimation = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// HERO SECTION VARIANTS
// ============================================
export const heroVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: TIMING.slow,
      staggerChildren: 0.15,
    },
  },
};

export const heroTextVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: TIMING.slow,
      ease: EASING.smooth
    }
  },
};

export const heroImageVariants = {
  initial: { opacity: 0, x: 30, scale: 0.95 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      duration: TIMING.slower,
      ease: EASING.smooth
    }
  },
};

// ============================================
// UTILITY: Check for reduced motion preference
// ============================================
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get animation variants that respect reduced motion
export const getAccessibleVariants = (variants) => {
  if (prefersReducedMotion()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return variants;
};

// ============================================
// SUCCESS CHECKMARK ANIMATION
// ============================================
export const successCheckVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    }
  },
};

export const checkmarkPathVariants = {
  initial: { pathLength: 0 },
  animate: {
    pathLength: 1,
    transition: {
      duration: 0.4,
      delay: 0.2,
      ease: EASING.smooth
    }
  },
};

// ============================================
// RIPPLE EFFECT (for buttons)
// ============================================
export const rippleVariants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

// ============================================
// SKELETON LOADING
// ============================================
export const skeletonVariants = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut"
    }
  },
};

// ============================================
// FLOATING ANIMATION (for decorative elements)
// ============================================
export const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut"
    }
  },
};

// ============================================
// REVEAL ON SCROLL (for sections)
// ============================================
export const revealVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.98 
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: TIMING.slow,
      delay,
      ease: EASING.smooth
    }
  }),
};

// ============================================
// CART ANIMATION (add to cart feedback)
// ============================================
export const cartBounceVariants = {
  initial: { scale: 1 },
  bounce: {
    scale: [1, 1.2, 0.9, 1.1, 1],
    transition: { duration: 0.4 }
  },
};

export const cartItemAddVariants = {
  initial: { opacity: 0, scale: 0.5, y: -20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    x: -20,
    transition: { duration: TIMING.fast }
  },
};

// ============================================
// DEFAULT EXPORT WITH ALL VARIANTS
// ============================================
export default {
  TIMING,
  EASING,
  page: pageVariants,
  pageFast: pageVariantsFast,
  fade: fadeVariants,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scale: scaleVariants,
  scaleInCenter,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale,
  staggerItemLeft,
  card: cardVariants,
  productCard: productCardVariants,
  button: buttonVariants,
  buttonPrimary: buttonPrimaryVariants,
  modalBackdrop: modalBackdropVariants,
  modalContent: modalContentVariants,
  drawer: drawerVariants,
  slideUpDrawer: slideUpDrawerVariants,
  statCard: statCardVariants,
  inputFocus: inputFocusVariants,
  shake: shakeVariants,
  toast: toastVariants,
  spinner: spinnerVariants,
  pulse: pulseVariants,
  progress: progressVariants,
  timelineStep: timelineStepVariants,
  navMenu: navMenuVariants,
  dropdown: dropdownVariants,
  badge: badgeVariants,
  counter: counterAnimation,
  hero: heroVariants,
  heroText: heroTextVariants,
  heroImage: heroImageVariants,
  successCheck: successCheckVariants,
  checkmarkPath: checkmarkPathVariants,
  ripple: rippleVariants,
  skeleton: skeletonVariants,
  float: floatVariants,
  reveal: revealVariants,
  cartBounce: cartBounceVariants,
  cartItemAdd: cartItemAddVariants,
  prefersReducedMotion,
  getAccessibleVariants,
};
