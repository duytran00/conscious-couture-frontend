// Filter constants for the homepage

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export const CONDITIONS = [
  { label: 'Brand New', value: 'brand_new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Well Worn', value: 'well_worn' }
];

// Category icon names (MUI icon component names)
export const CATEGORIES = [
  { name: 'Men', icon: 'Male', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Women', icon: 'Female', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Kids', icon: 'ChildCare', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Sports', icon: 'SportsBasketball', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Vintage', icon: 'Watch', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Streetwear', icon: 'Skateboarding', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
];

export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' }
];

export const CONDITION_COLORS = {
  brand_new: { bg: '#dcfce7', text: '#166534', label: 'Brand New' },
  like_new: { bg: '#dbeafe', text: '#1e40af', label: 'Like New' },
  good: { bg: '#fef3c7', text: '#92400e', label: 'Good' },
  fair: { bg: '#fed7aa', text: '#9a3412', label: 'Fair' },
  well_worn: { bg: '#fecaca', text: '#991b1b', label: 'Well Worn' }
};

export const DEFAULT_PRICE_RANGE = [0, 500];
