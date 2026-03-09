# Stripe Payment Integration Guide

This document provides instructions for setting up and testing Stripe payments in Selvi Enterprise.

## Overview

The application supports two payment methods:

1. **Cash on Delivery (COD)** - Default payment method
2. **Online Payment (Stripe)** - Credit/Debit Cards, UPI, Net Banking

## Setup Instructions

### 1. Backend Configuration

1. Copy `.env.example` to `.env` in the `backend` folder
2. Add your Stripe credentials:

```env
# Get your keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

> ⚠️ **NEVER** expose the secret key on the frontend or commit it to version control.

### 2. Frontend Configuration

1. Copy `.env.example` to `.env` in the `frontend` folder
2. Add your Stripe publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

> The publishable key is safe to expose on the frontend.

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install stripe

# Frontend
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## Testing Payments

### Test Card Numbers

Use these test card numbers in development:

| Card Number         | Description             |
| ------------------- | ----------------------- |
| 4242 4242 4242 4242 | Successful payment      |
| 4000 0000 0000 0002 | Card declined           |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Insufficient funds      |

For all test cards:

- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any 5-digit postal code

### Test UPI IDs

For UPI testing in India:

- `success@razorpay` - Successful payment
- `failure@razorpay` - Failed payment

## Webhooks (Production)

For production, configure webhooks to handle asynchronous payment updates:

### 1. Create Webhook Endpoint

In Stripe Dashboard → Developers → Webhooks:

1. Add endpoint: `https://your-domain.com/api/payments/webhook`
2. Select events:

   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

3. Copy the webhook signing secret to your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Local Testing with Stripe CLI

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the webhook signing secret shown after running the listen command.

## Payment Flow

### Checkout Flow

1. User fills shipping details
2. User selects payment method (COD or Online)
3. For Online:
   - Order is created with `paymentStatus: pending`
   - Payment Intent is created on backend
   - Stripe Elements form is displayed
   - User completes payment
   - On success, order status updates to `confirmed`, payment status to `paid`

### Order Detail - Retry Payment

Users can retry failed payments from the Order Detail page:

1. Navigate to order with pending online payment
2. Click "Pay Now" button
3. Complete the payment

## Security Features

✅ Secret key stored only on backend  
✅ Amount validation on server-side (prevents price tampering)  
✅ Payment Intent metadata includes order verification  
✅ Webhook signature verification  
✅ User authorization checks for payment operations  
✅ Idempotent webhook handling

## API Endpoints

### POST /api/payments/create-intent

Creates a payment intent for an order.

**Request:**

```json
{
  "orderId": "string",
  "amount": "number",
  "email": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### GET /api/payments/status/:orderId

Gets payment status for an order.

### POST /api/payments/confirm

Confirms payment and updates order status.

### POST /api/payments/webhook

Stripe webhook handler (raw body required).

## Troubleshooting

### Payment form not loading

- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Check browser console for errors

### "Amount mismatch" error

- Cart total may have changed. Refresh and try again.

### Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
- For local testing, use the secret from Stripe CLI

### Payment succeeds but order not updated

- Check webhook configuration
- Verify webhook endpoint is accessible
- Check server logs for errors

## Support

For Stripe-specific issues, refer to:

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
