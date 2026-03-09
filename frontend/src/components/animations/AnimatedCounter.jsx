/**
 * ============================================
 * ANIMATED COUNTER COMPONENT
 * Smooth number animation for statistics
 * ============================================
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { prefersReducedMotion } from '../../utils/animations';

const AnimatedCounter = ({ 
  value = 0,
  duration = 1.5,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  formatNumber = true,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (!isInView) return;

    // If reduced motion, just set the value immediately
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Animate the counter
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [value, duration, delay, isInView, reducedMotion]);

  // Format the displayed number
  const formattedValue = () => {
    const num = decimals > 0 
      ? displayValue.toFixed(decimals) 
      : Math.round(displayValue);
    
    if (formatNumber && !decimals) {
      return Number(num).toLocaleString('en-IN');
    }
    return num;
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formattedValue()}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
