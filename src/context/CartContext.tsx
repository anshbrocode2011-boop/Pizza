import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, PizzaSize } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface CartContextType {
  cart: Cart;
  loading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (pizzaId: string, size?: PizzaSize, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateSize: (itemId: string, size: PizzaSize) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  refreshCart: () => Promise<void>;
}

const defaultCart: Cart = {
  items: [],
  quantity: 0,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
};

const normalizeCart = (c?: Partial<Cart> | null): Cart => {
  if (!c) return defaultCart;
  const items = Array.isArray(c.items)
    ? c.items.map(item => ({
        ...item,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : (item.unitPrice || 0) * (item.quantity || 1),
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      }))
    : [];
  const quantity = typeof c.quantity === 'number' ? c.quantity : items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = typeof c.subtotal === 'number' ? c.subtotal : items.reduce((sum, i) => sum + i.totalPrice, 0);
  const deliveryFee = typeof c.deliveryFee === 'number' ? c.deliveryFee : (subtotal >= 40 || subtotal === 0 ? 0 : 3.99);
  const total = typeof c.total === 'number' ? c.total : (subtotal + deliveryFee);

  return {
    items,
    quantity,
    subtotal,
    deliveryFee,
    total,
  };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    try {
      const data = await apiRequest<{ cart: Cart }>('/api/cart');
      if (data?.cart) {
        setCart(normalizeCart(data.cart));
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [user?.id, refreshCart]);

  const addToCart = async (pizzaId: string, size: PizzaSize = 'Medium', quantity: number = 1) => {
    setLoading(true);
    try {
      const data = await apiRequest<{ message: string; cart: Cart }>('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ pizzaId, size, quantity }),
      });
      setCart(normalizeCart(data.cart));
      showToast('Added to Cart', data.message, 'success', 3000);
    } catch (err: any) {
      showToast('Cart Error', err.message || 'Could not add pizza to cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const data = await apiRequest<{ cart: Cart }>(`/api/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      setCart(normalizeCart(data.cart));
    } catch (err: any) {
      showToast('Cart Error', err.message || 'Could not update item', 'error');
    }
  };

  const updateSize = async (itemId: string, size: PizzaSize) => {
    try {
      const data = await apiRequest<{ cart: Cart }>(`/api/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ size }),
      });
      setCart(normalizeCart(data.cart));
    } catch (err: any) {
      showToast('Cart Error', err.message || 'Could not change size', 'error');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const data = await apiRequest<{ message: string; cart: Cart }>(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });
      setCart(normalizeCart(data.cart));
      showToast('Item Removed', 'Pizza removed from your order', 'info', 2000);
    } catch (err: any) {
      showToast('Cart Error', err.message || 'Could not remove item', 'error');
    }
  };

  const clearCart = async () => {
    try {
      const data = await apiRequest<{ cart: Cart }>('/api/cart', {
        method: 'DELETE',
      });
      setCart(normalizeCart(data.cart));
    } catch (err: any) {
      showToast('Cart Error', err.message || 'Could not clear cart', 'error');
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        updateSize,
        removeItem,
        clearCart,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
