import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/services/database';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  addedAt: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
  getOriginalTotal: () => number;
  getSavings: () => number;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  syncCartWithProducts: (latestProducts: Product[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'marasim_cart_v2';
const FAVORITES_KEY = 'marasim_favorites_v2';
const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const isInitialized = useRef(false);

  // Load persisted data
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CART_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
    ]).then(([cartData, favData]) => {
      if (cartData) {
        try {
          const parsed = JSON.parse(cartData);
          if (Array.isArray(parsed)) setItems(parsed);
        } catch { /* ignore corrupt data */ }
      }
      if (favData) {
        try {
          const parsed = JSON.parse(favData);
          if (Array.isArray(parsed)) setFavorites(parsed);
        } catch { /* ignore corrupt data */ }
      }
      isInitialized.current = true;
    });
  }, []);

  // Persist cart changes
  useEffect(() => {
    if (isInitialized.current) {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
    }
  }, [items]);

  // Persist favorites changes
  useEffect(() => {
    if (isInitialized.current) {
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
    }
  }, [favorites]);

  // Sync cart product data with latest from database
  const syncCartWithProducts = useCallback((latestProducts: Product[]) => {
    if (latestProducts.length === 0) return;
    const productMap = new Map(latestProducts.map(p => [p.id, p]));

    setItems(prev => {
      let hasChanges = false;
      const updated = prev
        .map(item => {
          const latestProduct = productMap.get(item.product.id);
          if (!latestProduct) return item; // Keep even if not found (may have been hidden)

          // Check if product data changed
          if (
            latestProduct.price !== item.product.price ||
            latestProduct.name !== item.product.name ||
            latestProduct.image !== item.product.image ||
            latestProduct.in_stock !== item.product.in_stock ||
            latestProduct.original_price !== item.product.original_price
          ) {
            hasChanges = true;
            return { ...item, product: latestProduct };
          }
          return item;
        })
        .filter(item => {
          // Remove out-of-stock items
          const latestProduct = productMap.get(item.product.id);
          if (latestProduct && !latestProduct.in_stock) {
            hasChanges = true;
            return false;
          }
          return true;
        });

      return hasChanges ? updated : prev;
    });
  }, []);

  const addItem = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) return;

    setItems(prev => {
      if (prev.length >= MAX_CART_ITEMS) return prev;

      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, MAX_ITEM_QUANTITY);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty, product };
        return updated;
      }

      return [...prev, { product, quantity, selectedSize: size, selectedColor: color, addedAt: Date.now() }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    setItems(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    const safeQty = Math.min(quantity, MAX_ITEM_QUANTITY);
    setItems(prev => prev.map(item =>
      item.product.id === productId && item.selectedSize === size && item.selectedColor === color
        ? { ...item, quantity: safeQty }
        : item
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const getOriginalTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const price = item.product.original_price || item.product.originalPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const getSavings = useCallback(() => {
    return getOriginalTotal() - getTotal();
  }, [getOriginalTotal, getTotal]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotal,
    getOriginalTotal,
    getSavings,
    favorites,
    toggleFavorite,
    isFavorite,
    syncCartWithProducts,
  }), [
    items, addItem, removeItem, updateQuantity, clearCart,
    getItemCount, getTotal, getOriginalTotal, getSavings,
    favorites, toggleFavorite, isFavorite, syncCartWithProducts,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
