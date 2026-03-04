import { Platform } from 'react-native';

export const theme = {
  // Primary palette
  primary: '#C8A96E',
  primaryLight: '#D4BA85',
  primaryDark: '#B08D4F',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundDark: '#0A0A0A',
  backgroundSecondary: '#F5F1EB',
  backgroundCream: '#FAF7F2',
  
  // Surfaces
  surface: '#FFFFFF',
  surfaceDark: '#1A1A1A',
  surfaceElevated: '#FFFFFF',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#F5F1EB',
  textGold: '#C8A96E',
  textWhite: '#FFFFFF',
  textMuted: '#9CA3AF',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#2A2A2A',
  borderGold: '#C8A96E',
  
  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Discount
  discount: '#EF4444',
  discountBg: '#FEE2E2',
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Border Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  // Shadows
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  
  shadowElevated: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
};

// Typography scale
export const typography = {
  heroPrice: { fontSize: 32, fontWeight: '700' as const },
  pageTitle: { fontSize: 24, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const },
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
  productName: { fontSize: 14, fontWeight: '600' as const },
  productPrice: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  badge: { fontSize: 11, fontWeight: '600' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  tabLabel: { fontSize: 11, fontWeight: '600' as const },
};
