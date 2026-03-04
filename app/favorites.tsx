import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { theme } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, Product } from '@/services/database';
import * as Haptics from 'expo-haptics';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products } = useStore();
  const { favorites, toggleFavorite, isFavorite } = useCart();

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const handleProductPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/product/${id}`);
  };

  const handleRemoveFavorite = (productId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toggleFavorite(productId);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable style={styles.productCard} onPress={() => handleProductPress(item.id)}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} contentFit="cover" transition={300} />
        {item.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        ) : null}
        <Pressable style={styles.removeBtn} onPress={() => handleRemoveFavorite(item.id)} hitSlop={8}>
          <MaterialIcons name="favorite" size={18} color="#EF4444" />
        </Pressable>
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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>المفضلة ({favoriteProducts.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      {favoriteProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="favorite-border" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد منتجات مفضلة</Text>
          <Text style={styles.emptyText}>أضف منتجاتك المفضلة بالضغط على أيقونة القلب</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.back()}>
            <Text style={styles.shopBtnText}>تصفح المنتجات</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={favoriteProducts}
            renderItem={renderProduct}
            numColumns={2}
            estimatedItemSize={280}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 8 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  emptyText: { fontSize: 14, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center' },
  shopBtn: { backgroundColor: theme.backgroundDark, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  shopBtnText: { color: theme.primary, fontSize: 15, fontWeight: '600', writingDirection: 'rtl' },
  productCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', marginHorizontal: 4 },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 180, backgroundColor: '#F5F5F5' },
  discountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  reviewCount: { fontSize: 10, color: theme.textMuted },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 6 },
  productPrice: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  originalPrice: { fontSize: 11, color: theme.textMuted, textDecorationLine: 'line-through', writingDirection: 'rtl' },
});
