import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import {
  fetchUserOrders,
  Order,
  formatPrice,
  formatDate,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/services/database';
import * as Haptics from 'expo-haptics';

const STATUS_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'new', label: 'جديد' },
  { id: 'processing', label: 'قيد المعالجة' },
  { id: 'shipping', label: 'جاري التوصيل' },
  { id: 'completed', label: 'مكتمل' },
  { id: 'cancelled', label: 'ملغي' },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    const { data, error } = await fetchUserOrders();
    if (!error && data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.order_status === activeFilter);

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
        <Text style={styles.headerTitle}>طلباتي</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.id); }}
            >
              <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all' ? 'لم تقم بأي طلب بعد' : 'لا توجد طلبات بهذه الحالة'}
            </Text>
            <Pressable style={styles.shopBtn} onPress={() => { router.dismissAll(); router.replace('/(tabs)'); }}>
              <Text style={styles.shopBtnText}>تسوق الآن</Text>
            </Pressable>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const status = getOrderStatusLabel(order.order_status);
            const payStatus = getPaymentStatusLabel(order.payment_status);
            const itemCount = order.order_items?.length || 0;

            return (
              <Pressable
                key={order.id}
                style={styles.orderCard}
                onPress={() => { Haptics.selectionAsync(); router.push(`/order/${order.id}`); }}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderNumberRow}>
                    <Text style={styles.orderNumber}>#{order.order_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                </View>

                <View style={styles.orderBody}>
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailValue}>{order.customer_name}</Text>
                    <Text style={styles.orderDetailLabel}>العميل</Text>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailValue}>{itemCount} منتج</Text>
                    <Text style={styles.orderDetailLabel}>المنتجات</Text>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.payBadge, { backgroundColor: payStatus.bg }]}>
                      <Text style={[styles.payBadgeText, { color: payStatus.color }]}>{payStatus.label}</Text>
                    </View>
                    <Text style={styles.orderDetailLabel}>الدفع</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
                    <Text style={styles.totalLabel}>الإجمالي</Text>
                  </View>
                  <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  filterContainer: { backgroundColor: '#FFFFFF', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterChipActive: { backgroundColor: theme.backgroundDark },
  filterText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, writingDirection: 'rtl' },
  filterTextActive: { color: theme.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  emptyText: { fontSize: 14, color: theme.textMuted, writingDirection: 'rtl' },
  shopBtn: { backgroundColor: theme.backgroundDark, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  shopBtnText: { color: theme.primary, fontSize: 15, fontWeight: '600', writingDirection: 'rtl' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  orderHeader: { marginBottom: 12, gap: 4 },
  orderNumberRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  orderNumber: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderDate: { fontSize: 12, color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  orderBody: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 8 },
  orderDetailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  orderDetailLabel: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  orderDetailValue: { fontSize: 13, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  payBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  payBadgeText: { fontSize: 11, fontWeight: '600' },
  orderFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 12 },
  totalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, writingDirection: 'rtl' },
  totalValue: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
});
