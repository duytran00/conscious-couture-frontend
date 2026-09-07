import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import logo from '../assets/images/conscious-couture_logo.png';
import {
  BUYER_NOTIFICATIONS_EVENT,
  getBuyerNotifications,
  getSellerNotifications,
  addBuyerNotification,
  addSellerNotification,
  markAllBuyerNotificationsRead,
  markAllSellerNotificationsRead,
  markBuyerNotificationRead,
  markSellerNotificationRead,
  updateSellerNotification,
} from '../utils/notifications';
import './Header.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CartAPI } from '../utils/api';
import ClothingAPI from '../utils/api';
import ShipStationService from '../utils/shipstation';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const Header = () => {
const navigate = useNavigate();
const { cartCount } = useCart();
const { user, isAuthenticated, logout } = useAuth();
const [showDropdown, setShowDropdown] = useState(false);

const [isNotificationOpen, setIsNotificationOpen] = useState(false);
const [notifications, setNotifications] = useState([]);
const [activeNotification, setActiveNotification] = useState(null);
const [decisionLoading, setDecisionLoading] = useState(false);
const [deliveryLoading, setDeliveryLoading] = useState(false);
const notificationMenuRef = useRef(null);
const currentUserId = user?.id ? String(user.id) : null;
const [error, setError] = useState(null);

const userName = user?.name || '';  
  
const handleLogout = () => {
  logout();
  setShowDropdown(false);
  navigate('/');
};

  const navItems = [
    { name: 'Checkout', url: '/checkout' },
    { name: 'Upload Item', url: '/upload' },
    { name: 'Sustainability', url: '/sustain' },
    { name: 'Leaderboard', url: '/leaderboard' },
  ];

  useEffect(() => {
    const refreshNotifications = () => {
      const buyerNotifications = currentUserId
        ? getBuyerNotifications().filter(
          (notification) => !notification.targetUserId || String(notification.targetUserId) === currentUserId
        )
        : [];
      const sellerNotifications = currentUserId ? getSellerNotifications(currentUserId) : [];

      const merged = [...buyerNotifications, ...sellerNotifications].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.orderDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.orderDate || 0).getTime();
        return bTime - aTime;
      });

      setNotifications(merged);
    };

    refreshNotifications();

    const closeOnOutsideClick = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener(BUYER_NOTIFICATIONS_EVENT, refreshNotifications);
    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      window.removeEventListener(BUYER_NOTIFICATIONS_EVENT, refreshNotifications);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [currentUserId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const handleToggleNotifications = () => {
    setIsNotificationOpen((current) => !current);
  };

  const handleMarkAllRead = () => {
    markAllBuyerNotificationsRead();
    if (currentUserId) {
      markAllSellerNotificationsRead(currentUserId);
    }
    const buyerNotifications = currentUserId
      ? getBuyerNotifications().filter(
        (notification) => !notification.targetUserId || String(notification.targetUserId) === currentUserId
      )
      : [];
    const sellerNotifications = currentUserId ? getSellerNotifications(currentUserId) : [];
    setNotifications([...buyerNotifications, ...sellerNotifications].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.orderDate || 0).getTime();
      const bTime = new Date(b.createdAt || b.orderDate || 0).getTime();
      return bTime - aTime;
    }));
  };

  const handleNotificationSelect = (notification) => {
    if (notification.channel === 'seller') {
      markSellerNotificationRead(notification.id);
    } else {
      markBuyerNotificationRead(notification.id);
    }
    setActiveNotification({ ...notification, read: true });
  };

  const handleSellerDecision = async (notification, action) => {
    if (!notification || notification.channel !== 'seller') return;
    if (action !== 'accept' && action !== 'reject') return;

    setDecisionLoading(true);
    try {
      if (action === 'reject') {
        updateSellerNotification(notification.id, {
          status: 'rejected',
          read: true,
          message: 'Order was rejected by the seller.',
        });
        addBuyerNotification({
          type: 'order_rejected',
          targetUserId: notification.buyerUserId,
          title: 'Order Rejected',
          message: 'Your order was rejected by the seller.',
          preview: `${notification.items?.length || 1} item(s) • Total $${notification.orderTotal || '0.00'}`,
          status: 'rejected',
          orderTotal: notification.orderTotal,
          items: notification.items,
          shipping: notification.shipping,
        });
        setActiveNotification((prev) => prev ? { ...prev, status: 'rejected', message: 'Order was rejected by the seller.', read: true } : prev);
        return;
      }
      // change item status to sold
      const sold_item = async () => {
        const clothingIds = notification.items.map(item => item.clothing_id);
        try {
          for (const id of clothingIds) {
            const status_to_sold = { status: 'sold'};
            await ClothingAPI.updateClothingItem(id, status_to_sold);
          }
        }
        catch (err) {
          setError(err.message);
        }
      }
      await sold_item();

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe is not configured.');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(notification.clientSecret, {
        payment_method: notification.paymentMethodId,
      });

      if (error || paymentIntent?.status !== 'succeeded') {
        throw new Error(error?.message || 'Payment confirmation failed.');
      }

      await CartAPI.completePurchase([notification.saleId]);

      // Purchase shipping label via backend (backend decides mock vs real and saves to DB)
      let shippingLabel = { trackingNumber: null, labelUrl: null, carrier: 'UPS', service: 'UPS Ground', mock: false, status: 'pending' };
      try {
        const labelResult = await ShipStationService.purchaseLabel({
          shipmentId: notification.shipmentId || null,
          rateId: notification.rateId || null,
          saleId: notification.saleId || null,
        });
        shippingLabel = {
          trackingNumber: labelResult.tracking_number || labelResult.tracking_code || null,
          labelUrl: labelResult.label_url || null,
          carrier: labelResult.carrier || 'UPS',
          service: labelResult.service || 'UPS Ground',
          mock: labelResult.mock || false,
          status: labelResult.status || 'label_ready',
        };
      } catch (labelErr) {
        console.error('Label purchase failed:', labelErr);
        shippingLabel.status = 'failed';
        shippingLabel.statusMessage = labelErr?.message || 'Label purchase failed';
      }

      // Update Order record to "shipped" with tracking info
      if (notification.orderId) {
        try {
          await ClothingAPI.markOrderShipped(notification.orderId, {
            trackingNumber: shippingLabel.trackingNumber,
            shippingLabelUrl: shippingLabel.labelUrl,
          });
        } catch (shipErr) {
          console.error('mark-shipped failed:', shipErr);
        }
      }

      updateSellerNotification(notification.id, {
        status: 'accepted',
        read: true,
        message: shippingLabel.status === 'label_ready'
          ? 'Order accepted, buyer charged, and shipping label is ready for shipment.'
          : `Order accepted and buyer charged. Label status: ${shippingLabel.statusMessage || shippingLabel.status}`,
        trackingNumber: shippingLabel.trackingNumber,
        labelUrl: shippingLabel.labelUrl,
        carrier: shippingLabel.carrier,
        shippingService: shippingLabel.service,
        labelMock: shippingLabel.mock,
        labelStatus: shippingLabel.status,
      });

      addBuyerNotification({
        type: 'order_accepted',
        targetUserId: notification.buyerUserId,
        title: 'Order Accepted',
        message: 'Your order was accepted by the seller and payment was processed.',
        preview: `${notification.items?.length || 1} item(s) • Total $${notification.orderTotal || '0.00'}`,
        status: 'accepted',
        orderId: notification.orderId,
        orderTotal: notification.orderTotal,
        items: notification.items,
        shipping: notification.shipping,
        trackingNumber: shippingLabel.trackingNumber,
        labelUrl: shippingLabel.labelUrl,
        carrier: shippingLabel.carrier,
        shippingService: shippingLabel.service,
        labelMock: shippingLabel.mock,
        labelStatus: shippingLabel.status,
        saleId: notification.saleId,
      });

      setActiveNotification((prev) => prev ? {
        ...prev,
        status: 'accepted',
        message: shippingLabel.status === 'completed'
          ? 'Order accepted, buyer charged, and shipping label is ready for shipment.'
          : `Order accepted and buyer charged. Label status: ${shippingLabel.statusMessage || shippingLabel.status}`,
        trackingNumber: shippingLabel.trackingNumber,
        labelUrl: shippingLabel.labelUrl,
        carrier: shippingLabel.carrier,
        shippingService: shippingLabel.service,
        labelMock: shippingLabel.mock,
        labelStatus: shippingLabel.status,
        read: true,
      } : prev);
    } catch (err) {
      const errorMessage = err?.message || 'Unable to process seller decision.';
      updateSellerNotification(notification.id, {
        status: 'failed',
        read: true,
        message: errorMessage,
      });
      setActiveNotification((prev) => prev ? { ...prev, status: 'failed', message: errorMessage, read: true } : prev);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleMarkDelivered = async (notification) => {
    if (!notification?.orderId) return;
    setDeliveryLoading(true);
    try {
      await ClothingAPI.markOrderDelivered(notification.orderId);

      // Update the buyer notification in localStorage
      const allBuyer = getBuyerNotifications();
      const updatedBuyer = allBuyer.map((n) =>
        n.id === notification.id
          ? { ...n, status: 'delivered', message: 'You confirmed delivery. Seller payout has been initiated.' }
          : n
      );
      localStorage.setItem('buyer_notifications', JSON.stringify(updatedBuyer));
      window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));

      setActiveNotification((prev) =>
        prev ? { ...prev, status: 'delivered', message: 'You confirmed delivery. Seller payout has been initiated.' } : prev
      );
    } catch (err) {
      setActiveNotification((prev) =>
        prev ? { ...prev, deliveryError: err?.message || 'Failed to confirm delivery' } : prev
      );
    } finally {
      setDeliveryLoading(false);
    }
  };

  const formatNotificationDate = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
 

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 64 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Conscious Couture" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map((item) => (
            <Link key={item.name} to={item.url} className="nav-link"
              style={{ padding: '8px 14px', fontSize: 14, fontWeight: 500, color: '#374151', borderRadius: 8, transition: 'all 0.2s', position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.name}
              {item.name === 'Checkout' && cartCount > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', lineHeight: 1, boxShadow: '0 1px 4px rgba(16,185,129,0.35)',
                }}>{cartCount}</span>
              )}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {isAuthenticated ? (
            <>
              <div className="notification-wrapper" ref={notificationMenuRef}>
                <button
                  type="button"
                  className={`notification-btn ${unreadCount > 0 ? 'is-active' : ''}`}
                  aria-label="Open notifications"
                  onClick={handleToggleNotifications}
                >
                  <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                    <path d="M9 17a3 3 0 0 0 6 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      {notifications.length > 0 && unreadCount > 0 && (
                        <button type="button" className="notification-mark-all" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      <ul className="notification-list">
                        {notifications.map((notification) => (
                          <li
                            key={notification.id}
                            className={`notification-item ${notification.read ? 'is-read' : ''}`}
                          >
                            <button
                              type="button"
                              className="notification-content"
                              onClick={() => handleNotificationSelect(notification)}
                            >
                              <span className="notification-title">{notification.title || 'Notification'}</span>
                              <span className="notification-message">{notification.preview || notification.message || 'View details'}</span>
                              <span className="notification-meta">{formatNotificationDate(notification.createdAt || notification.orderDate)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button onClick={() => setShowDropdown(!showDropdown)}
                style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
                {userName.charAt(0).toUpperCase()}
              </button>
              {showDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowDropdown(false)} />
                  <div style={{ position: 'absolute', top: 50, right: 0, zIndex: 100, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', minWidth: 220, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{userName}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Signed in</p>
                    </div>
                    {[
                      { label: 'Dashboard', to: '/dashboard' },
                      { label: 'Start Selling', to: '/seller-onboarding' },
                      { label: 'Edit Profile', to: '/edit' },
                      { label: 'Upload Item', to: '/upload' },
                      { label: 'Settings', to: '/settings' },
                    ].map((item) => (
                      <Link key={item.label} to={item.to} onClick={() => setShowDropdown(false)}
                        style={{ display: 'block', padding: '11px 16px', fontSize: 14, color: '#374151', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}>{item.label}</Link>
                    ))}
                    <div style={{ height: 1, background: '#f3f4f6' }} />
                    <button onClick={handleLogout}
                      style={{ display: 'block', width: '100%', padding: '11px 16px', fontSize: 14, color: '#dc2626', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}>Sign Out</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: '1.5px solid #10b981', color: '#059669', background: 'white' }}>Sign In</Link>
              <Link to="/signup" style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>

      {activeNotification && (
        <div className="notification-modal-overlay" onClick={() => setActiveNotification(null)}>
          <div className="notification-modal" onClick={(event) => event.stopPropagation()}>
            <div className="notification-modal-header">
              <h3>{activeNotification.title || 'Order Notification'}</h3>
              <button type="button" className="notification-modal-close" onClick={() => setActiveNotification(null)}>Close</button>
            </div>
            <p className="notification-modal-date">{formatNotificationDate(activeNotification.createdAt || activeNotification.orderDate)}</p>
            <div className="notification-status-pill">{String(activeNotification.status || 'pending').replace('_', ' ')}</div>
            <p className="notification-modal-message">{activeNotification.message || 'Your order has been received and is pending processing.'}</p>

            <div className="notification-summary-box">
              <p><strong>Total:</strong> ${activeNotification.orderTotal || '0.00'}</p>
              <p><strong>Items:</strong> {activeNotification.items?.length || 0}</p>
              {Array.isArray(activeNotification.items) && activeNotification.items.slice(0, 3).map((item, index) => (
                <p key={`${item.name || 'item'}-${index}`} className="notification-summary-item">
                  • {item.name || 'Item'}
                </p>
              ))}
              {activeNotification.shipping?.address && (
                <p><strong>Ship to:</strong> {activeNotification.shipping.address}</p>
              )}
            </div>

            {activeNotification.channel === 'seller' && activeNotification.type === 'seller_order_request' && activeNotification.status === 'pending' && (
              <div className="notification-actions">
                <button
                  type="button"
                  className="notification-action-btn reject"
                  disabled={decisionLoading}
                  onClick={() => handleSellerDecision(activeNotification, 'reject')}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="notification-action-btn accept"
                  disabled={decisionLoading}
                  onClick={() => handleSellerDecision(activeNotification, 'accept')}
                >
                  {decisionLoading ? 'Processing...' : 'Accept & Charge Buyer'}
                </button>
              </div>
            )}

            {activeNotification.channel === 'seller' && activeNotification.type === 'seller_order_request' && activeNotification.status === 'accepted' && (
              <div className="notification-summary-box" style={{ marginTop: 12, background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <p style={{ fontWeight: 700, color: '#065f46', marginBottom: 6 }}>
                  Shipping Label {activeNotification.labelMock ? '(Test Mode)' : ''} — {activeNotification.labelStatus === 'label_ready' ? 'Ready' : activeNotification.labelStatus || 'Pending'}
                </p>
                <p><strong>Tracking Number:</strong> {activeNotification.trackingNumber || 'Pending'}</p>
                <p><strong>Carrier:</strong> {activeNotification.carrier || 'UPS'} — {activeNotification.shippingService || 'UPS Ground'}</p>
                {activeNotification.labelUrl ? (
                  <a
                    href={activeNotification.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="notification-action-btn accept"
                    style={{ display: 'inline-block', marginTop: 8, textDecoration: 'none' }}
                  >
                    Download Shipping Label
                  </a>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Label URL unavailable — status: {activeNotification.labelStatus || 'unknown'}</p>
                )}
              </div>
            )}

            {activeNotification.type === 'order_accepted' && activeNotification.status === 'accepted' && (
              <div className="notification-summary-box" style={{ marginTop: 12, background: '#eff6ff', border: '1px solid #93c5fd' }}>
                <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>
                  Shipping Tracking {activeNotification.labelMock ? '(Test Mode)' : ''}
                </p>
                <p><strong>Tracking Number:</strong> {activeNotification.trackingNumber || 'Awaiting shipment'}</p>
                <p><strong>Carrier:</strong> {activeNotification.carrier || 'UPS'} — {activeNotification.shippingService || 'UPS Ground'}</p>
                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                  Label Status: {activeNotification.labelStatus === 'label_ready' ? 'Shipped' : activeNotification.labelStatus || 'Pending'}
                </p>
                {activeNotification.orderId && (
                  <button
                    type="button"
                    className="notification-action-btn accept"
                    style={{ marginTop: 10, width: '100%' }}
                    disabled={deliveryLoading}
                    onClick={() => handleMarkDelivered(activeNotification)}
                  >
                    {deliveryLoading ? 'Confirming...' : 'Confirm Delivery Received'}
                  </button>
                )}
                {activeNotification.deliveryError && (
                  <p style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{activeNotification.deliveryError}</p>
                )}
              </div>
            )}

            {activeNotification.type === 'order_accepted' && activeNotification.status === 'delivered' && (
              <div className="notification-summary-box" style={{ marginTop: 12, background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <p style={{ fontWeight: 700, color: '#065f46', marginBottom: 6 }}>Delivery Confirmed</p>
                <p><strong>Tracking Number:</strong> {activeNotification.trackingNumber || 'N/A'}</p>
                <p style={{ color: '#065f46', fontSize: 13, marginTop: 4 }}>
                  Seller payout has been initiated. The order is now complete.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;