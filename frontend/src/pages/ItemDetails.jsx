import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SwapModal from '../components/SwapModal';
import SustainabilityMetrics from '../components/SustainabilityMetrics';
import ClothingAPI from '../utils/api';
import ReviewSection from '../components/ReviewSection';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [clothingItem, setClothingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [buyFeedback, setBuyFeedback] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [cartFeedback, setCartFeedback] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);

  // Determine if the current user owns this item
  const currentUserId = user?.id ? parseInt(user.id) : null;
  const isOwner = clothingItem && currentUserId && clothingItem.owner?.userId === currentUserId;

  useEffect(() => {
    const loadClothingItem = async () => {
      if (!id) { setError('No item ID provided'); setLoading(false); return; }
      try {
        setLoading(true);

        // Fetch owner info from the new endpoint
        ClothingAPI.getOwnerInfo(id)
          .then(info => setOwnerInfo(info))
          .catch(err => console.error("Failed to fetch owner info:", err));

        const item = await ClothingAPI.getClothingItem(id);
        setClothingItem({
          id: item.clothing_id,
          name: cleanItemName(item.description) || 'No description available',
          originalPrice: estimateOriginalPrice(item.brand, item.clothing_type),
          size: item.size, condition: capitalizeCondition(item.condition),
          description: generateDescription(item), features: generateFeatures(item),
          images: item.primary_image_url ? [item.primary_image_url] : [],
          colors: generateColors(item), available: item.status === 'available',
          owner: { userId: item.owner_user_id },
          brand: item.brand, clothing_type: item.clothing_type,
          material_composition: item.material_composition,
          weight_grams: item.weight_grams, times_swapped: item.times_swapped || 0,
          sell_price: item.sell_price,
          owner_user_id: item.owner_user_id,
        });
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    loadClothingItem();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/reviews/clothing/${id}/summary`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReviewSummary(data); })
      .catch(() => { });
  }, [id]);

  const cleanItemName = (d) => d ? d.replace(/\s*\d+\s*$/, '').trim() : null;
  const estimateOriginalPrice = (brand, type) => {
    const bp = { 'nike': { b: 50, m: 1.2 }, 'adidas': { b: 45, m: 1.1 }, 'ralph lauren': { b: 80, m: 1.5 }, 'lululemon': { b: 90, m: 1.3 }, 'patagonia': { b: 70, m: 1.4 } };
    const tp = { 't-shirt': 1, 'shirt': 1.2, 'jeans': 1.5, 'jacket': 2, 'sweater': 1.3, 'dress': 1.4 };
    const bi = bp[brand?.toLowerCase()] || { b: 40, m: 1 };
    return Math.round(bi.b * bi.m * (tp[type] || 1));
  };
  const capitalizeCondition = (c) => c ? c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Good';
  const generateDescription = (item) => {
    const mats = Object.keys(item.material_composition || {}).join(', ');
    const cond = item.condition === 'brand_new' || item.condition === 'excellent' ? 'Excellent condition.' : item.condition === 'like_new' || item.condition === 'good' ? 'Great condition with minimal wear.' : 'Good condition.';
    return `${item.description || 'Quality item'}. Made from ${mats}. ${cond}`;
  };
  const generateFeatures = (item) => {
    const f = [], m = item.material_composition || {};
    Object.entries(m).forEach(([mat, pct]) => { if (pct > 50) f.push(`${Math.round(pct)}% ${mat.replace('_', ' ')}`) });
    if (item.brand) f.push(`${item.brand} Brand`);
    f.push(`${capitalizeCondition(item.condition)} Condition`); f.push(`Size ${item.size}`);
    return f.slice(0, 6);
  };
  const generateColors = (item) => {
    const cm = { black: '#000', white: '#FFF', blue: '#0066CC', red: '#CC0000', green: '#059669', yellow: '#FFCC00', brown: '#8B4513', grey: '#808080' };
    const c = item.color?.toLowerCase(); return [{ name: item.color || 'Multi', value: cm[c] || '#666' }];
  };

  // Owner display name from the new endpoint
  const ownerDisplayName = ownerInfo?.display_name || 'Loading...';
  const ownerSwapCount = ownerInfo?.total_swaps ?? 0;

  const Stars = ({ rating, size = 14, color = '#f59e0b' }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (<span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? color : '#e5e7eb' }}>★</span>))}
    </div>
  );

  const handleBuyNow = async () => {
    if (!clothingItem || isOwner) return;
    setBuyError(null);
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isInCart(clothingItem.id)) { navigate('/checkout'); return; }
    try {
      setBuyFeedback(true);
      await addToCart(clothingItem.id);
      setTimeout(() => navigate('/checkout'), 500);
    } catch (err) {
      setBuyFeedback(false);
      setBuyError(err.message);
    }
  };

  const handleAddToCart = async () => {
    if (!clothingItem || isOwner) return;
    setCartError(null);
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isInCart(clothingItem.id)) return; // Already in cart
    try {
      setCartFeedback(true);
      await addToCart(clothingItem.id);
      setTimeout(() => setCartFeedback(false), 2000);
    } catch (err) {
      setCartFeedback(false);
      setCartError(err.message);
    }
  };

  const handleRequestSwap = () => {
    if (isOwner) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    setIsSwapModalOpen(true);
  };

  if (loading || error) return <div style={{ padding: 100, textAlign: 'center' }}>{loading ? "Loading..." : error}</div>;

  const item = clothingItem;
  const hasImage = item.images.length > 0 && !imageError;
  const alreadyInCart = isInCart(item.id);
  const hasSellPrice = item.sell_price && parseFloat(item.sell_price) > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#1a1a1a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 24px' }}>
        <nav style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Shop</span><span>/</span>
          <span style={{ color: '#999', textTransform: 'capitalize' }}>{item.clothing_type}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr 340px', gap: 40, alignItems: 'start' }}>
          {/* COL 1: Media */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', border: '1px solid #eee', aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {hasImage ? (<img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<div style={{ textAlign: 'center' }}><span style={{ fontSize: 80 }}>📦</span><p style={{ fontWeight: 600, color: '#999', marginTop: 12 }}>No Image Preview</p></div>)}
              {/* Owner badge overlay */}
              {isOwner && (
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: '#1a1a1a', color: '#fff',
                  padding: '6px 14px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>👤</span> Your Listing
                </div>
              )}
            </div>
          </div>

          {/* COL 2: Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: 6 }}>{item.brand || 'Conscious Choice'}</span>
                <span style={{ fontSize: 13, color: '#666' }}>ID: #820{item.id}</span>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>{item.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Stars rating={reviewSummary.average_rating} size={16} /><span style={{ fontWeight: 700, fontSize: 14 }}>{reviewSummary.average_rating.toFixed(1)}</span></div>
                <span style={{ color: '#eee' }}>|</span>
                <span style={{ fontSize: 14, color: '#10b981', fontWeight: 600, cursor: 'pointer' }}>{reviewSummary.total_reviews} Reviews</span>
              </div>
            </section>
            <section style={{ borderTop: '1px solid #eee', paddingTop: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Product Description</h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: '#444' }}>{item.description}</p>
            </section>
            <section style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #eee' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Composition & Care</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {Object.entries(item.material_composition || {}).map(([mat, pct]) => (
                  <div key={mat}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{mat}</span><span style={{ fontWeight: 700 }}>{pct}%</span></div><div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}><div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 3 }} /></div></div>
                ))}
              </div>
            </section>
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Item Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {item.features.map((f, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#555', padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0' }}><span style={{ color: '#10b981' }}>✓</span>{f}</div>))}
              </div>
            </section>
          </div>

          {/* COL 3: Action Panel */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', padding: 28, borderRadius: 24, border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>

              {/* Price display */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800 }}>${Number(item.sell_price || 0).toFixed(2)}</span>
                  <span style={{ fontSize: 16, color: '#999', textDecoration: 'line-through' }}>${item.originalPrice}</span>
                </div>
                {!isOwner && (
                  <p style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>You save ${item.originalPrice - (item.sell_price || 0)} by swapping</p>
                )}
              </div>

              {/* Item details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#666' }}>Size</span><span style={{ fontWeight: 700 }}>{item.size}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#666' }}>Condition</span><span style={{ fontWeight: 700, color: '#10b981' }}>{item.condition}</span></div>
              </div>

              {/* ════════════════════════════════════════════════════
                  OWNERSHIP-AWARE ACTION BUTTONS
                  ════════════════════════════════════════════════════ */}

              {isOwner ? (
                /* ── OWNER VIEW: Edit/Manage, no purchase actions ── */
                <div>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16,
                    padding: '14px 18px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>👤</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>This is your listing</p>
                      <p style={{ fontSize: 12, color: '#15803d' }}>You can edit or manage this item below.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/item/${item.id}/edit`)}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                      fontSize: 15, fontWeight: 700, background: '#1a1a1a', color: '#fff',
                      cursor: 'pointer', marginBottom: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    <span>✏️</span> Edit Listing
                  </button>

                  <button
                    onClick={() => navigate('/dashboard?tab=listings')}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 16,
                      border: '1px solid #ddd', background: 'transparent',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    View My Listings
                  </button>
                </div>
              ) : (
                /* ── NON-OWNER VIEW: Buy, Add to Cart, Swap ── */
                <div>
                  {/* Buy Now — goes straight to checkout */}
                  {hasSellPrice && (
                    <button onClick={handleBuyNow} disabled={!item.available || buyFeedback}
                      style={{
                        width: '100%', padding: '18px', borderRadius: 16, border: 'none',
                        fontSize: 16, fontWeight: 700,
                        background: buyFeedback ? '#059669' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', cursor: item.available && !buyFeedback ? 'pointer' : 'not-allowed',
                        marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all 0.3s ease', transform: buyFeedback ? 'scale(0.97)' : 'scale(1)',
                        opacity: !item.available ? 0.5 : 1
                      }}>
                      {buyFeedback
                        ? (<><span>✓</span> Added — Going to Cart…</>)
                        : alreadyInCart
                          ? (<><span>🛒</span> Already in Cart — View Cart</>)
                          : !isAuthenticated
                            ? (<><span>🛒</span> Sign in to Buy — ${Number(item.sell_price).toFixed(2)}</>)
                            : (<><span>🛒</span> Buy Now — ${Number(item.sell_price).toFixed(2)}</>)
                      }
                    </button>
                  )}
                  {buyError && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{buyError}</p>}

                  {/* Add to Cart — stays on page */}
                  {hasSellPrice && !alreadyInCart && (
                    <button onClick={handleAddToCart} disabled={!item.available || cartFeedback}
                      style={{
                        width: '100%', padding: '16px', borderRadius: 16,
                        border: '2px solid #10b981', background: cartFeedback ? '#ecfdf5' : 'transparent',
                        fontSize: 15, fontWeight: 700,
                        color: cartFeedback ? '#059669' : '#10b981',
                        cursor: item.available && !cartFeedback ? 'pointer' : 'not-allowed',
                        marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all 0.3s ease',
                      }}>
                      {cartFeedback
                        ? (<><span>✓</span> Added to Cart!</>)
                        : !isAuthenticated
                          ? (<><span>🛍️</span> Sign in to Add to Cart</>)
                          : (<><span>🛍️</span> Add to Cart</>)
                      }
                    </button>
                  )}
                  {alreadyInCart && !buyFeedback && (
                    <p style={{ fontSize: 12, color: '#059669', fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                      ✓ Already in your cart
                    </p>
                  )}
                  {cartError && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, textAlign: 'center' }}>{cartError}</p>}

                  {/* Request Swap */}
                  <button onClick={handleRequestSwap} disabled={!item.available}
                    style={{
                      width: '100%', padding: '18px', borderRadius: 16, border: 'none',
                      fontSize: 16, fontWeight: 700, background: '#1a1a1a', color: '#fff',
                      cursor: 'pointer', marginBottom: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      opacity: !item.available ? 0.5 : 1,
                    }}>
                    <span>🔄</span> Request Swap
                  </button>

                  {/* Wishlist */}
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 16,
                    border: '1px solid #ddd', background: 'transparent',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Save to Wishlist
                  </button>
                </div>
              )}

              {/* Owner info — shown for everyone */}
              <div style={{ marginTop: 24, padding: '16px 0 0', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: isOwner ? '#3b82f6' : '#10b981',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                  }}>
                    {ownerDisplayName.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>
                      {isOwner ? `${ownerDisplayName} (You)` : ownerDisplayName}
                    </p>
                    <p style={{ fontSize: 12, color: '#666' }}>{ownerSwapCount} Successful Swaps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 80, paddingTop: 60, borderTop: '1px solid #eee' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 40 }}>Sustainability Impact</h2>
          <SustainabilityMetrics clothingId={id} />
        </div>
        <div style={{ marginTop: 80 }}><ReviewSection clothingId={id} ownerId={item.owner.userId} /></div>
      </div>
      <SwapModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} targetItem={item} />
    </div>
  );
};

export default ItemDetails;