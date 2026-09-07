import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from './CartContext';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'cc_auth_session';

const readStoredUser = () => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      if (parsed?.id && parsed?.token) {
        return {
          name: parsed.name || '',
          email: parsed.email || '',
          id: String(parsed.id),
          avatar: null,
        };
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const savedName = localStorage.getItem('userInput');
  const savedEmail = localStorage.getItem('userInput3');
  const savedId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  const token = localStorage.getItem('token');

  if (savedId && token) {
    return {
      name: savedName || '',
      email: savedEmail || '',
      id: String(savedId),
      avatar: null,
    };
  }

  return null;
};

const persistSession = ({ name = '', email = '', id = null, token = '' }) => {
  if (name) localStorage.setItem('userInput', name);
  if (email) localStorage.setItem('userInput3', email);
  if (id !== null && id !== undefined && id !== '') {
    localStorage.setItem('userId', String(id));
    localStorage.setItem('user_id', String(id));
  }
  if (token) localStorage.setItem('token', token);

  if (id !== null && id !== undefined && id !== '' && token) {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        name,
        email,
        id: String(id),
        token,
      })
    );
  }
};

const clearPersistedSession = () => {
  ['userInput', 'userInput3', 'userId', 'user_id', 'token', AUTH_STORAGE_KEY].forEach(
    (key) => localStorage.removeItem(key)
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const { fetchCart, resetCartLocal } = useCart();

  // Check for existing session on mount
  useEffect(() => {
    // Clean up stale key from old localStorage-based cart (no longer used)
    localStorage.removeItem('cc_cart_items');

    const storedUser = readStoredUser();

    if (storedUser) {
      setUser(storedUser);
      fetchCart();
    } else {
      setUser(null);
      resetCartLocal();
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (userData) => {
    const { name, email, id, token } = userData;

    persistSession({ name, email, id, token });

    setUser({
      name: name || '',
      email: email || '',
      id: id || null,
      avatar: null,
    });

    fetchCart();
  };

  const logout = () => {
    clearPersistedSession();
    setUser(null);
    resetCartLocal();
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updates };
      persistSession({
        name: nextUser?.name || '',
        email: nextUser?.email || '',
        id: nextUser?.id || '',
        token: localStorage.getItem('token') || '',
      });
      return nextUser;
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;