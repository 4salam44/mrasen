import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/template';
import {
  fetchCategories,
  fetchProducts,
  fetchPaymentMethods,
  fetchAppSettings,
  fetchOffers,
  fetchDeliveryZones,
  checkForUpdates,
  invalidateCache,
  Category,
  Product,
  PaymentMethod,
  Offer,
  DeliveryZone,
} from '@/services/database';

export interface StoreContextType {
  categories: Category[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  deliveryZones: DeliveryZone[];
  appSettings: Record<string, any>;
  offers: Offer[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  silentRefresh: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  getBestSellers: () => Product[];
  getNewArrivals: () => Product[];
  getDiscountedProducts: () => Product[];
  searchProducts: (query: string) => Product[];
  lastUpdated: number;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

const BACKGROUND_SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [appSettings, setAppSettings] = useState<Record<string, any>>({});
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Core data loading function
  const loadData = useCallback(async (silent: boolean = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (!silent) {
      if (hasLoadedRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
    }

    try {
      const [catResult, prodResult, payResult, settResult, offResult, dzResult] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchPaymentMethods(),
        fetchAppSettings(),
        fetchOffers(),
        fetchDeliveryZones(),
      ]);

      const errors: string[] = [];

      if (catResult.error) errors.push(catResult.error);
      else setCategories(catResult.data);

      if (prodResult.error) errors.push(prodResult.error);
      else setProducts(prodResult.data);

      if (payResult.error) errors.push(payResult.error);
      else setPaymentMethods(payResult.data);

      if (settResult.error) errors.push(settResult.error);
      else setAppSettings(settResult.data);

      if (offResult.error) errors.push(offResult.error);
      else setOffers(offResult.data);

      if (dzResult.error) errors.push(dzResult.error);
      else setDeliveryZones(dzResult.data);

      if (errors.length > 0 && !silent) {
        setError(errors[0]);
      } else {
        setError(null);
      }

      setLastUpdated(Date.now());
      hasLoadedRef.current = true;
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || 'خطأ في تحميل البيانات');
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-fetch when user auth state changes (login/logout)
  useEffect(() => {
    if (hasLoadedRef.current) {
      invalidateCache();
      loadData(true);
    }
  }, [user?.id]);

  // Background sync: check for updates periodically
  useEffect(() => {
    syncIntervalRef.current = setInterval(async () => {
      try {
        const hasUpdates = await checkForUpdates();
        if (hasUpdates) {
          invalidateCache('products');
          loadData(true);
        }
      } catch {
        // Silently ignore background sync errors
      }
    }, BACKGROUND_SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadData]);

  // Refresh data when app comes to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && hasLoadedRef.current) {
        const timeSinceLastUpdate = Date.now() - lastUpdated;
        if (timeSinceLastUpdate > BACKGROUND_SYNC_INTERVAL) {
          invalidateCache();
          loadData(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription?.remove();
  }, [loadData, lastUpdated]);

  // Public refresh (pull-to-refresh)
  const refreshData = useCallback(async () => {
    invalidateCache();
    await loadData(false);
  }, [loadData]);

  // Silent refresh (no loading indicators)
  const silentRefresh = useCallback(async () => {
    invalidateCache();
    await loadData(true);
  }, [loadData]);

  // Memoized selectors
  const getProductById = useCallback(
    (id: string): Product | undefined => products.find((p) => p.id === id),
    [products]
  );

  const getProductsByCategory = useCallback(
    (categoryId: string): Product[] => products.filter((p) => p.category_id === categoryId),
    [products]
  );

  const bestSellers = useMemo(
    () => products.filter((p) => p.is_best_seller),
    [products]
  );

  const newArrivals = useMemo(
    () => products.filter((p) => p.is_new),
    [products]
  );

  const discountedProducts = useMemo(
    () => products.filter((p) => p.discount && p.discount > 0).sort((a, b) => b.discount - a.discount),
    [products]
  );

  const getBestSellers = useCallback(() => bestSellers, [bestSellers]);
  const getNewArrivals = useCallback(() => newArrivals, [newArrivals]);
  const getDiscountedProducts = useCallback(() => discountedProducts, [discountedProducts]);

  const searchProductsLocal = useCallback(
    (query: string): Product[] => {
      if (!query?.trim()) return products;
      const lower = query.toLowerCase().trim();
      return products.filter(
        (p) =>
          p.name.includes(query) ||
          p.name.toLowerCase().includes(lower) ||
          (p.name_en && p.name_en.toLowerCase().includes(lower)) ||
          (p.description && p.description.includes(query)) ||
          (p.material && p.material.includes(query))
      );
    },
    [products]
  );

  const contextValue = useMemo<StoreContextType>(() => ({
    categories,
    products,
    paymentMethods,
    deliveryZones,
    appSettings,
    offers,
    loading,
    refreshing,
    error,
    refreshData,
    silentRefresh,
    getProductById,
    getProductsByCategory,
    getBestSellers,
    getNewArrivals,
    getDiscountedProducts,
    searchProducts: searchProductsLocal,
    lastUpdated,
  }), [
    categories, products, paymentMethods, deliveryZones, appSettings, offers,
    loading, refreshing, error, refreshData, silentRefresh,
    getProductById, getProductsByCategory, getBestSellers,
    getNewArrivals, getDiscountedProducts, searchProductsLocal, lastUpdated,
  ]);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}
