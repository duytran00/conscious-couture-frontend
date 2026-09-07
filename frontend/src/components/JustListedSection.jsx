import React from 'react';
import ProductCard from './ProductCard';
import './JustListedSection.css';

const JustListedSection = ({ items, onProductClick }) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Get the most recent 6 items
  const recentItems = items.slice(0, 6);

  return (
    <section className="just-listed-section">
      <div className="just-listed-header">
        <div className="header-left">
          <h2 className="just-listed-title">Just Listed</h2>
          <span className="just-listed-badge">
            <span className="pulse-dot"></span>
            Fresh Arrivals
          </span>
        </div>
        <p className="just-listed-subtitle">
          Discover newly added pre-loved treasures
        </p>
      </div>

      <div className="just-listed-scroll-container">
        <div className="just-listed-items">
          {recentItems.map((item) => (
            <div className="just-listed-item" key={item.id}>
              <ProductCard product={item} onClick={onProductClick} />
            </div>
          ))}
        </div>
      </div>

      <div className="scroll-indicators">
        <div className="scroll-hint">
          <span className="scroll-arrow">←</span>
          <span className="scroll-text">Scroll to explore</span>
          <span className="scroll-arrow">→</span>
        </div>
      </div>
    </section>
  );
};

export default JustListedSection;
