import React, { useState, useEffect } from 'react';
import './UploadItem.css';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckIcon from '@mui/icons-material/Check';
import PublishIcon from '@mui/icons-material/Publish';
import ClothingAPI from '../utils/api';
// import { uploadImage } from '../utils/supabase'; temp

// Constants for dropdown options
const CLOTHING_CATEGORIES = {
  Men: [
    { label: "T-shirt", value: "Men - T-shirt" },
    { label: "Jersey", value: "Men - Jersey" },
    { label: "Button-Down Shirt", value: "Men - Button-Down Shirt" },
    { label: "Jackets", value: "Men - Jackets" },
    { label: "Sweaters", value: "Men - Sweaters" },
    { label: "Pants", value: "Men - Pants" },
    { label: "Shorts", value: "Men - Shorts" },
    { label: "Shoes", value: "Men - Shoes" },
  ],
  Women: [
    { label: "Tops", value: "Women - Tops" },
    { label: "Dresses", value: "Women - Dresses" },
    { label: "Jackets", value: "Women - Jackets" },
    { label: "Sweaters", value: "Women - Sweaters" },
    { label: "Pants", value: "Women - Pants" },
    { label: "Shorts", value: "Women - Shorts" },
    { label: "Shoes", value: "Women - Shoes" },
  ],
  Kids: [
    { label: "Tops", value: "Kids - Tops" },
    { label: "Bottoms", value: "Kids - Bottoms" },
    { label: "Shoes", value: "Kids - Shoes" },
  ],
};

const CLOTHING_TYPES = [
  "Men - T-shirt",
  "Men - Jersey",
  "Men - Button-Down Shirt",
  "Men - Jackets",
  "Men - Sweaters",
  "Men - Pants",
  "Men - Shorts",
  "Men - Shoes",
  "Women - Tops",
  "Women - Dresses",
  "Women - Jackets",
  "Women - Sweaters",
  "Women - Pants",
  "Women - Shorts",
  "Women - Shoes",
  "Kids - Tops",
  "Kids - Bottoms",
  "Kids - Shoes"
];

const CONDITIONS = [
  { label: "Brand New - Never worn, tags attached", value: "brand_new" },
  { label: "Like New - Worn once or twice, perfect condition", value: "like_new" },
  { label: "Excellent - Gently used, no visible wear", value: "used_excellent" },
  { label: "Good - Normal wear, minor signs of use", value: "used_good" },
  { label: "Fair - Visible wear but still functional", value: "used_fair" }
];

const SIZES = {
  "Clothing": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  "Pants (Waist)": ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  "Shoes": ["6", "7", "8", "9", "10", "11", "12", "13"],
  "Other": ["One Size"]
};

const COLORS = [
  "Black", "White", "Blue", "Red", "Green", "Navy",
  "Grey", "Brown", "Tan", "Pink", "Purple", "Yellow",
  "Orange", "Multi-color", "Other"
];

const MATERIALS = [
  { label: "Cotton", value: "cotton" },
  { label: "Polyester", value: "polyester" },
  { label: "Nylon", value: "nylon" },
  { label: "Linen", value: "linen" },
  { label: "Wool", value: "wool" },
  { label: "Silk", value: "silk" },
  { label: "Denim", value: "denim" },
  { label: "Rayon", value: "rayon" },
  { label: "Spandex/Elastane", value: "spandex" },
  { label: "Acrylic", value: "acrylic" },
  { label: "Viscose", value: "viscose" },
  { label: "Modal", value: "modal" },
  { label: "Organic Cotton", value: "organic_cotton" },
  { label: "Recycled Polyester", value: "recycled_polyester" },
  { label: "Other/Unknown", value: "unknown" }
];

// Common single-material presets for quick selection
const COMMON_MATERIALS = [
  { label: "100% Cotton", material: "cotton", percentage: 100 },
  { label: "100% Polyester", material: "polyester", percentage: 100 },
  { label: "Cotton Blend", material: "cotton", percentage: 60, secondary: "polyester", secondaryPct: 40 },
  { label: "Denim", material: "denim", percentage: 100 }
];

const UploadItem = () => {
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    description: '',
    clothing_type: '',
    condition: '',
    brand: '',
    sell_price: '',
    size: '',
    color: '',
    weight_grams: ''
  });

  // Material composition state
  const [materialComposition, setMaterialComposition] = useState([
    { material: '', percentage: '' }
  ]);
  const [skipMaterials, setSkipMaterials] = useState(false);

  // Image handling state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle form field changes
  const handleFormChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const totalImages = imageFiles.length + files.length;

    if (totalImages > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
      return;
    }

    const newFiles = [...imageFiles, ...files];
    const newPreviews = files.map(file => URL.createObjectURL(file));

    setImageFiles(newFiles);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setErrors(prev => ({ ...prev, images: null }));
  };

  // Remove an image
  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);

    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);

    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  // Set primary image
  const handleSetPrimary = (index) => {
    setPrimaryImageIndex(index);
  };

  // Handle material composition changes
  const handleMaterialChange = (index, field) => (event) => {
    const newComposition = [...materialComposition];
    newComposition[index][field] = event.target.value;
    setMaterialComposition(newComposition);

    if (errors.materialComposition) {
      setErrors(prev => ({ ...prev, materialComposition: null }));
    }
  };

  // Add new material row
  const handleAddMaterial = () => {
    if (materialComposition.length >= 5) return;
    setMaterialComposition(prev => [...prev, { material: '', percentage: '' }]);
  };

  // Remove material row
  const handleRemoveMaterial = (index) => {
    if (materialComposition.length === 1) return;
    setMaterialComposition(prev => prev.filter((_, i) => i !== index));
  };

  // Apply common material preset
  const applyMaterialPreset = (preset) => {
    if (preset.secondary) {
      setMaterialComposition([
        { material: preset.material, percentage: preset.percentage.toString() },
        { material: preset.secondary, percentage: preset.secondaryPct.toString() }
      ]);
    } else {
      setMaterialComposition([
        { material: preset.material, percentage: preset.percentage.toString() }
      ]);
    }
    setSkipMaterials(false);
  };

  // Calculate total percentage
  const getTotalPercentage = () => {
    return materialComposition.reduce((sum, item) => {
      const pct = parseFloat(item.percentage) || 0;
      return sum + pct;
    }, 0);
  };

  // Get used materials (to prevent duplicates)
  const getUsedMaterials = (currentIndex) => {
    return materialComposition
      .filter((_, i) => i !== currentIndex)
      .map(item => item.material)
      .filter(Boolean);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Please add a description';
    }
    if (!formData.clothing_type) {
      newErrors.clothing_type = 'Please select a category';
    }
    if (!formData.condition) {
      newErrors.condition = 'Please select condition';
    }
    if (!formData.size) {
      newErrors.size = 'Please select a size';
    }
    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    if (imageFiles.length === 0) {
      newErrors.images = 'Please upload at least one photo';
    }

    // Material validation - only if not skipped
    if (!skipMaterials) {
      const hasValidMaterial = materialComposition.some(
        item => item.material && item.percentage
      );
      if (!hasValidMaterial) {
        newErrors.materialComposition = 'Please add at least one material, or toggle "I don\'t know"';
      } else {
        const total = getTotalPercentage();
        if (total !== 100) {
          newErrors.materialComposition = `Percentages must total 100% (currently ${total}%)`;
        }

        const materials = materialComposition.map(item => item.material).filter(Boolean);
        const uniqueMaterials = new Set(materials);
        if (materials.length !== uniqueMaterials.size) {
          newErrors.materialComposition = 'Each material can only be listed once';
        }
      }
    }

    if (formData.sell_price && (isNaN(parseFloat(formData.sell_price)) || parseFloat(formData.sell_price) <= 0)) {
      newErrors.sell_price = 'Please enter a valid price';
    }
    if (formData.weight_grams && (isNaN(parseInt(formData.weight_grams)) || parseInt(formData.weight_grams) <= 0)) {
      newErrors.weight_grams = 'Please enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // Reorder files so primary image is first
      const orderedFiles = [...imageFiles];
      if (primaryImageIndex !== 0) {
        const primaryFile = orderedFiles.splice(primaryImageIndex, 1)[0];
        orderedFiles.unshift(primaryFile);
      }

      // Upload all images to Supabase
      /*const uploadedUrls = await Promise.all(
        orderedFiles.map(file => uploadImage(file)) temp
      );*/

      setIsUploading(false);

      // Build material composition object
      let materialCompObj = {};
      if (!skipMaterials) {
        materialComposition.forEach(item => {
          if (item.material && item.percentage) {
            materialCompObj[item.material] = parseFloat(item.percentage);
          }
        });
      } else {
        // Default to unknown if skipped
        materialCompObj = { unknown: 100 };
      }

      const clothingData = {
        description: formData.description.trim(),
        clothing_type: formData.clothing_type,
        condition: formData.condition,
        size: formData.size,
        color: formData.color,
        material_composition: materialCompObj,
        // primary_image_url: uploadedUrls[0], temp
        // additional_images: uploadedUrls.slice(1), temp
        owner_user_id: 1 // For demo purposes, use user ID 1
      };

      if (formData.brand.trim()) {
        clothingData.brand = formData.brand.trim();
      }
      if (formData.sell_price) {
        clothingData.sell_price = parseFloat(formData.sell_price);
      }
      if (formData.weight_grams) {
        clothingData.weight_grams = parseInt(formData.weight_grams);
      }

      const result = await ClothingAPI.createClothingItem(clothingData);
      console.log('Created item:', result);

      setSubmitSuccess(true);

      setTimeout(() => {
        navigate(`/item/${result.clothing_id || result.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating item:', error);
      setSubmitError(error.message || 'Failed to create item. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const totalPercentage = getTotalPercentage();

  // Flatten clothing types for the select
  const allClothingTypes = Object.entries(CLOTHING_CATEGORIES).flatMap(([category, items]) =>
    items.map(item => ({ ...item, category }))
  );

  // Flatten sizes for the select
  const allSizes = Object.entries(SIZES).flatMap(([category, sizes]) =>
    sizes.map(size => ({ label: size, value: size, category }))
  );

  return (
    <div className="upload-page">
      <div className="upload-container">
        {/* Header */}
        <div className="upload-header">
          <h1 className="upload-title">List Your Item</h1>
          <p className="upload-subtitle">
            Give your clothes a second life. It only takes a few minutes!
          </p>
        </div>

        {/* Quick Tips */}
        <div className="quick-tips">
          <h3 className="quick-tips-title">
            <LightbulbIcon />
            Quick Tips for a Great Listing
          </h3>
          <ul className="tips-list">
            <li className="tip-item">
              <CheckIcon className="tip-icon" />
              <span>Use natural lighting for clear photos</span>
            </li>
            <li className="tip-item">
              <CheckIcon className="tip-icon" />
              <span>Show any flaws or wear honestly</span>
            </li>
            <li className="tip-item">
              <CheckIcon className="tip-icon" />
              <span>Include measurements if unsure of size</span>
            </li>
            <li className="tip-item">
              <CheckIcon className="tip-icon" />
              <span>Check the tag for material info</span>
            </li>
          </ul>
        </div>

        {/* Main Form Card */}
        <div className="upload-form-card">
          {/* Alerts */}
          {submitSuccess && (
            <div className="upload-alert success">
              <CheckCircleIcon className="alert-icon" />
              <span className="alert-text">
                Item listed successfully! Redirecting to your listing...
              </span>
            </div>
          )}

          {submitError && (
            <div className="upload-alert error">
              <ErrorIcon className="alert-icon" />
              <span className="alert-text">{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Section 1: Photos */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-number">1</span>
                <h2 className="section-title">Add Photos</h2>
              </div>
              <p className="section-subtitle">
                Add up to 5 photos. The first photo will be your cover image.
              </p>

              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              <label htmlFor="image-upload">
                <div className={`photo-upload-area ${imagePreviews.length > 0 ? 'has-images' : ''}`}>
                  <div className="upload-icon-container">
                    <CloudUploadIcon className="upload-icon-svg" />
                  </div>
                  <p className="upload-text-main">
                    {imagePreviews.length > 0 ? 'Add More Photos' : 'Click to Upload Photos'}
                  </p>
                  <p className="upload-text-sub">
                    {imagePreviews.length > 0
                      ? `${imagePreviews.length}/5 photos added`
                      : 'JPG, PNG up to 10MB each'}
                  </p>
                  <p className="upload-text-hint">
                    Tip: Show front, back, tags, and any details
                  </p>
                </div>
              </label>

              {errors.images && (
                <div className="error-message">
                  <ErrorIcon style={{ fontSize: '1rem' }} />
                  {errors.images}
                </div>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="image-preview-grid">
                  {imagePreviews.map((url, index) => (
                    <div
                      key={index}
                      className={`image-preview-item ${primaryImageIndex === index ? 'is-primary' : ''}`}
                    >
                      <img src={url} alt={`Upload ${index + 1}`} />
                      <div className="image-overlay" />
                      <div className="image-actions">
                        <button
                          type="button"
                          className={`image-action-btn star ${primaryImageIndex === index ? 'active' : ''}`}
                          onClick={() => handleSetPrimary(index)}
                          title="Set as cover photo"
                        >
                          {primaryImageIndex === index ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
                        </button>
                        <button
                          type="button"
                          className="image-action-btn delete"
                          onClick={() => handleRemoveImage(index)}
                          title="Remove photo"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                      {primaryImageIndex === index && (
                        <div className="primary-badge">Cover Photo</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-divider" />

            {/* Section 2: Basic Details */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-number">2</span>
                <h2 className="section-title">Item Details</h2>
              </div>
              <p className="section-subtitle">
                Tell buyers about your item. Be descriptive!
              </p>

              <div className="form-grid single">
                {/* Description */}
                <div className="form-field">
                  <label className="field-label">
                    Description <span className="required-star">*</span>
                  </label>
                  <textarea
                    className={`custom-input custom-textarea ${errors.description ? 'error' : ''}`}
                    rows={4}
                    placeholder="Describe your item... Include details like fit, style, any flaws, and why you're selling it."
                    value={formData.description}
                    onChange={handleFormChange('description')}
                  />
                  {errors.description && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-grid" style={{ marginTop: '24px' }}>
                {/* Category */}
                <div className="form-field">
                  <label className="field-label">
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    className={`custom-select ${errors.clothing_type ? 'error' : ''}`}
                    value={formData.clothing_type}
                    onChange={handleFormChange('clothing_type')}
                  >
                    <option value="">Select category...</option>
                    {Object.entries(CLOTHING_CATEGORIES).map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map(item => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.clothing_type && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.clothing_type}
                    </div>
                  )}
                </div>

                {/* Condition */}
                <div className="form-field">
                  <label className="field-label">
                    Condition <span className="required-star">*</span>
                  </label>
                  <select
                    className={`custom-select ${errors.condition ? 'error' : ''}`}
                    value={formData.condition}
                    onChange={handleFormChange('condition')}
                  >
                    <option value="">Select condition...</option>
                    {CONDITIONS.map(cond => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                  {errors.condition && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.condition}
                    </div>
                  )}
                </div>

                {/* Size */}
                <div className="form-field">
                  <label className="field-label">
                    Size <span className="required-star">*</span>
                  </label>
                  <select
                    className={`custom-select ${errors.size ? 'error' : ''}`}
                    value={formData.size}
                    onChange={handleFormChange('size')}
                  >
                    <option value="">Select size...</option>
                    {Object.entries(SIZES).map(([category, sizes]) => (
                      <optgroup key={category} label={category}>
                        {sizes.map(size => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.size && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.size}
                    </div>
                  )}
                </div>

                {/* Color */}
                <div className="form-field">
                  <label className="field-label">
                    Color <span className="required-star">*</span>
                  </label>
                  <select
                    className={`custom-select ${errors.color ? 'error' : ''}`}
                    value={formData.color}
                    onChange={handleFormChange('color')}
                  >
                    <option value="">Select color...</option>
                    {COLORS.map(color => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                  {errors.color && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.color}
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div className="form-field">
                  <label className="field-label">
                    Brand <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="e.g., Nike, Zara, Levi's"
                    value={formData.brand}
                    onChange={handleFormChange('brand')}
                  />
                  <p className="field-hint">Brand names help buyers find your item</p>
                </div>

                {/* Price */}
                <div className="form-field">
                  <label className="field-label">
                    Price <span className="optional-tag">(Optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>$</span>
                    <input
                      type="number"
                      className={`custom-input ${errors.sell_price ? 'error' : ''}`}
                      style={{ paddingLeft: '32px' }}
                      placeholder="0.00"
                      value={formData.sell_price}
                      onChange={handleFormChange('sell_price')}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.sell_price && (
                    <div className="error-message">
                      <ErrorIcon style={{ fontSize: '1rem' }} />
                      {errors.sell_price}
                    </div>
                  )}
                  <p className="field-hint">Leave blank for swap-only listings</p>
                </div>
              </div>
            </div>

            <div className="section-divider" />

            {/* Section 3: Material Composition */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-number">3</span>
                <h2 className="section-title">Material Composition</h2>
              </div>
              <p className="section-subtitle">
                Check the care tag on your item for this info. It helps calculate sustainability impact!
              </p>

              <div className="material-section">
                {/* Quick Select Common Materials */}
                {!skipMaterials && (
                  <div className="common-materials">
                    <p className="common-materials-label">Quick select common materials:</p>
                    <div className="material-chips">
                      {COMMON_MATERIALS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="material-chip"
                          onClick={() => applyMaterialPreset(preset)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!skipMaterials && (
                  <>
                    <div className="material-header" style={{ marginTop: '24px' }}>
                      <span className="field-label" style={{ margin: 0 }}>Custom composition</span>
                      <span className={`material-total ${
                        totalPercentage === 100 ? 'complete' :
                        totalPercentage > 100 ? 'over' : 'incomplete'
                      }`}>
                        {totalPercentage}% {totalPercentage === 100 && '✓'}
                      </span>
                    </div>

                    {materialComposition.map((item, index) => (
                      <div key={index} className="material-row">
                        <select
                          className="custom-select material-select"
                          value={item.material}
                          onChange={handleMaterialChange(index, 'material')}
                        >
                          <option value="">Select material...</option>
                          {MATERIALS.map(mat => (
                            <option
                              key={mat.value}
                              value={mat.value}
                              disabled={getUsedMaterials(index).includes(mat.value)}
                            >
                              {mat.label}
                            </option>
                          ))}
                        </select>

                        <div className="material-percentage" style={{ position: 'relative' }}>
                          <input
                            type="number"
                            className="custom-input"
                            placeholder="0"
                            value={item.percentage}
                            onChange={handleMaterialChange(index, 'percentage')}
                            min="1"
                            max="100"
                            style={{ paddingRight: '32px' }}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6b7280'
                          }}>%</span>
                        </div>

                        <button
                          type="button"
                          className="material-remove-btn"
                          onClick={() => handleRemoveMaterial(index)}
                          disabled={materialComposition.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    ))}

                    {materialComposition.length < 5 && (
                      <button
                        type="button"
                        className="add-material-btn"
                        onClick={handleAddMaterial}
                      >
                        <AddIcon fontSize="small" />
                        Add Another Material
                      </button>
                    )}
                  </>
                )}

                {errors.materialComposition && !skipMaterials && (
                  <div className="error-message" style={{ marginTop: '12px' }}>
                    <ErrorIcon style={{ fontSize: '1rem' }} />
                    {errors.materialComposition}
                  </div>
                )}

                {/* Skip Materials Toggle */}
                <div className="skip-materials-container">
                  <label className="skip-materials-toggle">
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={skipMaterials}
                      onChange={(e) => setSkipMaterials(e.target.checked)}
                    />
                    <span className="toggle-switch" />
                    <div className="skip-materials-text">
                      <p className="skip-materials-label">I don't know the materials</p>
                      <p className="skip-materials-hint">
                        No worries! We'll list it as unknown and you can update later.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="section-divider" />

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                  {isUploading ? 'Uploading photos...' : 'Creating listing...'}
                </>
              ) : (
                <>
                  <PublishIcon className="submit-btn-icon" />
                  List My Item
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadItem;
