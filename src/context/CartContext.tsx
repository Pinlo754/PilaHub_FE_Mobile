import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartLine, getCartSummary, saveCart, addToCart as svcAddToCart, updateQuantity as svcUpdateQuantity, removeFromCart as svcRemoveFromCart, clearCart as svcClearCart } from '../services/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CartState = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
};

type CartContextValue = CartState & {
  userId: string;
  loadCart: (userId?: string) => Promise<void>;
  addToCart: (item: Omit<CartLine, 'quantity'>, qty?: number) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>('guest');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // load cart helper must be defined before effect to avoid hook dependency warnings
  const loadCart = async (uid?: string) => {
    const id = uid ?? userId ?? 'guest';
    try {
      const s = await getCartSummary(id);
      setLines(s.lines || []);
      setTotalItems(s.totalItems || 0);
      setTotalPrice(s.totalPrice || 0);
    } catch (e) {
      console.warn('CartProvider.loadCart error', e);
      setLines([]);
      setTotalItems(0);
      setTotalPrice(0);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const rawId = await AsyncStorage.getItem('id');
        let uid: string | null = null;
        try { uid = rawId ? JSON.parse(rawId) : rawId; } catch { uid = rawId; }
        const final = uid ? String(uid) : 'guest';
        setUserId(final);
        await loadCart(final);
      } catch { /* ignore */ }
    })();
  }, []);

  const addToCart = async (item: Omit<CartLine, 'quantity'>, qty = 1) => {
    const id = userId ?? 'guest';
    try {
      const updated = await svcAddToCart(id, item, qty);
      await saveCart(id, updated);
      // refresh local state
      const s = await getCartSummary(id);
      setLines(s.lines || []);
      setTotalItems(s.totalItems || 0);
      setTotalPrice(s.totalPrice || 0);
    } catch (e) {
      console.warn('CartProvider.addToCart error', e);
      throw e;
    }
  };

  const updateQuantity = async (productId: string, qty: number) => {
    const id = userId ?? 'guest';
    try {
      const updated = await svcUpdateQuantity(id, productId, qty);
      await saveCart(id, updated);
      const s = await getCartSummary(id);
      setLines(s.lines || []);
      setTotalItems(s.totalItems || 0);
      setTotalPrice(s.totalPrice || 0);
    } catch (e) {
      console.warn('CartProvider.updateQuantity error', e);
      throw e;
    }
  };

  const removeFromCart = async (productId: string) => {
    const id = userId ?? 'guest';
    try {
      const updated = await svcRemoveFromCart(id, productId);
      await saveCart(id, updated);
      const s = await getCartSummary(id);
      setLines(s.lines || []);
      setTotalItems(s.totalItems || 0);
      setTotalPrice(s.totalPrice || 0);
    } catch (e) {
      console.warn('CartProvider.removeFromCart error', e);
      throw e;
    }
  };

  const clearCart = async () => {
    const id = userId ?? 'guest';
    try {
      await svcClearCart(id);
      setLines([]);
      setTotalItems(0);
      setTotalPrice(0);
    } catch (e) {
      console.warn('CartProvider.clearCart error', e);
      throw e;
    }
  };

  const value: CartContextValue = {
    userId,
    lines,
    totalItems,
    totalPrice,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
