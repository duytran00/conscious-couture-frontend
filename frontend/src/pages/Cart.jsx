import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateCartItemAvailability, calculateCartTotals } from '../utils/cart';
import { useCart } from '../context/CartContext';

const BACKEND_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8000';
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ccircle cx='40' cy='32' r='12' fill='%23d1d5db'/%3E%3Crect x='18' y='50' width='44' height='10' rx='5' fill='%23d1d5db'/%3E%3C/svg%3E";

const resolveImageUrl = (url) => {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${BACKEND_ORIGIN}${url}`;
  }

  return `${BACKEND_ORIGIN}/${url}`;
};

const toCartItem = (item) => ({
  id: item.clothing_id,
  name: item.name || item.description || `Item #${item.clothing_id}`,
  clothingType: item.clothing_type || 'Item',
  size: item.size || 'N/A',
  price: parseFloat(item.price ?? item.sell_price ?? item.original_price ?? 0),
  brand: item.brand || 'Unknown brand',
  ownerName: item.owner_name || 'Unknown owner',
  imageUrl: resolveImageUrl(
    item.image ||
    item.thumbnail_url ||
      item.thumbnailUrl ||
      item.preview_image_url ||
    item.primary_image_url ||
      item.image_url ||
      item.primaryImageUrl ||
      item.imageUrl ||
      (Array.isArray(item.image_urls) ? item.image_urls[0] : null) ||
      (Array.isArray(item.images) ? item.images[0] : null)
  ),
});

const Cart = ({ onContinueToShipping }) => {
  const navigate = useNavigate();
  const { cart: serverCart, fetchCart, removeFromCart, loading: loadingCartContext, error: cartContextError } = useCart();

  // Cart state
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [cartAvailability, setCartAvailability] = useState({});
  const [checkingCartAvailability, setCheckingCartAvailability] = useState(false);

  // Load real items from the database on mount
  useEffect(() => {
    let isMounted = true;
    const loadItems = async () => {
      setLoadingCart(true);
      setCartError(null);
      try {
        await fetchCart();
        if (!isMounted) return;
      } catch (error) {
        if (isMounted) setCartError(error.message || 'Failed to load cart items.');
      } finally {
        if (isMounted) setLoadingCart(false);
      }
    };
    loadItems();
    return () => { isMounted = false; };
  }, [fetchCart]);

  useEffect(() => {
    setCart(serverCart.map(toCartItem));
  }, [serverCart]);

  useEffect(() => {
    if (cartContextError) {
      setCartError(cartContextError);
    }
  }, [cartContextError]);

  // Validate item availability on component mount and when cart changes
  useEffect(() => {
    if (cart.length === 0) return;
    let isMounted = true;

    const validateAvailability = async () => {
      setCheckingCartAvailability(true);

      try {
        const availability = await validateCartItemAvailability(cart);
        if (isMounted) {
          setCartAvailability(availability);
        }
      } finally {
        if (isMounted) {
          setCheckingCartAvailability(false);
        }
      }
    };

    validateAvailability();

    return () => {
      isMounted = false;
    };
  }, [cart]);

  // Handle item removal
  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  // Calculate totals and validation state
  const { subtotal, subtotalCents, hasUnavailableItems, canCheckout } = calculateCartTotals(
    cart,
    cartAvailability,
    checkingCartAvailability
  );

  // Handle continue to shipping
  const handleContinueToShipping = () => {
    if (canCheckout) {
      onContinueToShipping({ items: cart, subtotal, subtotalCents });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Cart</h2>

      {(loadingCart || loadingCartContext) && <p className="text-gray-500">Loading cart items...</p>}
      {cartError && <p className="text-sm text-red-500">{cartError}</p>}

      {!loadingCart && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Item List */}
        <div className="md:col-span-2 space-y-4">
          {cart.length === 0 && (
            <p className="text-gray-500">Your cart is empty.</p>
          )}

          {cart.map((item) => {
            const itemAvailability = cartAvailability[item.id];
            const isUnavailable = itemAvailability && itemAvailability.available === false;

            return (
              <div
                key={item.id}
                className="border rounded-md p-4 flex justify-between items-center"
              >
                <div
                  className={`flex items-center gap-2 transition-opacity ${
                    isUnavailable ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div
                    className="rounded-md overflow-hidden bg-gray-100 border border-gray-200"
                    style={{ width: '96px', height: '96px', flex: '0 0 96px' }}
                  >
                    <img
                      src={item.imageUrl || FALLBACK_IMAGE}
                      alt={item.clothingType}
                      className="w-full h-full object-cover"
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div>
                  <h3
                    className="font-normal leading-tight truncate text-gray-800"
                    style={{ fontSize: '20px' }}
                  >
                    {item.clothingType}
                  </h3>
                  <p className="text-sm text-gray-600">Brand: {item.brand}</p>
                  <p className="text-sm text-gray-600">Size: {item.size}</p>
                  <p className="text-sm text-gray-600">From: {item.ownerName}</p>
                  <p className="text-sm text-gray-800">
                    ${item.price.toFixed(2)}
                  </p>
                  {isUnavailable && (
                    <p className="text-sm text-red-600 font-semibold mt-1">
                      This item is not available.
                    </p>
                  )}
                </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="px-3 py-1 bg-red-500 text-black text-sm rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            );
          })}

          {checkingCartAvailability && cart.length > 0 && (
            <p className="text-sm text-gray-500">Checking item availability...</p>
          )}
        </div>

        {/* Totals */}
        <div className="border p-4 rounded-md h-fit">
          <h3 className="font-semibold text-lg">Order Summary</h3>

          <div className="flex justify-between mt-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">${subtotal}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/")}
          className="w-full bg-blue-600 text-black px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Return to Home
        </button>

        <button
          disabled={!canCheckout}
          onClick={handleContinueToShipping}
          className={`w-full bg-blue-600 text-black px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity ${
            canCheckout ? 'opacity-100' : 'opacity-50'
          }`}
        >
          Continue to Shipping
        </button>

        {hasUnavailableItems && (
          <p className="text-sm text-red-600 font-semibold text-center">
            Remove unavailable item(s) to continue to shipping.
          </p>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default Cart;
