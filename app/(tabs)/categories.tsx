import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { theme } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, Product } from '@/services/database';
import * as Haptics from 'expo-haptics';

const ProductItem = React.memo(function ProductItem({
  item,
  isFav,
  onPress,
  onFavorite,
}: {
  item: Product;
  isFav: boolean;
  onPress: () => void;
  onFavorite: () => void;
}) {
  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
          recyclingKey={item.id}
        />
        {item.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        ) : null}
        {item.is_new && !(item.discount > 0) ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>جديد</Text>
          </View>
        ) : null}
        <Pressable style={styles.favoriteBtn} onPress={onFavorite} hitSlop={8}>
          <MaterialIcons
            name={isFav ? 'favorite' : 'favorite-border'}
            size={18}
            color={isFav ? '#EF4444' : '#9CA3AF'}
          />
        </Pressable>
        {!item.in_stock ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>نفد</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewCount}>({item.review_count})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          {item.original_price ? (
            <Text style={styles.originalPrice}>{formatPrice(item.original_price)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { toggleFavorite, isFavorite } = useCart();
  const { categories, products, loading, refreshing, refreshData, getProductsByCategory, searchProducts } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'rating'>('default');

  useEffect(() => {
    if (params.filter) {
      setActiveCategory(params.filter);
    }
  }, [params.filter]);

  const filteredProducts = useMemo(() => {
    let result = activeCategory === 'all' ? [...products] : getProductsByCategory(activeCategory);

    if (searchQuery.trim()) {
      const searchResult = searchProducts(searchQuery);
      result = activeCategory === 'all'
        ? searchResult
        : searchResult.filter(p => p.category_id === activeCategory);
    }

    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [activeCategory, searchQuery, sortBy, products, getProductsByCategory, searchProducts]);

  const handleProductPress = useCallback((id: string) => {
    Haptics.selectionAsync();
    router.push(`/product/${id}`);
  }, [router]);

  const handleFavorite = useCallback((productId: string) => {
    Haptics.selectionAsync();
    toggleFavorite(productId);
  }, [toggleFavorite]);

  const onRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const sortOptions = useMemo(() => [
    { id: 'default', label: 'الافتراضي' },
    { id: 'price_low', label: 'الأقل سعراً' },
    { id: 'price_high', label: 'الأعلى سعراً' },
    { id: 'rating', label: 'الأعلى تقييماً' },
  ], []);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductItem
      item={item}
      isFav={isFavorite(item.id)}
      onPress={() => handleProductPress(item.id)}
      onFavorite={() => handleFavorite(item.id)}
    />
  ), [isFavorite, handleProductPress, handleFavorite]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>التصنيفات</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن منتج..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <Pressable
            style={[styles.chip, activeCategory === 'all' && styles.chipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory('all'); }}
          >
            <Text style={[styles.chipText, activeCategory === 'all' && styles.chipTextActive]}>
              الكل ({products.length})
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const count = getProductsByCategory(cat.id).length;
            return (
              <Pressable
                key={cat.id}
                style={[styles.chip, activeCategory === cat.id && styles.chipActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat.id); }}
              >
                <Text style={[styles.chipText, activeCategory === cat.id && styles.chipTextActive]}>
                  {cat.name} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          {sortOptions.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.sortChip, sortBy === opt.id && styles.sortChipActive]}
              onPress={() => { Haptics.selectionAsync(); setSortBy(opt.id as any); }}
            >
              <Text style={[styles.sortText, sortBy === opt.id && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.resultCount}>{filteredProducts.length} منتج</Text>
      </View>

      {/* Product Grid */}
      <View style={styles.listContainer}>
        {filteredProducts.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          >
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={64} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptyText}>جرب البحث بكلمات مختلفة</Text>
            </View>
          </ScrollView>
        ) : (
          <FlashList
            data={filteredProducts}
            renderItem={renderProduct}
            numColumns={2}
            estimatedItemSize={280}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  chipContainer: { height: 42, marginBottom: 8 },
  chipsScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#F3F4F6' },
  chipActive: { backgroundColor: theme.backgroundDark, borderColor: theme.backgroundDark },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl' },
  chipTextActive: { color: theme.primary, fontWeight: '600' },
  sortContainer: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  sortScroll: { gap: 6 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  sortChipActive: { backgroundColor: '#FAF7F2' },
  sortText: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  sortTextActive: { color: theme.primary, fontWeight: '600' },
  resultCount: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  listContainer: { flex: 1 },
  productCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', marginHorizontal: 4 },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 180, backgroundColor: '#F5F5F5' },
  discountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  newBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', writingDirection: 'rtl' },
  favoriteBtn: { position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, writingDirection: 'rtl' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  reviewCount: { fontSize: 10, color: theme.textMuted },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 6 },
  productPrice: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  originalPrice: { fontSize: 11, color: theme.textMuted, textDecorationLine: 'line-through', writingDirection: 'rtl' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginTop: 16, writingDirection: 'rtl' },
  emptyText: { fontSize: 14, color: theme.textMuted, marginTop: 6, writingDirection: 'rtl' },
});
