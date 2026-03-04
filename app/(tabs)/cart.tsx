import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/services/database';
import * as Haptics from 'expo-haptics';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getItemCount, getTotal, getOriginalTotal, getSavings } = useCart();

  const handleRemove = (productId: string, size: string, color: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeItem(productId, size, color);
  };

  const handleQuantityChange = (productId: string, size: string, color: string, delta: number, currentQty: number) => {
    Haptics.selectionAsync();
    updateQuantity(productId, size, color, currentQty + delta);
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>سلة المشتريات</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Image source={require('../../assets/images/empty-cart.png')} style={styles.emptyImage} contentFit="contain" />
          <Text style={styles.emptyTitle}>سلة المشتريات فارغة</Text>
          <Text style={styles.emptyText}>ابدأ بتصفح منتجاتنا وأضف ما يعجبك</Text>
          <Pressable style={styles.shopNowBtn} onPress={() => router.push('/categories')}>
            <Text style={styles.shopNowText}>تسوق الآن</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>سلة المشتريات</Text>
        <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); clearCart(); }}>
          <Text style={styles.clearBtn}>مسح الكل</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <View key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${index}`} style={styles.cartItem}>
            <Pressable style={styles.itemImage} onPress={() => router.push(`/product/${item.product.id}`)}>
              <Image source={{ uri: item.product.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            </Pressable>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>المقاس: {item.selectedSize}</Text>
                <Text style={styles.metaText}>اللون: {item.selectedColor}</Text>
              </View>
              <View style={styles.itemBottom}>
                <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
                <View style={styles.quantityControl}>
                  <Pressable style={styles.qtyBtn} onPress={() => handleQuantityChange(item.product.id, item.selectedSize, item.selectedColor, -1, item.quantity)}>
                    <MaterialIcons name="remove" size={18} color={theme.textPrimary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => handleQuantityChange(item.product.id, item.selectedSize, item.selectedColor, 1, item.quantity)}>
                    <MaterialIcons name="add" size={18} color={theme.textPrimary} />
                  </Pressable>
                </View>
              </View>
            </View>
            <Pressable style={styles.removeBtn} onPress={() => handleRemove(item.product.id, item.selectedSize, item.selectedColor)} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        ))}

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>ملخص الطلب</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{formatPrice(getOriginalTotal())}</Text>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
          </View>
          {getSavings() > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>-{formatPrice(getSavings())}</Text>
              <Text style={styles.summaryLabel}>التوفير</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>مجاني</Text>
            <Text style={styles.summaryLabel}>التوصيل</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>إتمام الشراء</Text>
          <View style={styles.checkoutTotal}>
            <Text style={styles.checkoutTotalText}>{formatPrice(getTotal())}</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  clearBtn: { fontSize: 14, color: '#EF4444', fontWeight: '500', writingDirection: 'rtl' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyImage: { width: 180, height: 180, marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'center' },
  emptyText: { fontSize: 14, color: theme.textMuted, marginTop: 8, writingDirection: 'rtl', textAlign: 'center' },
  shopNowBtn: { backgroundColor: theme.backgroundDark, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  shopNowText: { color: theme.primary, fontSize: 16, fontWeight: '600', writingDirection: 'rtl' },
  cartItem: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F5F5F5' },
  itemDetails: { flex: 1, marginRight: 12, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  itemMeta: { flexDirection: 'row-reverse', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  itemBottom: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  quantityControl: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8 },
  qtyBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, minWidth: 24, textAlign: 'center' },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  summarySection: { marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#FAFAFA', borderRadius: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 16 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: theme.textSecondary, writingDirection: 'rtl' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  totalValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  checkoutBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundDark, borderRadius: 14, paddingVertical: 16, gap: 12 },
  checkoutText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  checkoutTotal: { backgroundColor: 'rgba(200,169,110,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  checkoutTotalText: { fontSize: 14, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
});
