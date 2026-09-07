import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import ClothingAPI, { SwapAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SwapModal = ({ isOpen, onClose, targetItem }) => {
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    size: '',
    condition: '',
    clothing_type: '',
    brand: '',
    color: '',
    image: null
  });
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Load user's existing items when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadUserItems();
    } else if (isOpen && !isAuthenticated) {
      setError('Please sign in to request a swap.');
    }
  }, [isOpen, isAuthenticated]);

  const loadUserItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ClothingAPI.getMyItems('available');

      const transformedItems = response.items
        .filter(item => item.clothing_id !== targetItem?.id) // Exclude target item (safety)
        .map(item => ({
          id: item.clothing_id,
          name: item.description || 'No description',
          size: item.size,
          condition: capitalizeCondition(item.condition),
          image: item.primary_image_url || "/api/placeholder/200/250",
          description: item.description || 'No description available',
          brand: item.brand,
          clothing_type: item.clothing_type,
          material_composition: item.material_composition,
          owner_user_id: item.owner_user_id,
        }));

      setUserItems(transformedItems);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('log in')) {
        setError('Please sign in to view your items.');
      } else {
        setError('Failed to load your items. Please try again.');
      }
      console.error('Failed to load user items:', err);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeCondition = (condition) => {
    if (!condition) return 'Good';
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewItem(prev => ({ ...prev, image: file }));
    }
  };

  const handleConfirmSwap = async () => {
    try {
      setCreatingItem(true);
      setError(null);

      let swapItem = selectedItem;

      // If creating a new item, save it first
      if (activeTab === 'new') {
        const newClothingData = {
          clothing_type: newItem.clothing_type || 't-shirt',
          brand: newItem.brand || null,
          description: newItem.name,
          size: newItem.size,
          color: newItem.color || null,
          condition: newItem.condition.toLowerCase().replace(/ /g, '_'),
          material_composition: { 'cotton_conventional': 70, 'polyester': 30 },
          primary_image_url: null,
          additional_images: []
        };

        const createdItem = await ClothingAPI.createClothingItem(newClothingData);

        swapItem = {
          id: createdItem.clothing_id,
          name: createdItem.description,
          size: createdItem.size,
          condition: capitalizeCondition(createdItem.condition),
          description: createdItem.description,
          brand: createdItem.brand,
          clothing_type: createdItem.clothing_type,
          image: createdItem.primary_image_url || "/api/placeholder/200/250"
        };
      }
      // remove because you create swap in swapdetails when you confirm swap
      // ── Create the swap via the API ──
      // try {
      //   const swap = await SwapAPI.createSwap(swapItem.id, targetItem.id);
      //   console.log('Swap created:', swap);
      // } catch (swapErr) {
      //   // If swap creation fails, still navigate to details for UX
      //   console.error('Swap API call failed (falling back to local nav):', swapErr);
      // }

      const swapData = {
        targetItem,
        selectedItem: swapItem,
        timestamp: Date.now(),
        isNewItem: activeTab === 'new'
      };

      navigate('/swap/new', { state: swapData });
      onClose();

      // Reset form
      setSelectedItem(null);
      setNewItem({
        name: '', description: '', size: '', condition: '',
        clothing_type: '', brand: '', color: '', image: null
      });

    } catch (err) {
      setError(err.message || 'Failed to create swap. Please try again.');
      console.error('Failed to create swap:', err);
    } finally {
      setCreatingItem(false);
    }
  };

  const isConfirmDisabled = () => {
    if (creatingItem || loading || !isAuthenticated) {
      return true;
    }

    if (activeTab === 'existing') {
      return !selectedItem;
    } else {
      return !newItem.name || !newItem.size || !newItem.condition || !newItem.description;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Item to Swap"
      maxWidth="max-w-4xl"
    >
      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Not authenticated warning */}
        {!isAuthenticated && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p className="font-medium">Sign in required</p>
            <p className="text-sm mt-1">You need to be signed in to swap items.
              <button onClick={() => { onClose(); navigate('/login'); }} className="ml-2 text-indigo-600 font-medium underline">
                Sign in now
              </button>
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('existing')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'existing'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Select Existing Item
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'new'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Add New Item
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'existing' ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Choose from <strong>your own items</strong> to swap with "{targetItem?.name}"
            </p>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Loading your items...</span>
              </div>
            ) : userItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg font-medium">You don't have any items available for swapping.</p>
                <p className="text-sm mt-1">Upload an item first, or use the "Add New Item" tab.</p>
                <button
                  onClick={() => { onClose(); navigate('/upload'); }}
                  className="mt-3 text-indigo-600 font-medium hover:underline"
                >
                  Upload an Item →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {userItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${selectedItem?.id === item.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">Size {item.size} • {item.condition}</p>
                    {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                  </div>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-1">Selected Item</h4>
                <p className="text-sm text-gray-600">{selectedItem.name} - {selectedItem.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Add a new item to your collection and swap with "{targetItem?.name}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Photo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {newItem.image ? (
                      <div>
                        <img
                          src={URL.createObjectURL(newItem.image)}
                          alt="Preview"
                          className="mx-auto h-32 w-32 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm text-gray-600">Click to change photo</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Item Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input type="text" value={newItem.name} onChange={(e) => handleNewItemChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Vintage Band T-shirt" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clothing Type *</label>
                    <select value={newItem.clothing_type} onChange={(e) => handleNewItemChange('clothing_type', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Type</option>
                      <option value="t-shirt">T-Shirt</option>
                      <option value="shirt">Shirt</option>
                      <option value="blouse">Blouse</option>
                      <option value="sweater">Sweater</option>
                      <option value="jeans">Jeans</option>
                      <option value="pants">Pants</option>
                      <option value="shorts">Shorts</option>
                      <option value="dress">Dress</option>
                      <option value="jacket">Jacket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input type="text" value={newItem.brand} onChange={(e) => handleNewItemChange('brand', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Nike, H&M" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                    <select value={newItem.size} onChange={(e) => handleNewItemChange('size', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Size</option>
                      <option value="XS">XS</option><option value="S">S</option><option value="M">M</option>
                      <option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input type="text" value={newItem.color} onChange={(e) => handleNewItemChange('color', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                    <select value={newItem.condition} onChange={(e) => handleNewItemChange('condition', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select</option>
                      <option value="Like New">Like New</option><option value="Excellent">Excellent</option>
                      <option value="Good">Good</option><option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={newItem.description} onChange={(e) => handleNewItemChange('description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe the item..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSwap}
            disabled={isConfirmDisabled()}
            className="px-8 py-4 text-lg font-bold text-white bg-green-600 border-4 border-green-700 rounded-lg hover:bg-green-700 hover:border-green-800 disabled:bg-gray-400 disabled:border-gray-500 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
          >
            {creatingItem && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            )}
            {creatingItem ? 'CREATING ITEM...' : 'CONFIRM SWAP'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SwapModal;