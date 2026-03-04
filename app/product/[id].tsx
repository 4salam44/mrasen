import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import { useStore } from '@/hooks/useStore';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, Product, fetchProductById } from '@/services/database';
import { useAlert } from '@/template';
import * as Haptics from 'expo-haptics';

const safeHaptics = {
  selectionAsync: () => {
    try { Haptics.selectionAsync(); } catch {}
  },
  notificationSuccess: () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  },
};


const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, toggleFavorite, isFavorite } = useCart();
  const { products } = useStore();
  const { showAlert } = useAlert();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    const local = products.find(p => p.id === id);
    if (local) {
      setProduct(local);
      setSelectedSize(local.sizes[0] || '');
      setSelectedColor(local.colors[0]?.name || '');
      setLoading(false);
    } else {
      fetchProductById(id).then(({ data }) => {
        if (data) {
          setProduct(data);
          setSelectedSize(data.sizes[0] || '');
          setSelectedColor(data.colors[0]?.name || '');
        }
        setLoading(false);
      });
    }
  }, [id, products]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!product.in_stock) {
      showAlert('غير متوفر', 'هذا المنتج غير متوفر حالياً');
      return;
    }
    if (product.stock_quantity > 0 && quantity > product.stock_quantity) {
      showAlert('تنبيه', `الكمية المتوفرة: ${product.stock_quantity} فقط`);
      return;
    }
    safeHaptics.notificationSuccess();
    addItem(product, selectedSize, selectedColor, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, quantity, selectedSize, selectedColor, addItem, showAlert]);

  const handleFavorite = useCallback(() => {
    if (!product) return;
    safeHaptics.selectionAsync();
    toggleFavorite(product.id);
  }, [product, toggleFavorite]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>المنتج غير موجود</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.errorLink}>العودة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const similarProducts = product.category_id
    ? products.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4)
    : [];

  const productImages = (product.images && product.images.length > 0 ? product.images : [product.image]).filter((img): img is string => !!img && img.length > 0);
  const maxQty = product.stock_quantity > 0 ? Math.min(product.stock_quantity, 99) : 99;

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
          >
            {productImages.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.galleryImage}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>

          <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
            <Pressable style={styles.floatingBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.floatingRight}>
              <Pressable style={styles.floatingBtn} onPress={handleFavorite}>
                <MaterialIcons
                  name={isFavorite(product.id) ? 'favorite' : 'favorite-border'}
                  size={24}
                  color={isFavorite(product.id) ? '#EF4444' : theme.textPrimary}
                />
              </Pressable>
            </View>
          </View>

          {productImages.length > 1 ? (
            <View style={styles.imageDots}>
              {productImages.map((_, index) => (
                <View key={index} style={[styles.imageDot, index === activeImageIndex && styles.imageDotActive]} />
              ))}
            </View>
          ) : null}

          {product.discount > 0 ? (
            <View style={styles.detailDiscountBadge}>
              <Text style={styles.detailDiscountText}>خصم {product.discount}%</Text>
            </View>
          ) : null}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingStars}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingValue}>{product.rating}</Text>
              <Text style={styles.ratingCount}>({product.review_count} تقييم)</Text>
            </View>
            <View style={[styles.stockBadge, !product.in_stock && styles.outOfStockBadge]}>
              <View style={[styles.stockDot, !product.in_stock && styles.outOfStockDot]} />
              <Text style={[styles.stockText, !product.in_stock && styles.outOfStockStockText]}>
                {product.in_stock ? (product.stock_quantity > 0 ? `متوفر (${product.stock_quantity})` : 'متوفر') : 'غير متوفر'}
              </Text>
            </View>
          </View>

          {product.product_number ? (
            <Text style={styles.productCode}>رقم المنتج: #{product.product_number}</Text>
          ) : null}

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
            {product.original_price ? (
              <View style={styles.originalPriceRow}>
                <Text style={styles.originalPrice}>{formatPrice(product.original_price)}</Text>
                <View style={styles.savingBadge}>
                  <Text style={styles.savingText}>
                    وفر {formatPrice(product.original_price - product.price)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {product.material ? (
            <View style={styles.materialRow}>
              <MaterialIcons name="layers" size={16} color={theme.textMuted} />
              <Text style={styles.materialText}>{product.material}</Text>
            </View>
          ) : null}
        </View>

        {/* Size Selection */}
        {product.sizes.length > 0 ? (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>المقاس</Text>
            <View style={styles.optionsRow}>
              {product.sizes.map((size) => (
                <Pressable
                  key={size}
                  style={[styles.sizeOption, selectedSize === size && styles.sizeOptionActive]}
                  onPress={() => { safeHaptics.selectionAsync(); setSelectedSize(size); }}
                >
                  <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>{size}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Color Selection */}
        {product.colors.length > 0 ? (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>اللون: {selectedColor}</Text>
            <View style={styles.optionsRow}>
              {product.colors.map((color) => (
                <Pressable
                  key={color.name}
                  style={[styles.colorOption, selectedColor === color.name && styles.colorOptionActive]}
                  onPress={() => { safeHaptics.selectionAsync(); setSelectedColor(color.name); }}
                >
                  <View style={[styles.colorCircle, { backgroundColor: color.hex }]} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Quantity */}
        <View style={styles.optionSection}>
          <Text style={styles.optionTitle}>الكمية</Text>
          <View style={styles.quantityRow}>
            <Pressable style={styles.quantityBtn} onPress={() => { safeHaptics.selectionAsync(); setQuantity(Math.max(1, quantity - 1)); }}>
              <MaterialIcons name="remove" size={20} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Pressable style={styles.quantityBtn} onPress={() => { safeHaptics.selectionAsync(); setQuantity(Math.min(maxQty, quantity + 1)); }}>
              <MaterialIcons name="add" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Description */}
        {product.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>وصف المنتج</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        {/* Delivery Info */}
        <View style={styles.deliverySection}>
          <View style={styles.deliveryItem}>
            <MaterialIcons name="local-shipping" size={22} color={theme.primary} />
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>توصيل مجاني</Text>
              <Text style={styles.deliveryText}>خلال 2-5 أيام عمل</Text>
            </View>
          </View>
          <View style={styles.deliveryItem}>
            <MaterialIcons name="store" size={22} color={theme.primary} />
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>استلام من المحل</Text>
              <Text style={styles.deliveryText}>جاهز خلال ساعة</Text>
            </View>
          </View>
          <View style={styles.deliveryItem}>
            <MaterialIcons name="swap-horiz" size={22} color={theme.primary} />
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>إرجاع مجاني</Text>
              <Text style={styles.deliveryText}>خلال 14 يوم</Text>
            </View>
          </View>
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 ? (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>منتجات مشابهة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
              {similarProducts.map((p) => (
                <Pressable key={p.id} style={styles.similarCard} onPress={() => { safeHaptics.selectionAsync(); router.push(`/product/${p.id}`); }}>
                  <Image source={{ uri: p.image }} style={styles.similarImage} contentFit="cover" transition={200} recyclingKey={p.id} />
                  <Text style={styles.similarName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.similarPrice}>{formatPrice(p.price)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[
            styles.addToCartBtn,
            addedToCart && styles.addedBtn,
            !product.in_stock && styles.disabledBtn,
          ]}
          onPress={handleAddToCart}
          disabled={!product.in_stock}
        >
          <MaterialIcons
            name={addedToCart ? 'check' : (!product.in_stock ? 'block' : 'shopping-cart')}
            size={22}
            color={addedToCart ? '#10B981' : (!product.in_stock ? '#9CA3AF' : theme.primary)}
          />
          <Text style={[styles.addToCartText, addedToCart && styles.addedText, !product.in_stock && styles.disabledText]}>
            {addedToCart ? 'تمت الإضافة' : (!product.in_stock ? 'غير متوفر' : 'أضف إلى السلة')}
          </Text>
          {product.in_stock ? (
            <Text style={[styles.addToCartPrice, addedToCart && styles.addedText]}>
              {formatPrice(product.price * quantity)}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  errorLink: { fontSize: 15, color: theme.primary, fontWeight: '600', marginTop: 12, writingDirection: 'rtl' },
  imageGallery: { height: 400, position: 'relative', backgroundColor: '#F5F5F5' },
  galleryImage: { width: SCREEN_WIDTH, height: 400 },
  floatingHeader: { position: 'absolute', left: 16, right: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  floatingRight: { flexDirection: 'row', gap: 8 },
  imageDots: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  imageDotActive: { width: 20, backgroundColor: theme.primary },
  detailDiscountBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailDiscountText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  infoSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ratingStars: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 14, fontWeight: '600', color: '#F59E0B' },
  ratingCount: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  stockBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  outOfStockBadge: { backgroundColor: '#FEF2F2' },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  outOfStockDot: { backgroundColor: '#EF4444' },
  stockText: { fontSize: 12, fontWeight: '600', color: '#10B981', writingDirection: 'rtl' },
  outOfStockStockText: { color: '#EF4444' },
  productCode: { fontSize: 12, color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  productName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 30 },
  priceSection: { marginTop: 12, alignItems: 'flex-end' },
  currentPrice: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  originalPriceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 4 },
  originalPrice: { fontSize: 16, color: theme.textMuted, textDecorationLine: 'line-through', writingDirection: 'rtl' },
  savingBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  savingText: { fontSize: 12, fontWeight: '600', color: '#EF4444', writingDirection: 'rtl' },
  materialRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  materialText: { fontSize: 14, color: theme.textSecondary, writingDirection: 'rtl' },
  optionSection: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  optionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  sizeOption: { minWidth: 48, height: 44, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  sizeOptionActive: { borderColor: theme.backgroundDark, backgroundColor: theme.backgroundDark },
  sizeText: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
  sizeTextActive: { color: theme.primary, fontWeight: '600' },
  colorOption: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  colorOptionActive: { borderColor: theme.primary },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  quantityRow: { flexDirection: 'row-reverse', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#F5F5F5', borderRadius: 10 },
  quantityBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quantityText: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, minWidth: 32, textAlign: 'center' },
  descriptionSection: { paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  descriptionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  deliverySection: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, gap: 14 },
  deliveryItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  deliveryInfo: { alignItems: 'flex-end' },
  deliveryTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  deliveryText: { fontSize: 12, color: theme.textMuted, marginTop: 1, writingDirection: 'rtl' },
  similarSection: { marginTop: 24, paddingHorizontal: 16 },
  similarTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  similarScroll: { gap: 12 },
  similarCard: { width: 130 },
  similarImage: { width: 130, height: 140, borderRadius: 10, backgroundColor: '#F5F5F5' },
  similarName: { fontSize: 12, fontWeight: '500', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginTop: 6 },
  similarPrice: { fontSize: 13, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  addToCartBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundDark, borderRadius: 14, paddingVertical: 16, gap: 10 },
  addedBtn: { backgroundColor: '#ECFDF5' },
  disabledBtn: { backgroundColor: '#F3F4F6' },
  addToCartText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  addedText: { color: '#10B981' },
  disabledText: { color: '#9CA3AF' },
  addToCartPrice: { fontSize: 14, fontWeight: '600', color: theme.primary, writingDirection: 'rtl', opacity: 0.8 },
});
