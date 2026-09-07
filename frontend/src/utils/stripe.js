// Stripe service module
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe publishable key from environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Singleton Stripe instance
let stripePromise = null;

/**
 * Get or initialize Stripe instance
 * @returns {Promise<Stripe|null>} Stripe instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    if (!stripePublishableKey) {
      console.error('Stripe publishable key is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in .env');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

/**
 * Create a Payment Intent on the backend
 * @param {Object} params - Payment parameters
 * @param {string} params.clothing_id - ID of the clothing item
 * @param {number} params.amount - Amount in cents (e.g., 4999 for $49.99)
 * @param {string} params.buyer_user_id - ID of the buyer
 * @returns {Promise<Object>} Payment Intent response with client_secret and payment_id
 */
export const createPaymentIntent = async ({ clothing_id, amount, buyer_user_id }) => {
  try {
    const API_BASE_URL = 'http://localhost:8000/api/v1';
    
    const response = await fetch(`${API_BASE_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clothing_id,
        amount,
        buyer_user_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to create payment intent: ${response.status}`);
    }

    const data = await response.json();
    return data; // Should contain { payment_id, client_secret, amount, ... }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Get payment details
 * @param {string} payment_id - Payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPayment = async (payment_id) => {
  try {
    const API_BASE_URL = 'http://localhost:8000/api/v1';
    
    const response = await fetch(`${API_BASE_URL}/payment/${payment_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to get payment: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

/**
 * Confirm a card payment using Stripe.js
 * @param {string} clientSecret - Payment Intent client secret
 * @param {Object} cardElement - Stripe CardElement instance
 * @param {Object} billingDetails - Billing information
 * @returns {Promise<Object>} Confirmation result
 */
export const confirmCardPayment = async (clientSecret, cardElement, billingDetails) => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: billingDetails,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  } catch (error) {
    console.error('Error confirming card payment:', error);
    throw error;
  }
};

/**
 * Purchase a clothing item
 * @param {string} clothing_id - ID of the clothing item to purchase
 * @param {string} buyer_user_id - ID of the buyer
 * @returns {Promise<Object>} Purchase response
 */
export const purchaseClothingItem = async (clothing_id, buyer_user_id) => {
  try {
    const API_BASE_URL = 'http://localhost:8000/api/v1';
    
    const response = await fetch(`${API_BASE_URL}/clothing/${clothing_id}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyer_user_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to purchase item: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error purchasing clothing item:', error);
    throw error;
  }
};

export default {
  getStripe,
  createPaymentIntent,
  getPayment,
  confirmCardPayment,
  purchaseClothingItem,
};
