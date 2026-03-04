import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/theme';
import {
  fetchOrderById,
  Order,
  formatPrice,
  formatDate,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/services/database';

const STATUS_STEPS = ['new', 'processing', 'shipping', 'completed'];

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrderById(id).then(({ data }) => {
      if (data) setOrder(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: theme.textMuted, writingDirection: 'rtl' }}>الطلب غير موجود</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>العودة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status = getOrderStatusLabel(order.order_status);
  const payStatus = getPaymentStatusLabel(order.payment_status);
  const currentStepIndex = STATUS_STEPS.indexOf(order.order_status);
  const isCancelled = order.order_status === 'cancelled';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Number + Status */}
        <View style={styles.topSection}>
          <Text style={styles.orderNumber}>#{order.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        {/* Status Timeline */}
        {!isCancelled ? (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>حالة الطلب</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const stepStatus = getOrderStatusLabel(step);
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <View key={step} style={styles.timelineStep}>
                    <View style={styles.timelineIndicator}>
                      <View style={[styles.timelineDot, isActive && { backgroundColor: stepStatus.color }]}>
                        {isCurrent ? (
                          <MaterialIcons name="check" size={12} color="#FFFFFF" />
                        ) : null}
                      </View>
                      {index < STATUS_STEPS.length - 1 ? (
                        <View style={[styles.timelineLine, isActive && { backgroundColor: stepStatus.color }]} />
                      ) : null}
                    </View>
                    <Text style={[styles.timelineLabel, isActive && { color: theme.textPrimary, fontWeight: '600' }]}>
                      {stepStatus.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.cancelledBanner}>
            <MaterialIcons name="cancel" size={24} color="#EF4444" />
            <Text style={styles.cancelledText}>تم إلغاء هذا الطلب</Text>
          </View>
        )}

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>معلومات العميل</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.customer_name}</Text>
            <View style={styles.infoLabel}>
              <MaterialIcons name="person" size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>الاسم</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.customer_phone}</Text>
            <View style={styles.infoLabel}>
              <MaterialIcons name="phone" size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>الهاتف</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {order.delivery_method === 'delivery' ? 'توصيل' : 'استلام من المحل'}
            </Text>
            <View style={styles.infoLabel}>
              <MaterialIcons name={order.delivery_method === 'delivery' ? 'local-shipping' : 'store'} size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>الاستلام</Text>
            </View>
          </View>
          {order.customer_address ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{order.customer_address}</Text>
              <View style={styles.infoLabel}>
                <MaterialIcons name="location-on" size={16} color={theme.textMuted} />
                <Text style={styles.infoLabelText}>العنوان</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>معلومات الدفع</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.payment_bank || '-'}</Text>
            <View style={styles.infoLabel}>
              <MaterialIcons name="account-balance" size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>البنك</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.transfer_number || '-'}</Text>
            <View style={styles.infoLabel}>
              <MaterialIcons name="receipt" size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>رقم الحوالة</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.payBadge, { backgroundColor: payStatus.bg }]}>
              <Text style={[styles.payBadgeText, { color: payStatus.color }]}>{payStatus.label}</Text>
            </View>
            <View style={styles.infoLabel}>
              <MaterialIcons name="payment" size={16} color={theme.textMuted} />
              <Text style={styles.infoLabelText}>حالة الدفع</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>المنتجات ({order.order_items?.length || 0})</Text>
          {(order.order_items || []).map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={styles.itemImageContainer}>
                {item.product_image ? (
                  <Image source={{ uri: item.product_image }} style={styles.itemImage} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.itemImage, { backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="image" size={20} color={theme.textMuted} />
                  </View>
                )}
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                <View style={styles.itemMeta}>
                  {item.size ? <Text style={styles.itemMetaText}>المقاس: {item.size}</Text> : null}
                  {item.color ? <Text style={styles.itemMetaText}>اللون: {item.color}</Text> : null}
                </View>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemTotalPrice}>{formatPrice(item.product_price * item.quantity)}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.product_price)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
          </View>
          {order.discount_amount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>-{formatPrice(order.discount_amount)}</Text>
              <Text style={styles.summaryLabel}>الخصم</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>مجاني</Text>
            <Text style={styles.summaryLabel}>التوصيل</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
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
  topSection: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  orderNumber: { fontSize: 24, fontWeight: '700', color: theme.textPrimary },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 14, fontWeight: '600' },
  orderDate: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  timelineSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 14 },
  timeline: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineIndicator: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'center' },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineLine: { position: 'absolute', left: 0, right: '50%', height: 2, backgroundColor: '#E5E7EB', top: 11 },
  timelineLabel: { fontSize: 10, color: theme.textMuted, marginTop: 6, textAlign: 'center', writingDirection: 'rtl' },
  cancelledBanner: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 12 },
  cancelledText: { fontSize: 15, fontWeight: '600', color: '#EF4444', writingDirection: 'rtl' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  infoLabel: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  infoLabelText: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  infoValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl', maxWidth: '60%', textAlign: 'left' },
  payBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  payBadgeText: { fontSize: 12, fontWeight: '600' },
  itemRow: { flexDirection: 'row-reverse', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6', gap: 12 },
  itemImageContainer: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden' },
  itemImage: { width: 60, height: 60 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  itemMeta: { flexDirection: 'row-reverse', gap: 10, marginTop: 2 },
  itemMetaText: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl' },
  itemPriceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4 },
  itemPrice: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl' },
  itemQty: { fontSize: 12, color: theme.textMuted },
  itemTotalPrice: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: theme.textSecondary, writingDirection: 'rtl' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  totalValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
});
