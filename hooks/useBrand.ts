import { useContext } from 'react';
import { BrandContext, BrandContextType } from '@/contexts/BrandContext';

export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return context;
}
