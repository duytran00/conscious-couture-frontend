const API_BASE_URL = 'http://localhost:8000/api/v1';
const CART_AVAILABILITY_PATH =
  import.meta.env.VITE_CART_AVAILABILITY_ENDPOINT || '/clothing/availability';

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

class ClothingAPI {
  static async getClothingItems(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.per_page) params.append('per_page', filters.per_page);
      if (filters.clothing_type) params.append('clothing_type', filters.clothing_type);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.size) params.append('size', filters.size);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);

      const response = await fetch(`${API_BASE_URL}/clothing/?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching clothing items:', error);
      throw error;
    }
  }

  static async getSales(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/sales${queryString ? `?${queryString}` : ''}`;
      console.log("Fetching sales from:", url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to fetch sales (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  static async getClothingItem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Clothing item not found');
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('Get item error:', JSON.stringify(errorData, null, 2));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching clothing item:', error);
      throw error;
    }
  }

  static async getMyItems(status = 'available') {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE_URL}/clothing/my-items?${params}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching my items:', error);
      throw error;
    }
  }


  static async getOwnerInfo(clothingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/owner-info/${clothingId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching owner info:', error);
      throw error;
    }
  }

  static async getClothingTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/categories/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching clothing types:', error);
      return [];
    }
  }

  static async getBrands() {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/brands/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  static async getSizes() {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/sizes/`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sizes:', error);
      return [];
    }
  }

  // Get owner's name for the item (legacy endpoint via users)
  static async getName(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
    catch (error) {
      console.error('Error fetching name:', error);
      return [];
    }
  }

  // Create a new clothing item
  static async createClothingItem(clothingData) {
    try {
      const token = localStorage.getItem("token")
      console.log("TOKEN:", token)
      console.log("Sending clothing data:", clothingData);
      const response = await fetch(`${API_BASE_URL}/clothing/`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clothingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API validation error:', JSON.stringify(errorData, null, 2));
        const message = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail || errorData);
        throw new Error(message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating clothing item:', error);
      throw error;
    }
  }

  // Update an existing clothing item (requires ownership)
  static async updateClothingItem(id, clothingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(clothingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating clothing item:', error);
      throw error;
    }
  }

  // Delete a clothing item (requires ownership)
  static async deleteClothingItem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      throw error;
    }
  }

  /**
   * Get sustainability metrics for a specific clothing item
   */
  static async getSustainabilityMetrics(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/${id}/sustainability`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sustainability data not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sustainability metrics:', error);
      throw error;
    }
  }

  // Get swap impact analysis for two clothing items
  static async getSwapImpactAnalysis(clothingId1, clothingId2, transportDistance = null, transportMethod = 'car') {
    try {
      const params = new URLSearchParams();

      if (transportDistance) {
        params.append('transport_distance_km', transportDistance);
      }
      if (transportMethod) {
        params.append('transport_method', transportMethod);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/clothing/swap-impact/${clothingId1}/${clothingId2}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('One or both clothing items not found');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Invalid swap request');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching swap impact analysis:', error);
      throw error;
    }
  }

  // Create a payment intent for a clothing item purchase
  static async createPayment(clothing_id, amount, buyer_user_id) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clothing_id,
          amount,
          buyer_user_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create payment: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // Get payment details by payment ID
  static async getPayment(payment_id) {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/${payment_id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  // Purchase a clothing item
  static async purchaseClothingItem(clothing_id, buyer_user_id) {
    try {
      const response = await fetch(`${API_BASE_URL}/clothing/${clothing_id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_user_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to purchase item: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing clothing item:', error);
      throw error;
    }
  }

  /**
   * Get cart item availability in a single request
   */
  static async getCartAvailability(clothingIds = []) {
    try {
      const normalizedIds = [...new Set(clothingIds.filter((id) => id !== null && id !== undefined))];

      const response = await fetch(`${API_BASE_URL}${CART_AVAILABILITY_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clothing_ids: normalizedIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to fetch cart availability: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cart availability:', error);
      throw error;
    }
  }

  /**
   * Start Stripe Connect onboarding for the current seller.
   * Creates an Express account if needed and returns the onboarding URL.
   */
  static async createStripeConnectOnboarding({ refresh_url, return_url }) {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe-connect/onboarding`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ refresh_url, return_url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start onboarding: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Stripe Connect onboarding link:', error);
      throw error;
    }
  }

  /**
   * Get the current seller's Stripe Connect account status
   */
  static async getStripeAccountStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe-connect/account-status`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch account status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Stripe account status:', error);
      throw error;
    }
  }

  /**
   * Get a Stripe Express Dashboard login link for the seller
   */
  static async getStripeDashboardLink() {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe-connect/dashboard-link`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to get dashboard link: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Stripe dashboard link:', error);
      throw error;
    }
  }

  /**
   * Get seller's orders
   */
  static async getSellerOrders(status = null) {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`${API_BASE_URL}/stripe-connect/seller-orders${params}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch seller orders: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  }

  /**
   * Get seller's balance summary
   */
  static async getSellerBalance() {
    try {
      const response = await fetch(`${API_BASE_URL}/stripe-connect/seller-balance`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch seller balance: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching seller balance:', error);
      throw error;
    }
  }

  /**
   * Mark an order as delivered (buyer confirms receipt)
   */
  static async markOrderDelivered(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/mark-delivered`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to mark delivered: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking order delivered:', error);
      throw error;
    }
  }

  /**
   * Mark an order as shipped (seller confirms shipment with tracking info)
   */
  static async markOrderShipped(orderId, { trackingNumber, shippingLabelUrl, sellerNotes } = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/mark-shipped`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          tracking_number: trackingNumber || null,
          shipping_label_url: shippingLabelUrl || null,
          seller_notes: sellerNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to mark shipped: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking order shipped:', error);
      throw error;
    }
  }
  

  // Get top sustainable users leaderboard
  static async getLeaderboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/leaderboard/top-sustainable`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
}

class SwapAPI {
  /** Get all swaps for the current user */
  static async getMySwaps(status = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/swaps/?${params}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to load swaps (${response.status})`);
    }
    return await response.json();
  }

  /** Get a specific swap by ID */
  static async getSwap(swapId) {
    const response = await fetch(`${API_BASE_URL}/swaps/${swapId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to load swap (${response.status})`);
    }
    return await response.json();
  }

  /** Create a new swap request */
  static async createSwap(myClothingId, targetClothingId, message = null) {
    const response = await fetch(`${API_BASE_URL}/swaps/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        my_clothing_id: myClothingId,
        target_clothing_id: targetClothingId,
        message: message,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create swap (${response.status})`);
    }
    return await response.json();
  }

  /** Accept or reject a swap */
  static async respondToSwap(swapId, action) {
    const response = await fetch(`${API_BASE_URL}/swaps/${swapId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to ${action} swap (${response.status})`);
    }
    return await response.json();
  }

  /** Cancel a pending swap request */
  static async cancelSwap(swapId) {
    const response = await fetch(`${API_BASE_URL}/swaps/${swapId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to cancel swap (${response.status})`);
    }
    return await response.json();
  }
}

class CartAPI {
  /** Fetch current user's cart */
  static async getCart() {
    const response = await fetch(`${API_BASE_URL}/cart/`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to load cart (${response.status})`);
    }
    return await response.json(); // { items, count, total }
  }

  /** Add an item to the cart */
  static async addToCart(clothingId) {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ clothing_id: clothingId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to add to cart (${response.status})`);
    }
    return await response.json();
  }

  /** Remove a single item from the cart */
  static async removeFromCart(clothingId) {
    const response = await fetch(`${API_BASE_URL}/cart/${clothingId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to remove from cart (${response.status})`);
    }
    return await response.json();
  }

  /** Clear the entire cart */
  static async clearCart() {
    const response = await fetch(`${API_BASE_URL}/cart/clear`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to clear cart (${response.status})`);
    }
    return await response.json();
  }

  /** Validate all cart items are still available */
  static async validateCart() {
    const response = await fetch(`${API_BASE_URL}/cart/validate`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to validate cart (${response.status})`);
    }
    return await response.json();
  }

  /** Initiate checkout */
  static async checkout() {
    const response = await fetch(`${API_BASE_URL}/cart/checkout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Checkout failed (${response.status})`);
    }
    return await response.json();
  }

  /** Confirm purchase completed */
  static async completePurchase(saleIds) {
    const response = await fetch(`${API_BASE_URL}/cart/complete`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ sale_ids: saleIds }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to complete purchase (${response.status})`);
    }
    return await response.json();
  }
}

export default ClothingAPI;
export { CartAPI, SwapAPI };