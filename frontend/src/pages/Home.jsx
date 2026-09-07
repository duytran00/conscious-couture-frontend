import React, { useState, useEffect, useMemo } from 'react';
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./Home.css";
import { useNavigate } from "react-router-dom";
import ClothingAPI from '../utils/api';

// MUI Icons
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HandshakeIcon from '@mui/icons-material/Handshake';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import WatchIcon from '@mui/icons-material/Watch';
import SkateboardingIcon from '@mui/icons-material/Skateboarding';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Import new components
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import HeroSection from '../components/HeroSection';
import JustListedSection from '../components/JustListedSection';
import { CATEGORIES, SORT_OPTIONS, DEFAULT_PRICE_RANGE } from '../constants/filters';

// Map category names to icon components
const categoryIconMap = {
  Men: MaleIcon,
  Women: FemaleIcon,
  Kids: ChildCareIcon,
  Sports: SportsBasketballIcon,
  Vintage: WatchIcon,
  Streetwear: SkateboardingIcon
};

const Home = () => {
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    navigate(`/item/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Homepage handleProductClick={handleProductClick} />
      </div>
    </div>
  );
};

export default Home;

function Homepage({ handleProductClick }) {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Filter state
  const [filters, setFilters] = useState({
    sizes: [],
    priceRange: DEFAULT_PRICE_RANGE,
    conditions: [],
    categories: [],
    searchTerm: ''
  });

  // Load clothing items from API
  useEffect(() => {
    const loadClothingItems = async () => {
      try {
        setLoading(true);
        const response = await ClothingAPI.getClothingItems({ per_page: 100 });

        // Transform API data to match frontend format 
        // const transformedItems = response.items.map(item => ({
          const transformedItems = response.items.filter((item => item.status === 'available'))
          .map(item => ({
          id: item.clothing_id,
          img: item.primary_image_url || '/placeholder-image.jpg',
          title: item.description || 'No description',
          brand: item.brand || '',
          clothing_type: item.clothing_type,
          size: item.size,
          color: item.color || '',
          condition: item.condition,
          sell_price: item.sell_price,
          created_at: item.created_at,
          // ── NEW: Include owner_user_id so ProductCard can show "Your Item" ──
          owner_user_id: item.owner_user_id,
          // Map clothing types to frontend categories
          main: getMainCategory(item.description, item.clothing_type),
          sub: getSubCategory(item.clothing_type, item.description),
          types: getClothingCategory(item.description)
        }));

        setClothingItems(transformedItems);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load clothing items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClothingItems();
  }, []);

  // Helper functions to map API data to frontend categories
  const getMainCategory = (description, clothingType) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('women') || desc.includes('womens')) return 'Women';
    if (desc.includes('men') || desc.includes('mens')) return 'Men';
    if (desc.includes('kid') || desc.includes('child')) return 'Kids';
    return 'Men';
  };

  const getSubCategory = (clothingType, description) => {
    const typeMap = {
      't-shirt': 'T-shirt',
      'shirt': 'Button-Down Shirt',
      'jeans': 'Pants',
      'pants': 'Pants',
      'jacket': 'Jackets',
      'sweater': 'Sweaters',
      'dress': 'Dresses',
      'blouse': 'Tops'
    };

    if ((description || '').toLowerCase().includes('jersey')) {
      return 'Jersey';
    }

    return typeMap[clothingType] || 'Tops';
  };

  const getClothingCategory = (description) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('vintage')) return 'Vintage';
    if (desc.includes('sport') || desc.includes('jersey') || desc.includes('athletic')) return 'Sports';
    if (desc.includes('street')) return 'Streetwear';
    return null;
  };

  // Filtered and sorted items using useMemo
  const filteredItems = useMemo(() => {
    let result = [...clothingItems];

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term) ||
        (item.clothing_type || '').toLowerCase().includes(term)
      );
    }

    // Filter by sizes
    if (filters.sizes.length > 0) {
      result = result.filter(item => filters.sizes.includes(item.size));
    }

    // Filter by price range
    result = result.filter(item => {
      const price = parseFloat(item.sell_price) || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filter by conditions
    if (filters.conditions.length > 0) {
      result = result.filter(item => filters.conditions.includes(item.condition));
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter(item =>
        filters.categories.includes(item.main) ||
        filters.categories.includes(item.types)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (parseFloat(a.sell_price) || 0) - (parseFloat(b.sell_price) || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (parseFloat(b.sell_price) || 0) - (parseFloat(a.sell_price) || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
    }

    return result;
  }, [clothingItems, filters, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.sizes.length > 0 ||
      filters.conditions.length > 0 ||
      filters.categories.length > 0 ||
      filters.searchTerm !== '' ||
      filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
      filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1]
    );
  }, [filters]);

  const handleSearch = (event) => {
    setFilters(prev => ({ ...prev, searchTerm: event.target.value }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      sizes: [],
      priceRange: DEFAULT_PRICE_RANGE,
      conditions: [],
      categories: [],
      searchTerm: ''
    });
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== category)
        };
      }
      return {
        ...prev,
        categories: [...prev.categories, category]
      };
    });
  };

  const scrollToProducts = () => {
    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading clothing items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <p>Error loading clothing items: {error}</p>
          <p>Please make sure the backend server is running on http://localhost:8000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <HeroSection
        onShopNow={scrollToProducts}
        featuredProducts={clothingItems.slice(0, 3)}
      />

      {/* Just Listed Section */}
      <JustListedSection
        items={clothingItems}
        onProductClick={handleProductClick}
      />

      {/* Category Cards */}
      <section className="category-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-cards">
          {CATEGORIES.map(cat => {
            const IconComponent = categoryIconMap[cat.name];
            return (
              <div
                className={`category-card ${filters.categories.includes(cat.name) ? 'active' : ''}`}
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <IconComponent className="category-icon-svg" />
                <span className="category-name">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-icon-container">
              <CameraAltIcon className="step-icon-svg" />
            </div>
            <h3 className="step-title">List Your Item</h3>
            <p className="step-description">Take a photo, add details, and set your price</p>
          </div>
          <div className="step-arrow">
            <ArrowForwardIcon />
          </div>
          <div className="step">
            <div className="step-icon-container">
              <HandshakeIcon className="step-icon-svg" />
            </div>
            <h3 className="step-title">Connect</h3>
            <p className="step-description">Buyers discover your items and make purchases</p>
          </div>
          <div className="step-arrow">
            <ArrowForwardIcon />
          </div>
          <div className="step">
            <div className="step-icon-container">
              <LocalShippingIcon className="step-icon-svg" />
            </div>
            <h3 className="step-title">Ship & Earn</h3>
            <p className="step-description">Ship the item and get paid securely</p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section" id="product-grid">
        {/* Mobile Filter Toggle */}
        <button
          className="mobile-filter-toggle"
          onClick={() => setFilterPanelOpen(true)}
        >
          <TuneIcon className="filter-icon-svg" />
          Filters
          {hasActiveFilters && <span className="filter-badge">{filters.sizes.length + filters.conditions.length + filters.categories.length}</span>}
        </button>

        <div className="products-layout">
          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearAll={handleClearAllFilters}
            isOpen={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
          />

          {/* Main Content */}
          <div className="products-main">
            {/* Search and Sort Bar */}
            <div className="search-sort-bar">
              <div className="search-container-new">
                <TextField
                  className="search-input"
                  variant="outlined"
                  fullWidth
                  placeholder="Search items..."
                  value={filters.searchTerm}
                  onChange={handleSearch}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </div>
              <div className="sort-container">
                <FormControl size="small" className="sort-select">
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Results Count */}
            <div className="results-info">
              <span className="results-count">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
              </span>
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={handleClearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>

            {/* Product Grid */}
            {filteredItems.length > 0 ? (
              <div className="product-grid">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onClick={handleProductClick}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <SearchOffIcon className="empty-icon-svg" />
                <h3 className="empty-title">No items found</h3>
                <p className="empty-text">
                  Try adjusting your filters or search term to find what you're looking for.
                </p>
                <button className="btn-primary" onClick={handleClearAllFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sustainability Banner */}
      <section className="sustainability-banner">
        <div className="banner-content">
          <h2 className="banner-title">Join the Sustainable Fashion Movement</h2>
          <p className="banner-text">
            Every pre-loved item purchased saves water, reduces CO₂ emissions, and keeps clothing out of landfills.
          </p>
          <div className="banner-stats">
            <div className="banner-stat">
              <span className="banner-stat-value">2.5M+ gallons</span>
              <span className="banner-stat-label">of water saved by our community</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}