import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CONDITION_COLORS } from '../constants/filters';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

const ProductCard = ({ product, onClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick(product.id);
    } else {
      navigate(`/item/${product.id}`);
    }
  };

  const conditionInfo = CONDITION_COLORS[product.condition] || CONDITION_COLORS.good;

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Price TBD';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // ── Ownership detection ──
  const currentUserId = user?.id ? parseInt(user.id) : null;
  const isOwner = currentUserId && product.owner_user_id && product.owner_user_id === currentUserId;

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-card-image-container">
        <img
          src={product.img || '/placeholder-image.jpg'}
          alt={product.title}
          className="product-card-image"
          loading="lazy"
        />

        {/* Condition Badge - Top Left */}
        <span
          className="product-card-badge condition-badge"
          style={{
            backgroundColor: conditionInfo.bg,
            color: conditionInfo.text
          }}
        >
          {conditionInfo.label}
        </span>

        {/* Size Badge - Top Right */}
        {product.size && (
          <span className="product-card-badge size-badge">
            {product.size}
          </span>
        )}

        {/* YOUR ITEM Badge - Bottom Left */}
        {isOwner && (
          <span
            className="product-card-badge"
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              backgroundColor: '#1e40af',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: '11px' }}>👤</span> Your Item
          </span>
        )}

        {/* Hover Overlay */}
        <div className="product-card-overlay">
          <button className="quick-view-btn">
            Quick View
          </button>
        </div>
      </div>

      <div className="product-card-info">
        <h3 className="product-card-title">{product.title}</h3>
        {product.brand && (
          <p className="product-card-brand">{product.brand}</p>
        )}
        <p className="product-card-price">{formatPrice(product.sell_price)}</p>
      </div>
    </div>
  );
};

export default ProductCard;