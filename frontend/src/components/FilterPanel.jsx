import React from 'react';
import Slider from '@mui/material/Slider';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import WatchIcon from '@mui/icons-material/Watch';
import SkateboardingIcon from '@mui/icons-material/Skateboarding';
import { SIZES, CONDITIONS, CATEGORIES, DEFAULT_PRICE_RANGE } from '../constants/filters';
import './FilterPanel.css';

// Map category names to icon components
const categoryIconMap = {
  Men: MaleIcon,
  Women: FemaleIcon,
  Kids: ChildCareIcon,
  Sports: SportsBasketballIcon,
  Vintage: WatchIcon,
  Streetwear: SkateboardingIcon
};

const FilterPanel = ({
  filters,
  onFilterChange,
  onClearAll,
  isOpen,
  onClose
}) => {
  const handleSizeToggle = (size) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const handleConditionToggle = (conditionValue) => {
    const newConditions = filters.conditions.includes(conditionValue)
      ? filters.conditions.filter(c => c !== conditionValue)
      : [...filters.conditions, conditionValue];
    onFilterChange({ ...filters, conditions: newConditions });
  };

  const handleCategoryToggle = (categoryName) => {
    const newCategories = filters.categories.includes(categoryName)
      ? filters.categories.filter(c => c !== categoryName)
      : [...filters.categories, categoryName];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (event, newValue) => {
    onFilterChange({ ...filters, priceRange: newValue });
  };

  const handleMinPriceChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    onFilterChange({ ...filters, priceRange: [value, filters.priceRange[1]] });
  };

  const handleMaxPriceChange = (e) => {
    const value = Math.min(DEFAULT_PRICE_RANGE[1], parseInt(e.target.value) || DEFAULT_PRICE_RANGE[1]);
    onFilterChange({ ...filters, priceRange: [filters.priceRange[0], value] });
  };

  const removeFilter = (type, value) => {
    switch (type) {
      case 'size':
        onFilterChange({ ...filters, sizes: filters.sizes.filter(s => s !== value) });
        break;
      case 'condition':
        onFilterChange({ ...filters, conditions: filters.conditions.filter(c => c !== value) });
        break;
      case 'category':
        onFilterChange({ ...filters, categories: filters.categories.filter(c => c !== value) });
        break;
      case 'price':
        onFilterChange({ ...filters, priceRange: DEFAULT_PRICE_RANGE });
        break;
      default:
        break;
    }
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.conditions.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1];

  const getConditionLabel = (value) => {
    const condition = CONDITIONS.find(c => c.value === value);
    return condition ? condition.label : value;
  };

  const isPriceFiltered =
    filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="filter-overlay" onClick={onClose} />}

      <aside className={`filter-panel ${isOpen ? 'open' : ''}`}>
        <div className="filter-panel-header">
          <h2>Filters</h2>
          <button className="filter-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="active-filters">
            <div className="active-filters-header">
              <span>Active Filters</span>
              <button className="clear-all-btn" onClick={onClearAll}>
                Clear All
              </button>
            </div>
            <div className="active-filters-chips">
              {filters.sizes.map(size => (
                <Chip
                  key={`size-${size}`}
                  label={`Size: ${size}`}
                  onDelete={() => removeFilter('size', size)}
                  size="small"
                  className="filter-chip"
                />
              ))}
              {filters.conditions.map(condition => (
                <Chip
                  key={`condition-${condition}`}
                  label={getConditionLabel(condition)}
                  onDelete={() => removeFilter('condition', condition)}
                  size="small"
                  className="filter-chip"
                />
              ))}
              {filters.categories.map(category => (
                <Chip
                  key={`category-${category}`}
                  label={category}
                  onDelete={() => removeFilter('category', category)}
                  size="small"
                  className="filter-chip"
                />
              ))}
              {isPriceFiltered && (
                <Chip
                  label={`$${filters.priceRange[0]} - $${filters.priceRange[1]}`}
                  onDelete={() => removeFilter('price')}
                  size="small"
                  className="filter-chip"
                />
              )}
            </div>
          </div>
        )}

        {/* Size Filter */}
        <div className="filter-section">
          <h3 className="filter-title">Size</h3>
          <div className="size-grid">
            {SIZES.map(size => (
              <button
                key={size}
                className={`size-btn ${filters.sizes.includes(size) ? 'active' : ''}`}
                onClick={() => handleSizeToggle(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="filter-section">
          <h3 className="filter-title">Price Range</h3>
          <div className="price-slider-container">
            <Slider
              value={filters.priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={DEFAULT_PRICE_RANGE[0]}
              max={DEFAULT_PRICE_RANGE[1]}
              sx={{
                color: '#10b981',
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.16)'
                  }
                }
              }}
            />
          </div>
          <div className="price-inputs">
            <div className="price-input-group">
              <label>Min</label>
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={handleMinPriceChange}
                min="0"
                max={filters.priceRange[1]}
              />
            </div>
            <span className="price-separator">—</span>
            <div className="price-input-group">
              <label>Max</label>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={handleMaxPriceChange}
                min={filters.priceRange[0]}
                max={DEFAULT_PRICE_RANGE[1]}
              />
            </div>
          </div>
        </div>

        {/* Condition Filter */}
        <div className="filter-section">
          <h3 className="filter-title">Condition</h3>
          <div className="condition-list">
            {CONDITIONS.map(condition => (
              <FormControlLabel
                key={condition.value}
                control={
                  <Checkbox
                    checked={filters.conditions.includes(condition.value)}
                    onChange={() => handleConditionToggle(condition.value)}
                    sx={{
                      color: '#d1d5db',
                      '&.Mui-checked': {
                        color: '#10b981'
                      }
                    }}
                  />
                }
                label={condition.label}
                className="condition-checkbox"
              />
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <h3 className="filter-title">Category</h3>
          <div className="category-list">
            {CATEGORIES.map(category => {
              const IconComponent = categoryIconMap[category.name];
              return (
                <FormControlLabel
                  key={category.name}
                  control={
                    <Checkbox
                      checked={filters.categories.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                      sx={{
                        color: '#d1d5db',
                        '&.Mui-checked': {
                          color: '#10b981'
                        }
                      }}
                    />
                  }
                  label={
                    <span className="category-label">
                      <IconComponent className="category-icon-filter" />
                      {category.name}
                    </span>
                  }
                  className="category-checkbox"
                />
              );
            })}
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="filter-apply-mobile">
          <button className="apply-filters-btn" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
};

export default FilterPanel;
