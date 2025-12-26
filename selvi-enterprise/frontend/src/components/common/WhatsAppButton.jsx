import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppGeneralLink } from '../../config/businessConfig';
import './WhatsAppButton.css';

/**
 * WhatsApp Floating Button Component
 * Opens WhatsApp chat with pre-filled message
 * Works on both mobile (WhatsApp app) and desktop (WhatsApp Web)
 */
const WhatsAppButton = ({ message = null, className = '' }) => {
  const handleClick = () => {
    const whatsappUrl = message 
      ? `https://wa.me/916380470432?text=${encodeURIComponent(message)}`
      : getWhatsAppGeneralLink();
    
    // Open in new tab - this will open WhatsApp app on mobile, WhatsApp Web on desktop
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button 
      onClick={handleClick}
      className={`whatsapp-float-btn ${className}`}
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <FaWhatsapp size={28} />
      <span className="whatsapp-tooltip">Chat with us</span>
    </button>
  );
};

/**
 * WhatsApp Link Button (inline use)
 */
export const WhatsAppLink = ({ 
  message = null, 
  children = 'Chat on WhatsApp',
  className = '',
  showIcon = true 
}) => {
  const whatsappUrl = message 
    ? `https://wa.me/916380470432?text=${encodeURIComponent(message)}`
    : getWhatsAppGeneralLink();

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-link ${className}`}
    >
      {showIcon && <FaWhatsapp />}
      {children}
    </a>
  );
};

/**
 * WhatsApp Chat Button (styled button)
 */
export const WhatsAppChatButton = ({ 
  message = null, 
  children = 'Chat on WhatsApp',
  className = '',
  variant = 'primary' // primary, outline
}) => {
  const whatsappUrl = message 
    ? `https://wa.me/916380470432?text=${encodeURIComponent(message)}`
    : getWhatsAppGeneralLink();

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-btn whatsapp-btn-${variant} ${className}`}
    >
      <FaWhatsapp size={20} />
      {children}
    </a>
  );
};

export default WhatsAppButton;
