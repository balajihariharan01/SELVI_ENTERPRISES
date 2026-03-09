/**
 * ============================================
 * CENTRALIZED LOGO COMPONENT
 * ============================================
 * Single source of truth for logo usage across
 * the entire Selvi Enterprise application.
 * 
 * Usage:
 * - Import: import Logo from '../components/common/Logo';
 * - Use: <Logo /> or <Logo className="h-10" />
 * 
 * Logo Path: /logo.png (from public folder)
 * ============================================
 */

import PropTypes from 'prop-types';

const Logo = ({ className = '', alt = 'Selvi Enterprise Logo' }) => (
  <img
    src="/logo.png"
    alt={alt}
    className={`select-none object-contain ${className}`}
    draggable="false"
  />
);

Logo.propTypes = {
  className: PropTypes.string,
  alt: PropTypes.string
};

export default Logo;
