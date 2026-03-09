/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TAILWIND PAGE TRANSITION WRAPPER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A lightweight page transition component using Tailwind CSS animations.
 * Provides smooth fade + slide transitions on route changes.
 * 
 * USAGE:
 * 
 * import { TwPageTransition } from '../components/animations';
 * 
 * <TwPageTransition>
 *   <YourPageContent />
 * </TwPageTransition>
 * 
 * VARIANTS:
 * - default: fade-in-up (300ms)
 * - fast: fade-in (200ms)
 * - slide: slide-in-up
 * - scale: scale-in
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation variant classes
const VARIANTS = {
  default: {
    enter: 'animate-fade-in-up',
    exit: 'animate-fade-out',
  },
  fast: {
    enter: 'animate-fade-in',
    exit: 'animate-fade-out',
  },
  slide: {
    enter: 'animate-slide-in-up',
    exit: 'animate-fade-out',
  },
  scale: {
    enter: 'animate-scale-in',
    exit: 'animate-scale-out',
  },
  left: {
    enter: 'animate-fade-in-left',
    exit: 'animate-fade-out',
  },
  right: {
    enter: 'animate-fade-in-right',
    exit: 'animate-fade-out',
  },
};

// Reduced motion variant
const REDUCED_VARIANT = {
  enter: 'opacity-100 transition-opacity duration-150',
  exit: 'opacity-0',
};

const TwPageTransition = ({ 
  children, 
  className = '',
  variant = 'default',
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const reducedMotion = prefersReducedMotion();

  // Get the appropriate variant
  const animationVariant = reducedMotion 
    ? REDUCED_VARIANT 
    : (VARIANTS[variant] || VARIANTS.default);

  useEffect(() => {
    // Trigger enter animation on mount/route change
    setIsVisible(false);
    
    // Small delay to ensure animation triggers
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(timer);
  }, [location.pathname]);

  const animationClass = isVisible 
    ? animationVariant.enter 
    : 'opacity-0';

  return (
    <div
      ref={containerRef}
      className={`
        ${animationClass}
        ${className}
      `.trim()}
      style={{ 
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default TwPageTransition;


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANIMATED SECTION WRAPPER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Animate sections when they enter the viewport using Intersection Observer.
 * 
 * USAGE:
 * <TwAnimatedSection animation="fade-in-up">
 *   <YourContent />
 * </TwAnimatedSection>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const TwAnimatedSection = ({ 
  children, 
  className = '',
  animation = 'fade-in-up', // fade-in-up, fade-in-left, fade-in-right, scale-in
  delay = 0,
  threshold = 0.1,
  once = true, // Only animate once
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  // Animation class mapping
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'fade-in-down': 'animate-fade-in-down',
    'fade-in-left': 'animate-fade-in-left',
    'fade-in-right': 'animate-fade-in-right',
    'scale-in': 'animate-scale-in',
    'slide-in-up': 'animate-slide-in-up',
  };

  const delayClass = delay > 0 ? `delay-${delay}` : '';

  return (
    <div
      ref={sectionRef}
      className={`
        ${isVisible && !reducedMotion ? animationClasses[animation] : ''}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${delayClass}
        ${className}
      `.trim()}
      style={{ 
        willChange: isVisible ? 'auto' : 'opacity, transform',
        transitionDelay: reducedMotion ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STAGGERED CHILDREN WRAPPER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Automatically staggers animation of child elements.
 * 
 * USAGE:
 * <TwStaggerContainer>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </TwStaggerContainer>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const TwStaggerContainer = ({ 
  children, 
  className = '',
  staggerDelay = 50, // ms between each child
  animation = 'fade-in-up',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'scale-in': 'animate-scale-in',
  };

  return (
    <div ref={containerRef} className={className}>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          className={`
            ${isVisible && !reducedMotion ? animationClasses[animation] : ''}
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `.trim()}
          style={{
            animationDelay: reducedMotion ? '0ms' : `${index * staggerDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      )) : children}
    </div>
  );
};
