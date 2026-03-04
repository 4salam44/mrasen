import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBrandIdentity, BrandIdentity, DEFAULT_BRAND, invalidateCache, getBrandAssetUrl } from '@/services/database';

export interface BrandContextType {
  brand: BrandIdentity;
  loading: boolean;
  refreshBrand: () => Promise<void>;
}

export const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandIdentity>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const loadBrand = useCallback(async () => {
    const { data } = await fetchBrandIdentity();
    if (data) {
      // Resolve brand asset URLs from storage paths
      if (data.logo_url) data.logo_url = getBrandAssetUrl(data.logo_url);
      if (data.icon_url) data.icon_url = getBrandAssetUrl(data.icon_url);
      setBrand(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  const refreshBrand = useCallback(async () => {
    invalidateCache('brand_identity');
    const { data } = await fetchBrandIdentity();
    if (data) {
      if (data.logo_url) data.logo_url = getBrandAssetUrl(data.logo_url);
      if (data.icon_url) data.icon_url = getBrandAssetUrl(data.icon_url);
      setBrand(data);
    }
  }, []);

  const contextValue = useMemo<BrandContextType>(() => ({
    brand,
    loading,
    refreshBrand,
  }), [brand, loading, refreshBrand]);

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
}
