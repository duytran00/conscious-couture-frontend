import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClothingAPI from '../utils/api';

/**
 * SellerOnboarding page handles two flows:
 *  1. Initial redirect: starts Stripe Connect Express onboarding
 *  2. Return URL: after Stripe redirects back, checks account status
 */
const SellerOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | redirecting | success | incomplete | error
  const [error, setError] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);

  const isReturn = searchParams.get('return') === 'true';
  const isRefresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isReturn) {
      // Seller returned from Stripe onboarding — check status
      checkAccountStatus();
    } else if (isRefresh) {
      // Link expired — restart onboarding
      startOnboarding();
    } else {
      // Fresh start — begin onboarding
      startOnboarding();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const startOnboarding = async () => {
    setStatus('redirecting');
    try {
      const result = await ClothingAPI.createStripeConnectOnboarding({
        refresh_url: `${window.location.origin}/seller-onboarding?refresh=true`,
        return_url: `${window.location.origin}/seller-onboarding?return=true`,
      });

      // Redirect to Stripe-hosted onboarding
      window.location.href = result.onboarding_url;
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const checkAccountStatus = async () => {
    try {
      const result = await ClothingAPI.getStripeAccountStatus();
      setAccountStatus(result);

      if (result?.onboarding_complete) {
        setStatus('success');
      } else {
        setStatus('incomplete');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  if (status === 'loading' || status === 'redirecting') {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Setting up your seller account...
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15 }}>
          You'll be redirected to Stripe to complete your account setup.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
          Seller Account Ready!
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
          Your Stripe account is set up. You can now receive payments for items you sell.
          Stripe will handle payouts to your bank account according to your payout schedule.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard?tab=seller')}
            style={{
              padding: '12px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Go to Seller Dashboard
          </button>
          <button
            onClick={() => navigate('/upload')}
            style={{
              padding: '12px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
              background: '#fff', color: '#059669', border: '2px solid #10b981', cursor: 'pointer',
            }}
          >
            List an Item
          </button>
        </div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
          Onboarding Incomplete
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
          Your Stripe account setup isn't finished yet. Please complete the remaining steps
          to start receiving payments.
        </p>
        {accountStatus && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
            <p><strong>Details submitted:</strong> {accountStatus.details_submitted ? 'Yes' : 'No'}</p>
            <p><strong>Charges enabled:</strong> {accountStatus.charges_enabled ? 'Yes' : 'No'}</p>
            <p><strong>Payouts enabled:</strong> {accountStatus.payouts_enabled ? 'Yes' : 'No'}</p>
          </div>
        )}
        <button
          onClick={startOnboarding}
          style={{
            padding: '12px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
            border: 'none', cursor: 'pointer',
          }}
        >
          Continue Onboarding
        </button>
      </div>
    );
  }

  // Error state
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
        {error || 'An error occurred during the onboarding process.'}
      </p>
      <button
        onClick={startOnboarding}
        style={{
          padding: '12px 28px', fontSize: 15, fontWeight: 600, borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
          border: 'none', cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
};

export default SellerOnboarding;
