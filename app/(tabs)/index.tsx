import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, Product } from '@/services/database';
import { useBrand } from '@/hooks/useBrand';
import * as Haptics from 'expo-haptics';

const safeHaptics = {
  selectionAsync: () => {
    try { Haptics.selectionAsync(); } catch {}
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const bannerImages = [
  { uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop&q=80' },
  { uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=400&fit=crop&q=80' },
];

const ProductCard = React.memo(function ProductCard({
  product,
  cardWidth,
  isFav,
  onPress,
  onFavorite,
}: {
  product: Product;
  cardWidth: number;
  isFav: boolean;
  onPress: () => void;
  onFavorite: () => void;
}) {
  return (
    <Pressable
      style={[styles.productCard, { width: cardWidth }]}
      onPress={onPress}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
          recyclingKey={product.id}
        />
        {product.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        ) : null}
        {product.is_new && !(product.discount > 0) ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>جديد</Text>
          </View>
        ) : null}
        <Pressable
          style={styles.favoriteBtn}
          onPress={onFavorite}
          hitSlop={8}
        >
          <MaterialIcons
            name={isFav ? 'favorite' : 'favorite-border'}
            size={20}
            color={isFav ? '#EF4444' : '#9CA3AF'}
          />
        </Pressable>
        {!product.in_stock ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>نفد المخزون</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.review_count})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
          {product.original_price ? (
            <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useCart();
  const { brand } = useBrand();
  const {
    categories,
    loading,
    refreshing,
    refreshData,
    getBestSellers,
    getNewArrivals,
    getDiscountedProducts,
    error,
  } = useStore();
  const [activeBanner, setActiveBanner] = useState(0);

  const bestSellers = getBestSellers();
  const newArrivals = getNewArrivals();
  const discounted = getDiscountedProducts();

  const handleProductPress = useCallback((id: string) => {
    safeHaptics.selectionAsync();
    router.push(`/product/${id}`);
  }, [router]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    safeHaptics.selectionAsync();
    router.push({ pathname: '/categories', params: { filter: categoryId } });
  }, [router]);

  const handleFavorite = useCallback((productId: string) => {
    safeHaptics.selectionAsync();
    toggleFavorite(productId);
  }, [toggleFavorite]);

  const onRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>جاري تحميل المتجر...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: brand.background_dark }]}>
          <View style={styles.headerRight}>
            {(brand.icon_url || brand.logo_url) ? (
              <Image
                source={{ uri: brand.icon_url || brand.logo_url }}
                style={styles.headerLogo}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <Image
                source={require('../../assets/images/logo-gold.jpeg')}
                style={styles.headerLogo}
                contentFit="contain"
                transition={200}
              />
            )}
            <View>
              <Text style={[styles.storeName, { color: brand.primary_color }]}>{brand.store_name}</Text>
              <Text style={styles.storeTagline}>{brand.tagline}</Text>
            </View>
          </View>
          <Pressable style={styles.searchBtn} onPress={() => router.push('/categories')}>
            <MaterialIcons name="search" size={24} color={brand.primary_color} />
          </Pressable>
        </View>

        {/* Error Banner */}
        {error ? (
          <Pressable style={styles.errorBanner} onPress={onRefresh}>
            <MaterialIcons name="wifi-off" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>خطأ في تحميل البيانات - اضغط لإعادة المحاولة</Text>
          </Pressable>
        ) : null}

        {/* Hero Banner Carousel */}
        <View style={styles.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setActiveBanner(index);
            }}
          >
            <Pressable style={styles.bannerSlide} onPress={() => router.push('/offers')}>
              <Image
                source={bannerImages[0]}
                style={styles.bannerImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  <View style={styles.bannerDiscountBadge}>
                    <Text style={styles.bannerDiscountText}>خصم 30%</Text>
                  </View>
                  <Text style={styles.bannerTitle}>عروض نهاية الموسم</Text>
                  <Text style={styles.bannerSubtitle}>خصومات تصل إلى 30%</Text>
                  <View style={styles.bannerCta}>
                    <Text style={styles.bannerCtaText}>تسوق الآن</Text>
                    <MaterialIcons name="arrow-back" size={16} color={theme.backgroundDark} />
                  </View>
                </View>
              </View>
            </Pressable>
            <Pressable style={styles.bannerSlide} onPress={() => router.push('/categories')}>
              <Image
                source={bannerImages[1]}
                style={styles.bannerImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>تشكيلة الشتاء الجديدة</Text>
                  <Text style={styles.bannerSubtitle}>أحدث الموديلات العصرية</Text>
                  <View style={styles.bannerCta}>
                    <Text style={styles.bannerCtaText}>تسوق الآن</Text>
                    <MaterialIcons name="arrow-back" size={16} color={theme.backgroundDark} />
                  </View>
                </View>
              </View>
            </Pressable>
          </ScrollView>
          <View style={styles.bannerDots}>
            {bannerImages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeBanner && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>التصنيفات</Text>
            <Pressable onPress={() => router.push('/categories')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <View style={styles.categoryIconContainer}>
                  <MaterialIcons name={cat.icon as any} size={28} color={theme.primary} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Discounted Products */}
        {discounted.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="local-offer" size={20} color="#EF4444" />
                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>عروض وخصومات</Text>
              </View>
              <Pressable onPress={() => router.push('/offers')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {discounted.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cardWidth={160}
                  isFav={isFavorite(product.id)}
                  onPress={() => handleProductPress(product.id)}
                  onFavorite={() => handleFavorite(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Best Sellers */}
        {bestSellers.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="trending-up" size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>الأكثر مبيعاً</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cardWidth={160}
                  isFav={isFavorite(product.id)}
                  onPress={() => handleProductPress(product.id)}
                  onFavorite={() => handleFavorite(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* New Arrivals */}
        {newArrivals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="new-releases" size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>وصل حديثاً</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cardWidth={160}
                  isFav={isFavorite(product.id)}
                  onPress={() => handleProductPress(product.id)}
                  onFavorite={() => handleFavorite(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: theme.textSecondary, writingDirection: 'rtl' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.backgroundDark, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  headerLogo: { width: 44, height: 44, borderRadius: 8 },
  storeName: { fontSize: 18, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  storeTagline: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginTop: 1, writingDirection: 'rtl' },
  searchBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  errorBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, borderRadius: 10 },
  errorBannerText: { fontSize: 12, color: '#EF4444', fontWeight: '500', writingDirection: 'rtl' },
  bannerContainer: { marginHorizontal: 16, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  bannerSlide: { width: SCREEN_WIDTH - 32, height: 200 },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 20 },
  bannerContent: { alignItems: 'flex-end' },
  bannerDiscountBadge: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  bannerDiscountText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  bannerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', writingDirection: 'rtl', textAlign: 'right' },
  bannerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, writingDirection: 'rtl', textAlign: 'right' },
  bannerCta: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12, gap: 6 },
  bannerCtaText: { color: theme.backgroundDark, fontSize: 13, fontWeight: '600', writingDirection: 'rtl' },
  bannerDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 20, backgroundColor: theme.primary },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  seeAll: { fontSize: 13, color: theme.primary, fontWeight: '600', writingDirection: 'rtl' },
  categoriesScroll: { paddingHorizontal: 16, gap: 16 },
  categoryItem: { alignItems: 'center', width: 72 },
  categoryIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0E8Da' },
  categoryName: { fontSize: 11, fontWeight: '600', color: theme.textPrimary, marginTop: 6, textAlign: 'center', writingDirection: 'rtl' },
  productsScroll: { paddingHorizontal: 16, gap: 12 },
  productCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 180, backgroundColor: '#F5F5F5' },
  discountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  newBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', writingDirection: 'rtl' },
  favoriteBtn: { position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, writingDirection: 'rtl' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  reviewCount: { fontSize: 11, color: theme.textMuted },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 6 },
  productPrice: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  originalPrice: { fontSize: 12, color: theme.textMuted, textDecorationLine: 'line-through', writingDirection: 'rtl' },
});
