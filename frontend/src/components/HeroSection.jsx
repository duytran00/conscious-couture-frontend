import React from 'react';
import { useNavigate } from 'react-router-dom';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import './HeroSection.css';

const HeroSection = ({ onShopNow, featuredProducts = [] }) => {
  const navigate = useNavigate();

  const handleShopNow = () => {
    if (onShopNow) {
      onShopNow();
    } else {
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartSelling = () => {
    navigate('/upload');
  };

  return (
    <section className="hero-section-new">
      <div className="hero-content">
        {/* Left Side - Text Content */}
        <div className="hero-text">
          <span className="hero-badge">
            <EnergySavingsLeafIcon sx={{ fontSize: 16, marginRight: '4px' }} />
            Sustainable Fashion
          </span>
          <h1 className="hero-title-new">
            Fashion That <span className="text-highlight">Feels Good</span>
          </h1>
          <p className="hero-subtitle-new">
            Buy and sell pre-loved clothing. Save money. Save the planet.
            Join our community of conscious shoppers making a difference.
          </p>
          <div className="hero-cta-buttons">
            <button className="btn-primary-new" onClick={handleShopNow}>
              Shop Now
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            </button>
            <button className="btn-secondary-new" onClick={handleStartSelling}>
              Start Selling
            </button>
          </div>
          <div className="hero-trust-indicators">
            <div className="trust-item">
              <EnergySavingsLeafIcon className="trust-icon-svg" />
              <span className="trust-text">Eco-Friendly</span>
            </div>
            <div className="trust-item">
              <VerifiedUserIcon className="trust-icon-svg" />
              <span className="trust-text">Verified Sellers</span>
            </div>
            <div className="trust-item">
              <LockIcon className="trust-icon-svg" />
              <span className="trust-text">Secure Payments</span>
            </div>
          </div>
        </div>

        {/* Right Side - Visual Collage */}
        <div className="hero-visual">
          <div className="floating-cards">
            {featuredProducts.length > 0 ? (
              <>
                <div className="floating-card card-1">
                  <img src={featuredProducts[0]?.img || '/placeholder-image.jpg'} alt="Featured item" />
                </div>
                {featuredProducts[1] && (
                  <div className="floating-card card-2">
                    <img src={featuredProducts[1]?.img || '/placeholder-image.jpg'} alt="Featured item" />
                  </div>
                )}
                {featuredProducts[2] && (
                  <div className="floating-card card-3">
                    <img src={featuredProducts[2]?.img || '/placeholder-image.jpg'} alt="Featured item" />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="floating-card card-1 placeholder-card">
                  <div className="placeholder-content">
                    <CheckroomIcon sx={{ fontSize: 64, opacity: 0.6, color: '#059669' }} />
                  </div>
                </div>
                <div className="floating-card card-2 placeholder-card">
                  <div className="placeholder-content">
                    <DryCleaningIcon sx={{ fontSize: 48, opacity: 0.6, color: '#059669' }} />
                  </div>
                </div>
                <div className="floating-card card-3 placeholder-card">
                  <div className="placeholder-content">
                    <CheckroomIcon sx={{ fontSize: 40, opacity: 0.6, color: '#059669' }} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="decorative-circle circle-1"></div>
          <div className="decorative-circle circle-2"></div>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="hero-stats">
        <div className="stat-item">
          <span className="stat-value">2,450 kg</span>
          <span className="stat-label">CO₂ Saved</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">18,000 L</span>
          <span className="stat-label">Water Saved</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">1,200+</span>
          <span className="stat-label">Items Exchanged</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
