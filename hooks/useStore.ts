import { useContext, useEffect } from 'react';
import { StoreContext, StoreContextType } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  const { syncCartWithProducts } = useCart();

  // Sync cart product data whenever products update
  useEffect(() => {
    if (context.products.length > 0) {
      syncCartWithProducts(context.products);
    }
  }, [context.products, syncCartWithProducts]);

  return context;
}
