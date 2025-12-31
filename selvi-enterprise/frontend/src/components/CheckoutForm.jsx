import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiLock, FiLoader, FiAlertCircle } from 'react-icons/fi';
import './CheckoutForm.css';

const CheckoutForm = ({ orderId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Debug log on mount and amount change
  useEffect(() => {
    console.log('=== CheckoutForm DEBUG ===');
    console.log('Received amount:', amount);
    console.log('Amount type:', typeof amount);
    console.log('OrderId:', orderId);
  }, [amount, orderId]);

  // Validate amount
  const isValidAmount = amount && typeof amount === 'number' && amount > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    if (!isValidAmount) {
      setErrorMessage('Invalid payment amount. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?orderId=${orderId}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        // Payment failed
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        if (onError) {
          onError(error);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded without redirect
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Show error state if amount is invalid
  if (!isValidAmount) {
    return (
      <div className="stripe-checkout-form">
        <div className="payment-error">
          <FiAlertCircle />
          <span>Unable to process payment. Invalid amount detected.</span>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-primary btn-lg pay-button"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <div className="payment-element-container">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'upi'],
            defaultValues: {
              billingDetails: {
                country: 'IN'
              }
            }
          }}
        />
      </div>

      {errorMessage && (
        <div className="payment-error">
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing || !isValidAmount}
        className={`btn btn-primary btn-lg pay-button ${isProcessing ? 'processing' : ''}`}
      >
        {isProcessing ? (
          <>
            <FiLoader className="spinner" />
            Processing...
          </>
        ) : (
          <>
            <FiLock />
            Pay ₹{amount.toLocaleString()}
          </>
        )}
      </button>

      <div className="payment-security-note">
        <FiLock />
        <span>Payments are secure and encrypted by Stripe</span>
      </div>
    </form>
  );
};

export default CheckoutForm;
