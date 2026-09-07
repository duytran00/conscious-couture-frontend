import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartAPI } from '../utils/api';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const _applyCartResponse = (data) => {
        setCart(data.items || []);
        setCartCount(data.count || 0);
        setCartTotal(data.total || 0);
    };

    /** Fetch cart from server — call on login / app mount when authenticated */
    const fetchCart = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCart([]);
            setCartCount(0);
            setCartTotal(0);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await CartAPI.getCart();
            _applyCartResponse(data);
        } catch (err) {
            // Gracefully handle 404 (cart endpoint not deployed yet) or network errors
            console.warn('Cart fetch failed (this is OK if backend cart is not set up yet):', err.message);
            setCart([]);
            setCartCount(0);
            setCartTotal(0);
        } finally {
            setLoading(false);
        }
    }, []);

    /** Add item to cart (server-side) */
    const addToCart = useCallback(async (clothingId) => {
        setError(null);
        try {
            await CartAPI.addToCart(clothingId);
            const data = await CartAPI.getCart();
            _applyCartResponse(data);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    /** Remove single item */
    const removeFromCart = useCallback(async (clothingId) => {
        setError(null);
        try {
            await CartAPI.removeFromCart(clothingId);
            const data = await CartAPI.getCart();
            _applyCartResponse(data);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    /** Clear all items (server-side) */
    const clearCart = useCallback(async () => {
        setError(null);
        try {
            await CartAPI.clearCart();
        } catch (err) {
            console.warn('Clear cart failed:', err.message);
        }
        setCart([]);
        setCartCount(0);
        setCartTotal(0);
    }, []);

    /** Wipe local state only — used on logout (no server call) */
    const resetCartLocal = useCallback(() => {
        setCart([]);
        setCartCount(0);
        setCartTotal(0);
        setError(null);
    }, []);

    /** Check if a clothing_id is currently in cart */
    const isInCart = useCallback(
        (clothingId) => cart.some((item) => item.clothing_id === clothingId),
        [cart]
    );

    const value = {
        cart,
        cartCount,
        cartTotal,
        loading,
        error,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
        resetCartLocal,
        isInCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
