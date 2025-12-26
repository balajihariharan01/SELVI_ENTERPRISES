import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Resets scroll position to top on every route change.
 * This ensures users always land at the top of the page
 * when navigating between routes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top smoothly on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' to avoid animation delay
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
