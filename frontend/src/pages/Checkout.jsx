import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartAPI } from '../utils/api';
import ShipStationService from '../utils/shipstation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCheckoutAutofill, getStripeTestCardDisplay, isDevAutofillEnabled } from '../dev/autofill';
import { addBuyerNotification, addSellerNotification } from '../utils/notifications';
import './Checkout.css';

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ccircle cx='40' cy='32' r='12' fill='%23d1d5db'/%3E%3Crect x='18' y='50' width='44' height='10' rx='5' fill='%23d1d5db'/%3E%3C/svg%3E";

const STATE_SALES_TAX_RATES = {
  AL: 0.04,
  AK: 0,
  AZ: 0.056,
  AR: 0.065,
  CA: 0.0725,
  CO: 0.029,
  CT: 0.0635,
  DE: 0,
  FL: 0.06,
  GA: 0.04,
  HI: 0.04,
  ID: 0.06,
  IL: 0.0625,
  IN: 0.07,
  IA: 0.06,
  KS: 0.065,
  KY: 0.06,
  LA: 0.0445,
  ME: 0.055,
  MD: 0.06,
  MA: 0.0625,
  MI: 0.06,
  MN: 0.06875,
  MS: 0.07,
  MO: 0.04225,
  MT: 0,
  NE: 0.055,
  NV: 0.0685,
  NH: 0,
  NJ: 0.06625,
  NM: 0.05125,
  NY: 0.04,
  NC: 0.0475,
  ND: 0.05,
  OH: 0.0575,
  OK: 0.045,
  OR: 0,
  PA: 0.06,
  RI: 0.07,
  SC: 0.06,
  SD: 0.045,
  TN: 0.07,
  TX: 0.0625,
  UT: 0.061,
  VT: 0.06,
  VA: 0.053,
  WA: 0.065,
  WV: 0.06,
  WI: 0.05,
  WY: 0.04,
  DC: 0.06,
};

const DEFAULT_TAX_RATE = 0;

// Buyer-facing fee pass-through reflects real processor costs.
const STRIPE_PERCENT_FEE = 0.029;
const STRIPE_FIXED_FEE = 0.3;
const SHIPSTATION_PER_ORDER_AVG_FEE = 0.2;

const roundMoney = (value) => Math.round(value * 100) / 100;

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' },
  },
};

function StripeCardInput({ onReady, onChange }) {
  const stripe = useStripe();
  const elements = useElements();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  useEffect(() => {
    if (stripe && elements) onReadyRef.current(stripe, elements);
  }, [stripe, elements]);

  return (
    <div className="card-element-container">
      <CardElement options={CARD_ELEMENT_OPTIONS} onChange={onChange} />
    </div>
  );
}

const Checkout = () => {
  const checkoutAutofill = getCheckoutAutofill();
  const stripeTestCard = getStripeTestCardDisplay();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, fetchCart, removeFromCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Synchronous guard — prevents duplicate submissions even on fast double-clicks
  const submittingRef = useRef(false);

  // Checkout/payment state
  const [checkoutData, setCheckoutData] = useState(null); // response from CartAPI.checkout()
  const [stripeReady, setStripeReady] = useState(false);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Shipping state
  const [shipping, setShipping] = useState(checkoutAutofill.shipping);
  const [verifiedAddress, setVerifiedAddress] = useState(null);
  const [parcelInfo, setParcelInfo] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [shipmentId, setShipmentId] = useState(null);
  const [shippingError, setShippingError] = useState(null);
  const [addressFormData, setAddressFormData] = useState(checkoutAutofill.addressFormData);
  const [suggestedAddress, setSuggestedAddress] = useState(null);
  const [verifyingAddress, setVerifyingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState("oz");
  const [showDimensions, setShowDimensions] = useState(false);
  const [packageLength, setPackageLength] = useState("");
  const [packageWidth, setPackageWidth] = useState("");
  const [packageHeight, setPackageHeight] = useState("");
  const [packageError, setPackageError] = useState(null);
  const [rates, setRates] = useState([]);
  const [calculatingRates, setCalculatingRates] = useState(false);
  const [ratesError, setRatesError] = useState(null);

  // Card verification
  const [cardholderName, setCardholderName] = useState(checkoutAutofill.cardholderName);
  const [verifyingCard, setVerifyingCard] = useState(false);
  const [cardVerified, setCardVerified] = useState(false);
  const [cardVerificationError, setCardVerificationError] = useState(null);
  const [verifiedCardDetails, setVerifiedCardDetails] = useState(null);

  const handleStripeReady = useCallback((s, el) => {
    stripeRef.current = s;
    elementsRef.current = el;
    setStripeReady(true);
  }, []);

  const progressPercent = ((step - 1) / 4) * 100;
  const subtotalAmount = Number(cartTotal) || 0;
  const subtotal = subtotalAmount.toFixed(2);
  const shippingCost = Number.isFinite(parseFloat(selectedRate?.rate)) ? parseFloat(selectedRate.rate) : 0;
  const normalizedShippingState = (shipping?.state || verifiedAddress?.state || "").trim().toUpperCase();
  const stateTaxRate = STATE_SALES_TAX_RATES[normalizedShippingState] ?? DEFAULT_TAX_RATE;
  const taxAmount = roundMoney(subtotalAmount * stateTaxRate);
  const shipstationFeeAmount = roundMoney(shippingCost);
  const shipstationPerOrderAvgFeeAmount = roundMoney(SHIPSTATION_PER_ORDER_AVG_FEE);
  const preStripeTotal = roundMoney(subtotalAmount + taxAmount + shipstationFeeAmount + shipstationPerOrderAvgFeeAmount);
  const stripeFeeAmount = roundMoney((preStripeTotal * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE);
  const orderTotal = roundMoney(preStripeTotal + stripeFeeAmount).toFixed(2);

  const formatFullAddress = (address) => {
    if (!address) return "";
    const cityStateZip = [address.city, address.state, address.zip].filter(Boolean).join(" ").trim();
    return [
      address.name,
      address.street,
      cityStateZip,
      address.country,
    ].filter(Boolean).join(", ");
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Fetch cart from server on mount + validate
  useEffect(() => {
    const init = async () => {
      await fetchCart();
      setValidating(true);
      try {
        const validation = await CartAPI.validateCart();
        if (!validation.valid) {
          setValidationErrors(validation.items.filter(i => !i.available));
        } else {
          setValidationErrors([]);
        }
      } catch (err) {
        console.error('Cart validation failed:', err);
      } finally {
        setValidating(false);
      }
    }
    if (isAuthenticated) init();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-validate when cart changes (e.g., after removing an item)
  useEffect(() => {
    const validateAvailability = async () => {
      setValidating(true);
      try {
        const validation = await CartAPI.validateCart();
        if (!validation.valid) {
          setValidationErrors(validation.items.filter(i => !i.available));
        } else {
          setValidationErrors([]);
        }
      } catch (err) {
        console.error('Cart validation failed:', err);
      } finally {
        setValidating(false);
      }
    };
    if (cart && cart.length >= 0) {
      validateAvailability();
    }
  }, [cart]);



  // Auto-calc shipping rates
  useEffect(() => {
    if (verifiedAddress && parcelInfo) {
      const calc = async () => {
        setCalculatingRates(true); setRatesError(null); setRates([]);
        try {
          const fromAddr = { name: "Conscious Couture", street: "123 Fashion St", city: "New York", state: "NY", zip: "10001", country: "US" };
          const rd = await ShipStationService.calculateRates({ toAddress: verifiedAddress, fromAddress: fromAddr, parcel: parcelInfo });
          setRates(rd.rates || rd);
          if (rd.shipment_id) setShipmentId(rd.shipment_id);
          if (rd.rates?.length > 0) setSelectedRate(rd.rates.reduce((p, c) => parseFloat(p.rate) < parseFloat(c.rate) ? p : c));
        } catch (err) { setRatesError(err.message); setShippingError(err.message); }
        finally { setCalculatingRates(false); }
      };
      calc();
    }
  }, [verifiedAddress, parcelInfo]);

  // ── Remove from server-side cart ──
  const handleRemoveItem = async (clothingId) => {
    try { await removeFromCart(clothingId); } catch (err) { console.error(err); }
  };

  // ── Card verification ──
  const handleCardVerification = async () => {
    const s = stripeRef.current;
    const el = elementsRef.current;
    if (!s || !el) { setCardVerificationError('Card form not ready'); return; }
    const card = el.getElement(CardElement);
    if (!card) { setCardVerificationError('Card not ready'); return; }
    setVerifyingCard(true); setCardVerificationError(null);
    try {
      const { error, paymentMethod } = await s.createPaymentMethod({ type: 'card', card, billing_details: { name: cardholderName || shipping.name || 'Cardholder' } });
      if (error) {
        setCardVerified(false);
        setCardVerificationError(error.message);
        setVerifiedCardDetails(null);
      } else {
        setCardVerified(true);
        setVerifiedCardDetails({
          brand: paymentMethod?.card?.brand || 'card',
          last4: paymentMethod?.card?.last4 || '****',
          expMonth: paymentMethod?.card?.exp_month,
          expYear: paymentMethod?.card?.exp_year,
        });
      }
    } catch (e) {
      setCardVerified(false);
      setCardVerificationError(e.message);
      setVerifiedCardDetails(null);
    }
    finally { setVerifyingCard(false); }
  };

  // ── Full purchase flow ──
  const handlePaymentSubmit = async () => {
    // Synchronous guard — blocks re-entry before React state can re-render
    if (submittingRef.current) return;
    submittingRef.current = true;

    const s = stripeRef.current;
    const el = elementsRef.current;
    if (!s) { submittingRef.current = false; setPaymentError('Stripe not loaded'); return; }
    if (!el) { submittingRef.current = false; setPaymentError('Card form not ready.'); return; }
    if (!cardVerified) { submittingRef.current = false; setPaymentError('Please verify your card before paying.'); return; }
    const card = el.getElement(CardElement);
    if (!card) { submittingRef.current = false; setPaymentError('Card form not ready.'); return; }
    setPaymentProcessing(true); setPaymentError(null);

    try {
      // 1) Call server to create Sales + PaymentIntents (no immediate charge)
      const checkout = await CartAPI.checkout();
      setCheckoutData(checkout);

      // 2) Prepare seller approval requests; payment is charged only on seller acceptance
      const pendingSaleIds = [];
      const pendingOrderIds = [];

      for (const item of checkout.items) {
        const { error: pmError, paymentMethod } = await s.createPaymentMethod({
          type: 'card',
          card,
          billing_details: {
            name: cardholderName || shipping.name || 'Cardholder',
            address: { line1: shipping.address, city: shipping.city, state: shipping.state, postal_code: shipping.zip },
          },
        });

        if (pmError || !paymentMethod?.id) {
          setPaymentError(pmError?.message || 'Unable to prepare payment method.');
          setPaymentProcessing(false);
          return;
        }

        // Generate per-item shipment/rate so each seller gets a unique ShipEngine rate_id
        let itemShipmentId = shipmentId || null;
        let itemRateId = selectedRate?.id || null;
        try {
          const fromAddr = { name: "Conscious Couture", street: "123 Fashion St", city: "New York", state: "NY", zip: "10001", country: "US" };
          const rd = await ShipStationService.calculateRates({ toAddress: verifiedAddress, fromAddress: fromAddr, parcel: parcelInfo });
          if (rd.shipment_id) itemShipmentId = rd.shipment_id;
          if (rd.rates?.length > 0) {
            const cheapest = rd.rates.reduce((p, c) => parseFloat(p.rate) < parseFloat(c.rate) ? p : c);
            itemRateId = cheapest.id;
          }
        } catch (rateErr) {
          console.warn('Per-item rate calculation failed, using checkout rate:', rateErr);
        }

        pendingSaleIds.push(item.sale_id);
        pendingOrderIds.push(item.order_id);

        const cartItem = cart.find((c) => c.clothing_id === item.clothing_id);
        addSellerNotification({
          type: 'seller_order_request',
          title: 'New Order Request',
          message: 'A buyer placed an order request. Accept to charge the buyer and finalize.',
          preview: `${cartItem?.clothing_type || cartItem?.name || 'Item'} • $${item.amount}`,
          status: 'pending',
          sellerUserId: item.seller_id,
          buyerUserId: user?.id,
          buyerName: shipping.name,
          orderTotal: item.amount,
          orderId: item.order_id,
          saleId: item.sale_id,
          clientSecret: item.client_secret,
          paymentMethodId: paymentMethod.id,
          shipmentId: itemShipmentId,
          rateId: itemRateId,
          items: [{
            clothing_id: item.clothing_id,
            name: cartItem?.clothing_type || cartItem?.name || 'Item',
            size: cartItem?.size || '',
            price: item.amount,
          }],
          shipping: {
            name: shipping.name,
            address: shipping.address,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
          },
        });
      }

      // 3) Buyer receives pending notice; actual charge happens on seller acceptance

      const purchasedItems = cart.map((item) => ({
        name: item.clothing_type || item.name || 'Item',
        size: item.size || '',
        price: Number(item.price || 0).toFixed(2),
      }));

      addBuyerNotification({
        type: 'order_placed',
        title: 'Order Placed Successfully',
        message: 'Your order request is pending seller acceptance. You will be charged after acceptance.',
        preview: `${purchasedItems.length} item(s) • Total $${orderTotal}`,
        orderDate: new Date().toISOString(),
        status: 'pending',
        targetUserId: user?.id,
        orderTotal,
        items: purchasedItems,
        shipping: {
          name: shipping.name,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
        },
        saleIds: pendingSaleIds,
      });

      // 4) Clear buyer cart after order request submission
      try {
        await CartAPI.clearCart();
        await fetchCart();
      } catch (clearErr) {
        console.warn('Cart clear failed:', clearErr);
      }

      setPaymentSuccess(true);
      setPaymentProcessing(false);
      setStep(5);
      // submittingRef stays true — order is done, no more submissions allowed

    } catch (error) {
      console.error("Checkout payment error:", error);
      setPaymentError(error.message || "Payment failed. Please try again.");
      setPaymentProcessing(false);
      submittingRef.current = false; // Allow retry only on genuine failure
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Step Indicator */}
        <div className="step-indicator" style={{ '--progress': `${progressPercent}%` }}>
          {["Cart", "Shipping", "Payment", "Summary", "Confirmation"].map((label, i) => (
            <div key={i} className={`step-item ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}>
              <span className="step-number">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: CART ── */}
        {step === 1 && (
          <div className="checkout-card">
            <h2 className="checkout-title">Your Cart</h2>

            {validating && <p style={{ textAlign: 'center', color: '#666', padding: 20 }}>Checking item availability…</p>}

            {validationErrors.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Some items are no longer available:</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Please remove them before continuing.</p>
              </div>
            )}

            <div className="cart-layout">
              <div className="cart-items-section">
                {cart.length === 0 && <p className="empty-cart-message">Your cart is empty.</p>}
                {cart.map((item) => (
                  <div key={item.clothing_id} className="cart-item">
                    <img src={item.image || FALLBACK_IMAGE} alt={item.clothing_type || item.name}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '1px solid #eee', flexShrink: 0 }}
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.clothing_type || 'Item'}</h3>
                      <p className="cart-item-size">Brand: {item.brand || 'Unknown brand'}</p>
                      <p className="cart-item-size">Size: {item.size}</p>
                      <p className="cart-item-size">From: {item.owner_name || 'Unknown owner'}</p>
                      <p className="cart-item-price">${(item.price || 0).toFixed(2)}</p>
                      {!item.available && <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>No longer available</p>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.clothing_id)} className="btn btn-remove">Remove</button>
                  </div>
                ))}
              </div>
              <div className="order-summary">
                <h3 className="order-summary-title">Order Summary</h3>
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">${subtotal}</span>
                </div>
              </div>
            </div>

            <div className="checkout-actions">
              <button onClick={() => navigate("/")} className="btn btn-secondary">Return to Home</button>
              <button disabled={cart.length === 0 || validationErrors.length > 0} onClick={() => setStep(2)} className="btn btn-primary">Continue to Shipping</button>
            </div>
          </div>
        )}

        {/* ── Step 2: SHIPPING (kept identical to original) ── */}
        {step === 2 && (
          <div className="checkout-card">
            {!verifiedAddress && (
              <>
                <h2 className="checkout-title">Shipping Address</h2>
                <form className="shipping-form" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addressFormData.name || !addressFormData.street || !addressFormData.city || !addressFormData.state || !addressFormData.zip) { setAddressError("Please fill in all required fields"); return; }
                  setVerifyingAddress(true); setAddressError(null);
                  try { const v = await ShipStationService.verifyAddress(addressFormData); setSuggestedAddress(v); }
                  catch (err) { setAddressError(err.message); setShippingError(err.message); }
                  finally { setVerifyingAddress(false); }
                }}>
                  <div className="form-group"><label htmlFor="name" className="form-label">Full Name *</label><input type="text" id="name" value={addressFormData.name} onChange={e => { setAddressFormData(p => ({ ...p, name: e.target.value })); setAddressError(null); }} placeholder="John Doe" className="form-input" disabled={verifyingAddress} required /></div>
                  <div className="form-group"><label htmlFor="street" className="form-label">Street Address *</label><input type="text" id="street" value={addressFormData.street} onChange={e => { setAddressFormData(p => ({ ...p, street: e.target.value })); setAddressError(null); }} placeholder="123 Main St" className="form-input" disabled={verifyingAddress} required /></div>
                  <div className="form-row">
                    <div className="form-group"><label htmlFor="city" className="form-label">City *</label><input type="text" id="city" value={addressFormData.city} onChange={e => { setAddressFormData(p => ({ ...p, city: e.target.value })); setAddressError(null); }} placeholder="New York" className="form-input" disabled={verifyingAddress} required /></div>
                    <div className="form-group"><label htmlFor="state" className="form-label">State *</label><input type="text" id="state" value={addressFormData.state} onChange={e => { setAddressFormData(p => ({ ...p, state: e.target.value })); setAddressError(null); }} placeholder="NY" maxLength="2" className="form-input" disabled={verifyingAddress} required /></div>
                    <div className="form-group"><label htmlFor="zip" className="form-label">ZIP Code *</label><input type="text" id="zip" value={addressFormData.zip} onChange={e => { setAddressFormData(p => ({ ...p, zip: e.target.value })); setAddressError(null); }} placeholder="10001" className="form-input" disabled={verifyingAddress} required /></div>
                  </div>
                  {addressError && <div className="form-error">{addressError}</div>}
                  <div className="checkout-actions">
                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">Back to Cart</button>
                    <button type="submit" className="btn btn-primary" disabled={verifyingAddress}>{verifyingAddress ? "Verifying Address..." : "Verify Address"}</button>
                  </div>
                </form>
                {suggestedAddress && suggestedAddress.verified && (
                  <div className="suggested-address-container">
                    <h3 className="suggested-address-title">✓ Address Verified</h3>
                    {suggestedAddress.message && (
                      <p className="text-sm text-gray-600 mt-1">{suggestedAddress.message}</p>
                    )}

                    <div className="address-comparison">
                      <div className="address-block">
                        <h4>Your Address</h4>
                        <p>{addressFormData.name}</p>
                        <p>{addressFormData.street}</p>
                        <p>{addressFormData.city}, {addressFormData.state} {addressFormData.zip}</p>
                      </div>

                      {suggestedAddress.standardized && (
                        <div className="address-block">
                          <h4>Suggested Address</h4>
                          <p>{suggestedAddress.standardized.name}</p>
                          <p>{suggestedAddress.standardized.street}</p>
                          <p>{suggestedAddress.standardized.city}, {suggestedAddress.standardized.state} {suggestedAddress.standardized.zip}</p>
                        </div>
                      )}
                    </div>

                    <div className="button-group">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          const addressToUse = suggestedAddress.standardized || addressFormData;
                          setVerifiedAddress(addressToUse);
                          setShipping({
                            name: addressToUse.name,
                            address: addressToUse.street,
                            city: addressToUse.city,
                            state: addressToUse.state,
                            zip: addressToUse.zip
                          });
                          // Auto-set default parcel info (1 lb for typical clothing item)
                          setParcelInfo({ weight: 16 }); // 1 lb = 16 oz
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
                {suggestedAddress && !suggestedAddress.verified && (
                  <div className="address-warning">
                    <p>
                      ⚠️ {suggestedAddress.message ||
                        "Address could not be verified."}
                    </p>
                    {Array.isArray(suggestedAddress.facts) && suggestedAddress.facts.length > 0 && (
                      <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                        {suggestedAddress.facts.map((fact, index) => (
                          <li key={`${fact}-${index}`}>{fact}</li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setVerifiedAddress(addressFormData);
                        setShipping({
                          name: addressFormData.name,
                          address: addressFormData.street,
                          city: addressFormData.city,
                          state: addressFormData.state,
                          zip: addressFormData.zip
                        });
                        // Auto-set default parcel info (1 lb for typical clothing item)
                        setParcelInfo({ weight: 16 }); // 1 lb = 16 oz
                      }}
                    >
                      Continue Anyway
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Sub-step: Select Rates */}
            {verifiedAddress && parcelInfo && calculatingRates && (
              <div className="shipping-rates-container">
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Calculating shipping rates...</p>
                </div>
              </div>
            )}

            {verifiedAddress && parcelInfo && !calculatingRates && (
              <div className="shipping-rates-container">
                <div className="rates-header">
                  <h2>Shipping Method</h2>
                  <p className="delivery-info">
                    Shipping to: {formatFullAddress(verifiedAddress)}
                  </p>
                  <p className="delivery-info">
                    UPS is preselected by default and cannot be changed.
                  </p>
                </div>

                {ratesError && <div className="error-banner">{ratesError}</div>}

                {rates.length === 0 ? (
                  <div className="no-rates">
                    <p>No shipping rates available. Please verify your shipping address and try again.</p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setParcelInfo(null);
                        setVerifiedAddress(null);
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedRate && (
                      <div className="rates-list">
                        <div className="rate-option selected">
                          <div className="rate-option-content">
                            <div className="rate-details-main">
                              <div className="detail-item">
                                <span className="detail-label">Carrier:</span>
                                <span className="detail-value">{(selectedRate.carrier || 'UPS').toUpperCase()}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Service:</span>
                                <span className="detail-value">{selectedRate.service || 'UPS Ground'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Est. Delivery: </span>
                                <span className="detail-value">
                                  {selectedRate.delivery_days || "5 business days"}
                                </span>
                              </div>
                              {selectedRate.est_delivery_date && (
                                <div className="detail-item">
                                  <span className="detail-label">By:</span>
                                  <span className="detail-value">
                                    {new Date(selectedRate.est_delivery_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="shipping-cost-section">
                              <span className="rate-price">
                                Shipping Cost: {ShipStationService.formatPrice(parseFloat(selectedRate.rate || 0) * 100)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

<div className="rates-footer">
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setParcelInfo(null);
                          setVerifiedAddress(null);
                        }}
                      >
                        Back
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (!selectedRate) {
                            setRatesError("UPS shipping service is currently unavailable");
                            return;
                          }
                          setRatesError(null);
                          setStep(3);
                        }}
                        disabled={!selectedRate}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {shippingError && <div className="error-banner">{shippingError}</div>}
          </div>
        )}

        {/* ── Step 3: PAYMENT ── */}
        {(step === 3 || step === 4) && (
          <div className="checkout-card" style={{ display: step === 3 ? 'block' : 'none' }}>
            <h2 className="checkout-title">Payment Information</h2>
            <div className="payment-form">
              {isDevAutofillEnabled && stripeTestCard && (
                <div className="test-card-note">
                  <p className="test-card-note-title">Dev mode: address and name pre-filled.</p>
                  <p>Stripe card fields cannot be autofilled. Use card <strong>{stripeTestCard.cardNumber}</strong>, expiry <strong>{stripeTestCard.expiry}</strong>, CVC <strong>{stripeTestCard.cvc}</strong>, ZIP <strong>{stripeTestCard.zip}</strong>.</p>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="cardholderName" className="form-label">Cardholder Name *</label>
                <input type="text" id="cardholderName" value={cardholderName} onChange={e => { setCardholderName(e.target.value); setCardVerified(false); setCardVerificationError(null); setVerifiedCardDetails(null); }} placeholder="John Doe" className="form-input" disabled={verifyingCard} required />
              </div>
              <div className="form-group">
                <label className="form-label">Card Details *</label>
                <Elements stripe={stripePromise}>
                  <StripeCardInput
                    onReady={handleStripeReady}
                    onChange={(evt) => { setCardVerified(false); setCardVerificationError(evt.error ? evt.error.message : null); setVerifiedCardDetails(null); }}
                  />
                </Elements>
                {cardVerified && (
                  <div className="card-verified-inline">✓ Card verified</div>
                )}
                {cardVerificationError && (
                  <div className="form-error">{cardVerificationError}</div>
                )}
              </div>
              <div className="price-breakdown">
                <h3 className="price-breakdown-title">Price Breakdown</h3>
                <div className="price-breakdown-row">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="price-breakdown-row">
                  <span>Sales Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="price-breakdown-row">
                  <span>Transaction Fee</span>
                  <span>${stripeFeeAmount.toFixed(2)}</span>
                </div>
                <div className="price-breakdown-row">
                  <span>Shipping</span>
                  <span>${shipstationFeeAmount.toFixed(2)}</span>
                </div>
                <div className="price-breakdown-row">
                  <span>ShipStation Fee</span>
                  <span>${shipstationPerOrderAvgFeeAmount.toFixed(2)}</span>
                </div>
                <div className="price-breakdown-row total">
                  <span>Total</span>
                  <span>${orderTotal}</span>
                </div>
              </div>
              {paymentError && <div className="form-error">{paymentError}</div>}
              {!cardVerified ? (
                <div className="checkout-actions">
                  <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
                  <button type="button" onClick={handleCardVerification} disabled={verifyingCard || !stripeReady} className="btn btn-primary">
                    {verifyingCard ? "Verifying..." : "Verify Card"}
                  </button>
                </div>
              ) : (
                <div className="checkout-actions">
                  <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
                  <button onClick={() => setStep(4)} className="btn btn-primary">Continue to Review</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: SUMMARY ── */}
        {step === 4 && (
          <div className="checkout-card">
            <h2 className="checkout-title">Review Your Order</h2>

            {/* Items */}
            <div className="review-section">
              <h3 className="review-section-title">Items <span className="review-section-count">({cartCount})</span></h3>
              <div className="review-items">
                {cart.map(item => (
                  <div key={item.clothing_id} className="review-item">
                    <img
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.clothing_type || item.name}
                      className="review-item-img"
                      onError={e => { e.target.src = FALLBACK_IMAGE; }}
                    />
                    <div className="review-item-info">
                      <p className="review-item-name">{item.clothing_type || 'Item'}</p>
                      <p className="review-item-meta">Brand: {item.brand || 'Unknown'}</p>
                      <p className="review-item-meta">Size: {item.size}</p>
                      <p className="review-item-meta">From: {item.owner_name || 'Unknown owner'}</p>
                    </div>
                    <p className="review-item-price">${(item.price || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="review-section">
              <h3 className="review-section-title">Price Breakdown</h3>
              <div className="review-breakdown">
                <div className="review-breakdown-row">
                  <span>Subtotal</span><span>${subtotal}</span>
                </div>
                <div className="review-breakdown-row">
                  <span>Sales Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="review-breakdown-row">
                  <span>Transaction Fee</span><span>${stripeFeeAmount.toFixed(2)}</span>
                </div>
                <div className="review-breakdown-row">
                  <span>Shipping</span><span>${shipstationFeeAmount.toFixed(2)}</span>
                </div>
                <div className="review-breakdown-row">
                  <span>ShipStation Fee</span><span>${shipstationPerOrderAvgFeeAmount.toFixed(2)}</span>
                </div>
                <div className="review-breakdown-row review-breakdown-total">
                  <span>Total</span><span>${orderTotal}</span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="review-section">
              <h3 className="review-section-title">Shipping Information</h3>
              <div className="review-shipping">
                <p className="review-shipping-name">{shipping.name}</p>
                <p className="review-shipping-line">{shipping.address}</p>
                <p className="review-shipping-line">{[shipping.city, shipping.state, shipping.zip].filter(Boolean).join(', ')}</p>
                {selectedRate && (
                  <p className="review-shipping-carrier">{selectedRate.carrier} — {selectedRate.service}</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="review-section">
              <h3 className="review-section-title">Payment Method</h3>
              {verifiedCardDetails ? (
                <div className="review-payment">
                  <p className="review-payment-main">
                    {String(verifiedCardDetails.brand).toUpperCase()} •••• {verifiedCardDetails.last4}
                  </p>
                  <p className="review-payment-meta">
                    Expires {String(verifiedCardDetails.expMonth || '').padStart(2, '0')}/{String(verifiedCardDetails.expYear || '').slice(-2)}
                  </p>
                  <p className="review-payment-meta">
                    Cardholder: {cardholderName || shipping.name || 'Cardholder'}
                  </p>
                  <p className="review-payment-verified">Verified</p>
                </div>
              ) : (
                <div className="form-error">No verified payment method found. Go back and verify your card.</div>
              )}
            </div>

            {paymentError && <div className="form-error">{paymentError}</div>}
            <div className="checkout-actions">
              <button onClick={() => setStep(3)} className="btn btn-secondary">Back</button>
              <button onClick={handlePaymentSubmit} disabled={paymentProcessing || paymentSuccess || !cardVerified} className="btn btn-primary">
                {paymentProcessing ? "Processing..." : `Order`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: CONFIRMATION ── */}
        {step === 5 && (
          <div className="checkout-card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2 className="checkout-title">Order Placed!</h2>
            <p>Your order has been placed successfully.</p>
            <p>You will be notified when your order is accepted.</p>
            <button onClick={() => navigate("/")} className="btn btn-primary" style={{ marginTop: '20px' }}>
              Return to Shop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;