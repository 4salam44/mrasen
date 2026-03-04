import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, Offer } from '@/services/database';
import * as Haptics from 'expo-haptics';

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { offers, getDiscountedProducts, loading } = useStore();
  const { toggleFavorite, isFavorite } = useCart();

  const discountedProducts = getDiscountedProducts();

  const handleProductPress = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/product/${id}`);
  };

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>العروض والخصومات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <MaterialIcons name="local-offer" size={40} color={theme.primary} />
            <Text style={styles.heroTitle}>عروض حصرية</Text>
            <Text style={styles.heroSubtitle}>خصومات تصل إلى 30% على منتجات مختارة</Text>
          </View>
        </View>

        {/* Active Offers */}
        {offers.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>العروض النشطة</Text>
            {offers.map((offer) => (
              <Pressable
                key={offer.id}
                style={styles.offerCard}
                onPress={() => {
                  if (offer.product) handleProductPress(offer.product.id);
                }}
              >
                {offer.product?.image ? (
                  <Image source={{ uri: offer.product.image }} style={styles.offerImage} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.offerImage, { backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="local-offer" size={30} color={theme.primary} />
                  </View>
                )}
                <View style={styles.offerInfo}>
                  <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
                  {offer.description ? (
                    <Text style={styles.offerDesc} numberOfLines={2}>{offer.description}</Text>
                  ) : null}
                  {offer.discount_percentage ? (
                    <View style={styles.offerDiscountBadge}>
                      <Text style={styles.offerDiscountText}>خصم {offer.discount_percentage}%</Text>
                    </View>
                  ) : null}
                  {offer.end_date ? (
                    <View style={styles.offerDateRow}>
                      <MaterialIcons name="schedule" size={12} color={theme.textMuted} />
                      <Text style={styles.offerDateText}>
                        ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-YE')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Discounted Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>منتجات بأسعار مخفضة ({discountedProducts.length})</Text>
          {discountedProducts.map((product) => (
            <Pressable
              key={product.id}
              style={styles.productCard}
              onPress={() => handleProductPress(product.id)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" transition={200} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{product.rating}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
                  {product.original_price ? (
                    <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
                  ) : null}
                </View>
                {product.discount > 0 ? (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>
                      وفر {formatPrice((product.original_price || product.price) - product.price)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.discountCircle}>
                <Text style={styles.discountCircleText}>-{product.discount}%</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Coupons Info */}
        <View style={styles.couponSection}>
          <MaterialIcons name="confirmation-number" size={28} color={theme.primary} />
          <Text style={styles.couponTitle}>لديك كود خصم؟</Text>
          <Text style={styles.couponText}>يمكنك استخدامه عند إتمام الشراء في صفحة الدفع</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  heroBanner: { backgroundColor: theme.backgroundDark, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 24 },
  heroContent: { alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', writingDirection: 'rtl', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  offerCard: { flexDirection: 'row-reverse', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  offerImage: { width: 70, height: 70, borderRadius: 10 },
  offerInfo: { flex: 1, alignItems: 'flex-end', gap: 4 },
  offerTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  offerDesc: { fontSize: 12, color: theme.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  offerDiscountBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  offerDiscountText: { fontSize: 11, fontWeight: '700', color: '#EF4444', writingDirection: 'rtl' },
  offerDateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  offerDateText: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl' },
  productCard: { flexDirection: 'row-reverse', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#F3F4F6', position: 'relative' },
  productImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F5F5F5' },
  productInfo: { flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' },
  productName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  currentPrice: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  originalPrice: { fontSize: 12, color: theme.textMuted, textDecorationLine: 'line-through', writingDirection: 'rtl' },
  saveBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  saveText: { fontSize: 11, fontWeight: '600', color: '#10B981', writingDirection: 'rtl' },
  discountCircle: { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  discountCircleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  couponSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 40, gap: 8, marginTop: 8 },
  couponTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  couponText: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center' },
});
