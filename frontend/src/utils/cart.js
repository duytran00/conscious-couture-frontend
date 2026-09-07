import ClothingAPI from './api';

/**
 * Normalizes batch availability response from backend
 */
const normalizeBatchAvailability = (batchResponse) => {
  if (Array.isArray(batchResponse)) {
    return batchResponse;
  }

  if (Array.isArray(batchResponse?.items)) {
    return batchResponse.items;
  }

  if (Array.isArray(batchResponse?.results)) {
    return batchResponse.results;
  }

  return [];
};

/**
 * Builds availability entry with status and message
 */
const buildEntry = (item, payload) => {
  const isAvailable = payload?.available !== false;
  return {
    available: isAvailable,
    message: isAvailable
      ? 'Available'
      : payload?.unavailable_reason || payload?.message || 'Not available right now',
  };
};

/**
 * Maps backend ID to frontend ID
 */
const mapBackendIdToFrontendId = (backendItem) => {
  return backendItem?.clothing_id ?? backendItem?.id;
};

/**
 * Validates availability of items in cart
 * Returns a map keyed by item id with shape: { available: boolean, message: string }
 */
export const validateCartItemAvailability = async (cartItems = []) => {
  const results = {};

  if (cartItems.length === 0) {
    return results;
  }

  const ids = cartItems.map((item) => item.id);

  try {
    const batchResponse = await ClothingAPI.getCartAvailability(ids);
    const entries = normalizeBatchAvailability(batchResponse);

    if (entries.length > 0) {
      const byClothingId = new Map(
        entries
          .filter((entry) => entry && mapBackendIdToFrontendId(entry) !== undefined && mapBackendIdToFrontendId(entry) !== null)
          .map((entry) => [String(mapBackendIdToFrontendId(entry)), entry])
      );

      cartItems.forEach((item) => {
        const payload = byClothingId.get(String(item.id));
        if (payload) {
          results[item.id] = buildEntry(item, payload);
        } else {
          // Missing entry from backend response defaults to available to avoid blocking checkout.
          results[item.id] = {
            available: true,
            message: 'Availability check unavailable',
          };
        }
      });

      return results;
    }
  } catch {
    // Fallback to per-item checks when batch endpoint is unavailable.
  }

  await Promise.all(
    cartItems.map(async (item) => {
      try {
        const response = await ClothingAPI.getClothingItem(item.id);
        results[item.id] = buildEntry(item, response);
      } catch {
        // Keep UX resilient: if validation fails, do not block item by default.
        results[item.id] = {
          available: true,
          message: 'Availability check unavailable',
        };
      }
    })
  );

  return results;
};

/**
 * Calculates cart totals and validates state
 */
export const calculateCartTotals = (cartItems = [], cartAvailability = {}, isChecking = false) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  const subtotalCents = Math.round(parseFloat(subtotal) * 100); // Convert to cents for Stripe

  const hasUnavailableItems = cartItems.some(
    (item) => cartAvailability[item.id]?.available === false
  );

  const canCheckout = cartItems.length > 0 && !hasUnavailableItems && !isChecking;

  return {
    subtotal,
    subtotalCents,
    hasUnavailableItems,
    canCheckout,
  };
};

/**
 * Removes an item from the cart
 */
export const removeCartItem = (cartItems = [], itemId) => {
  return cartItems.filter((item) => item.id !== itemId);
};
