import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/hooks/useStore';
import { useAlert } from '@/template';
import { formatPrice, createOrder, validateCoupon, PaymentMethod, Coupon, DeliveryZone } from '@/services/database';
import * as Haptics from 'expo-haptics';

type DeliveryMethod = 'delivery' | 'pickup';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, getTotal, getOriginalTotal, getSavings, clearCart } = useCart();
  const { paymentMethods, deliveryZones } = useStore();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [transferNumber, setTransferNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const selectedBankData = paymentMethods.find(b => b.bank_key === selectedBank);
  const deliveryFee = deliveryMethod === 'delivery' && selectedZone ? selectedZone.delivery_fee : 0;
  const finalTotal = Math.max(0, getTotal() - couponDiscount + deliveryFee);

  // Group zones by governorate
  const groupedZones = React.useMemo(() => {
    const groups: Record<string, DeliveryZone[]> = {};
    deliveryZones.forEach(zone => {
      if (!groups[zone.governorate]) groups[zone.governorate] = [];
      groups[zone.governorate].push(zone);
    });
    return groups;
  }, [deliveryZones]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    Haptics.selectionAsync();
    setCouponLoading(true);
    const { data, error, discountAmount } = await validateCoupon(couponCode.trim(), getTotal());
    setCouponLoading(false);

    if (error) {
      showAlert('كوبون غير صالح', error);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }
    if (data) {
      setAppliedCoupon(data);
      setCouponDiscount(discountAmount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('تم', `تم تطبيق كوبون "${data.code}" - خصم ${formatPrice(discountAmount)}`);
    }
  };

  const handleRemoveCoupon = () => {
    Haptics.selectionAsync();
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handleVerifyPayment = async () => {
    if (!transferNumber.trim() || !selectedBank) return;
    Haptics.selectionAsync();
    setVerifying(true);

    try {
      const { data: order, error } = await createOrder({
        customerName,
        customerPhone,
        deliveryMethod,
        paymentBank: selectedBank,
        transferNumber,
        customerAddress: selectedZone ? `${selectedZone.country} - ${selectedZone.governorate} - ${selectedZone.area}` : undefined,
        deliveryZoneId: selectedZone?.id,
        deliveryFee: deliveryFee,
        subtotal: getOriginalTotal(),
        discountAmount: getSavings() + couponDiscount,
        total: finalTotal,
        notes: [
          appliedCoupon ? `كوبون: ${appliedCoupon.code}` : '',
          selectedZone ? `منطقة التوصيل: ${selectedZone.area} | رسوم: ${selectedZone.delivery_fee}` : '',
        ].filter(Boolean).join(' | ') || undefined,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_price: item.product.price,
          product_image: item.product.image || null,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor,
        })),
      });

      if (error) {
        console.error('Order creation failed:', error);
      }

      setOrderNumber(order?.order_number || 'MRS-' + Math.floor(Math.random() * 10000));
      setOrderComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
    } catch (err) {
      console.error('Order error:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (orderComplete) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>تم تأكيد الطلب بنجاح!</Text>
          <Text style={styles.successText}>رقم الطلب: #{orderNumber}</Text>
          <Text style={styles.successSubtext}>سيتم إرسال تفاصيل الطلب عبر رسالة نصية</Text>
          <Pressable
            style={styles.successBtn}
            onPress={() => { router.dismissAll(); router.replace('/(tabs)'); }}
          >
            <Text style={styles.successBtnText}>العودة للرئيسية</Text>
          </Pressable>
          <Pressable
            style={styles.viewOrderBtn}
            onPress={() => { router.dismissAll(); router.replace('/orders'); }}
          >
            <Text style={styles.viewOrderBtnText}>عرض طلباتي</Text>
          </Pressable>
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
        <Text style={styles.headerTitle}>إتمام الشراء</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepRow}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {s === 1 ? 'التوصيل' : s === 2 ? 'الدفع' : 'التأكيد'}
            </Text>
            {s < 3 ? <View style={[styles.stepLine, step > s && styles.stepLineActive]} /> : null}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Delivery */}
          {step === 1 ? (
            <View>
              <Text style={styles.stepTitle}>طريقة الاستلام</Text>
              <Pressable
                style={[styles.deliveryOption, deliveryMethod === 'delivery' && styles.deliveryOptionActive]}
                onPress={() => { Haptics.selectionAsync(); setDeliveryMethod('delivery'); }}
              >
                <MaterialIcons name="local-shipping" size={28} color={deliveryMethod === 'delivery' ? theme.primary : theme.textMuted} />
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>توصيل للعنوان</Text>
                  <Text style={styles.deliverySubtext}>خلال 2-5 أيام عمل</Text>
                </View>
                <View style={[styles.radioCircle, deliveryMethod === 'delivery' && styles.radioActive]}>
                  {deliveryMethod === 'delivery' ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
              <Pressable
                style={[styles.deliveryOption, deliveryMethod === 'pickup' && styles.deliveryOptionActive]}
                onPress={() => { Haptics.selectionAsync(); setDeliveryMethod('pickup'); }}
              >
                <MaterialIcons name="store" size={28} color={deliveryMethod === 'pickup' ? theme.primary : theme.textMuted} />
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>استلام من المحل</Text>
                  <Text style={styles.deliverySubtext}>جاهز خلال ساعة</Text>
                </View>
                <View style={[styles.radioCircle, deliveryMethod === 'pickup' && styles.radioActive]}>
                  {deliveryMethod === 'pickup' ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>الاسم الكامل</Text>
                <TextInput style={styles.textInput} placeholder="أدخل اسمك الكامل" placeholderTextColor={theme.textMuted} value={customerName} onChangeText={setCustomerName} textAlign="right" />
                <Text style={styles.formLabel}>رقم الهاتف</Text>
                <TextInput style={styles.textInput} placeholder="777 XXX XXX" placeholderTextColor={theme.textMuted} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" textAlign="right" />
                {deliveryMethod === 'delivery' ? (
                  <>
                    <Text style={styles.formLabel}>منطقة التوصيل</Text>
                    <Pressable
                      style={[styles.zoneSelectorBtn, selectedZone && styles.zoneSelectorBtnActive]}
                      onPress={() => setShowZonePicker(true)}
                    >
                      {selectedZone ? (
                        <View style={styles.selectedZoneInfo}>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={styles.selectedZoneName}>{selectedZone.area}</Text>
                            <Text style={styles.selectedZoneGov}>{selectedZone.governorate} - {selectedZone.country}</Text>
                          </View>
                          <View style={styles.selectedZoneFeeBox}>
                            <Text style={styles.selectedZoneFee}>{formatPrice(selectedZone.delivery_fee)}</Text>
                            <Text style={styles.selectedZoneDays}>{selectedZone.estimated_days}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.zonePlaceholderRow}>
                          <MaterialIcons name="location-on" size={20} color={theme.textMuted} />
                          <Text style={styles.zonePlaceholder}>اختر منطقة التوصيل</Text>
                          <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
                        </View>
                      )}
                    </Pressable>
                  </>
                ) : null}
              </View>

              {/* Zone Picker Modal */}
              {showZonePicker ? (
                <View style={styles.zonePickerOverlay}>
                  <View style={styles.zonePickerHeader}>
                    <Text style={styles.zonePickerTitle}>اختر منطقة التوصيل</Text>
                    <Pressable onPress={() => setShowZonePicker(false)} style={styles.zonePickerClose}>
                      <MaterialIcons name="close" size={22} color={theme.textPrimary} />
                    </Pressable>
                  </View>
                  <ScrollView style={styles.zonePickerList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {Object.entries(groupedZones).map(([gov, zones]) => (
                      <View key={gov} style={styles.zoneGroup}>
                        <View style={styles.zoneGroupHeader}>
                          <MaterialIcons name="place" size={16} color={theme.primary} />
                          <Text style={styles.zoneGroupTitle}>{gov}</Text>
                        </View>
                        {zones.map((zone) => (
                          <Pressable
                            key={zone.id}
                            style={[styles.zoneItem, selectedZone?.id === zone.id && styles.zoneItemActive]}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setSelectedZone(zone);
                              setShowZonePicker(false);
                            }}
                          >
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                              <Text style={[styles.zoneItemName, selectedZone?.id === zone.id && styles.zoneItemNameActive]}>{zone.area}</Text>
                              <Text style={styles.zoneItemDays}>{zone.estimated_days}</Text>
                            </View>
                            <View style={styles.zoneItemFeeBox}>
                              <Text style={[styles.zoneItemFee, selectedZone?.id === zone.id && styles.zoneItemFeeActive]}>{formatPrice(zone.delivery_fee)}</Text>
                            </View>
                            {selectedZone?.id === zone.id ? (
                              <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                            ) : (
                              <View style={styles.zoneRadio} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Step 2: Payment */}
          {step === 2 ? (
            <View>
              <Text style={styles.stepTitle}>اختر طريقة الدفع</Text>
              <Text style={styles.stepSubtext}>
                قم بتحويل المبلغ {formatPrice(finalTotal)} إلى حساب المحل ثم أدخل رقم الحوالة
              </Text>

              {/* Delivery Fee Summary */}
              {deliveryFee > 0 ? (
                <View style={styles.deliveryFeeSummary}>
                  <View style={styles.deliveryFeeRow}>
                    <MaterialIcons name="local-shipping" size={18} color={theme.primary} />
                    <Text style={styles.deliveryFeeLabel}>رسوم التوصيل ({selectedZone?.area})</Text>
                  </View>
                  <Text style={styles.deliveryFeeValue}>+{formatPrice(deliveryFee)}</Text>
                </View>
              ) : null}

              {paymentMethods.map((bank) => (
                <Pressable
                  key={bank.bank_key}
                  style={[styles.bankOption, selectedBank === bank.bank_key && styles.bankOptionActive]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedBank(bank.bank_key); }}
                >
                  <View style={styles.bankHeader}>
                    <MaterialIcons name="account-balance" size={28} color={selectedBank === bank.bank_key ? theme.primary : theme.textMuted} />
                    <Text style={styles.bankName}>{bank.bank_name}</Text>
                    <View style={[styles.radioCircle, selectedBank === bank.bank_key && styles.radioActive]}>
                      {selectedBank === bank.bank_key ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                  {selectedBank === bank.bank_key ? (
                    <View style={styles.bankDetails}>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailValue}>{bank.account_name}</Text>
                        <Text style={styles.bankDetailLabel}>اسم الحساب:</Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailValue}>{bank.account_number}</Text>
                        <Text style={styles.bankDetailLabel}>رقم الحساب:</Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={[styles.bankDetailValue, { color: theme.primary, fontWeight: '700' }]}>{formatPrice(finalTotal)}</Text>
                        <Text style={styles.bankDetailLabel}>المبلغ:</Text>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              ))}

              {selectedBank ? (
                <View style={styles.transferSection}>
                  <Text style={styles.formLabel}>رقم الحوالة / معامل التحويل</Text>
                  <TextInput style={styles.textInput} placeholder="أدخل رقم الحوالة" placeholderTextColor={theme.textMuted} value={transferNumber} onChangeText={setTransferNumber} textAlign="right" keyboardType="number-pad" />
                  <Text style={styles.transferHint}>
                    سيتم التحقق من الحوالة تلقائيا عبر {selectedBankData?.bank_name}
                  </Text>
                </View>
              ) : null}

              {/* Coupon Section */}
              <View style={styles.couponSection}>
                <Text style={styles.formLabel}>كود الخصم</Text>
                {appliedCoupon ? (
                  <View style={styles.appliedCouponRow}>
                    <View style={styles.appliedCouponInfo}>
                      <MaterialIcons name="check-circle" size={18} color="#10B981" />
                      <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                      <Text style={styles.appliedCouponDiscount}>-{formatPrice(couponDiscount)}</Text>
                    </View>
                    <Pressable onPress={handleRemoveCoupon}>
                      <MaterialIcons name="close" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="أدخل كود الخصم"
                      placeholderTextColor={theme.textMuted}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      textAlign="right"
                      autoCapitalize="characters"
                    />
                    <Pressable
                      style={[styles.couponApplyBtn, couponLoading && { opacity: 0.6 }]}
                      onPress={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Text style={styles.couponApplyText}>تطبيق</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Step 3: Confirmation */}
          {step === 3 ? (
            <View>
              <Text style={styles.stepTitle}>مراجعة الطلب</Text>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>طريقة الاستلام</Text>
                <Text style={styles.reviewValue}>{deliveryMethod === 'delivery' ? 'توصيل للعنوان' : 'استلام من المحل'}</Text>
              </View>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>معلومات العميل</Text>
                <Text style={styles.reviewValue}>{customerName}</Text>
                <Text style={styles.reviewValue}>{customerPhone}</Text>
                {deliveryMethod === 'delivery' && selectedZone ? (
                  <Text style={styles.reviewValue}>{selectedZone.country} - {selectedZone.governorate} - {selectedZone.area}</Text>
                ) : null}
              </View>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>طريقة الدفع</Text>
                <Text style={styles.reviewValue}>{selectedBankData?.bank_name}</Text>
                <Text style={styles.reviewValue}>رقم الحوالة: {transferNumber}</Text>
              </View>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>المنتجات ({items.length})</Text>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>{item.product.name} x {item.quantity}</Text>
                    <Text style={styles.reviewItemPrice}>{formatPrice(item.product.price * item.quantity)}</Text>
                  </View>
                ))}
              </View>
              {appliedCoupon ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>كوبون الخصم</Text>
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>{appliedCoupon.code}</Text>
                    <Text style={[styles.reviewItemPrice, { color: '#10B981' }]}>-{formatPrice(couponDiscount)}</Text>
                  </View>
                </View>
              ) : null}
              {deliveryFee > 0 ? (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewLabel}>رسوم التوصيل</Text>
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>{selectedZone?.area} ({selectedZone?.estimated_days})</Text>
                    <Text style={styles.reviewItemPrice}>+{formatPrice(deliveryFee)}</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.reviewTotal}>
                <Text style={styles.reviewTotalLabel}>الإجمالي</Text>
                <Text style={styles.reviewTotalValue}>{formatPrice(finalTotal)}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step > 1 ? (
          <Pressable style={styles.backStepBtn} onPress={() => { Haptics.selectionAsync(); setStep((step - 1) as 1 | 2 | 3); }}>
            <Text style={styles.backStepText}>رجوع</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.nextBtn, step === 3 && verifying && styles.nextBtnDisabled]}
          onPress={() => {
            if (step === 1) {
              if (!customerName.trim() || !customerPhone.trim()) {
                showAlert('تنبيه', 'يرجى ملء الاسم ورقم الهاتف');
                return;
              }
              if (deliveryMethod === 'delivery' && !selectedZone) {
                showAlert('تنبيه', 'يرجى اختيار منطقة التوصيل');
                return;
              }
              Haptics.selectionAsync();
              setStep(2);
            } else if (step === 2) {
              if (!selectedBank) {
                showAlert('تنبيه', 'يرجى اختيار طريقة الدفع');
                return;
              }
              if (!transferNumber.trim()) {
                showAlert('تنبيه', 'يرجى إدخال رقم الحوالة');
                return;
              }
              Haptics.selectionAsync();
              setStep(3);
            } else {
              handleVerifyPayment();
            }
          }}
        >
          {step === 3 && verifying ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === 3 ? 'تأكيد وإرسال الطلب' : 'متابعة'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  stepIndicator: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 16 },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: theme.backgroundDark },
  stepNumber: { fontSize: 13, fontWeight: '700', color: theme.textMuted },
  stepNumberActive: { color: theme.primary },
  stepLabel: { fontSize: 11, color: theme.textMuted, marginRight: 6, writingDirection: 'rtl' },
  stepLabelActive: { color: theme.textPrimary, fontWeight: '600' },
  stepLine: { width: 30, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: theme.primary },
  stepTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, marginTop: 8 },
  stepSubtext: { fontSize: 14, color: theme.textSecondary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 16, lineHeight: 22 },
  deliveryOption: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10, gap: 14 },
  deliveryOptionActive: { borderColor: theme.primary, backgroundColor: '#FAF7F2' },
  deliveryInfo: { flex: 1, alignItems: 'flex-end' },
  deliveryTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  deliverySubtext: { fontSize: 12, color: theme.textMuted, marginTop: 2, writingDirection: 'rtl' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: theme.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary },
  formSection: { marginTop: 20, gap: 4 },
  formLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginTop: 12, marginBottom: 6 },
  textInput: { height: 48, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  bankOption: { borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10, overflow: 'hidden' },
  bankOptionActive: { borderColor: theme.primary, backgroundColor: '#FAF7F2' },
  bankHeader: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, gap: 14 },
  bankName: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  bankDetails: { backgroundColor: '#FFFFFF', padding: 14, borderTopWidth: 1, borderTopColor: '#F0E8Da', gap: 8 },
  bankDetailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  bankDetailLabel: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  bankDetailValue: { fontSize: 13, fontWeight: '500', color: theme.textPrimary },
  transferSection: { marginTop: 16 },
  transferHint: { fontSize: 12, color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  couponSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  couponInputRow: { flexDirection: 'row-reverse', gap: 8 },
  couponInput: { flex: 1, height: 48, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  couponApplyBtn: { backgroundColor: theme.backgroundDark, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  couponApplyText: { fontSize: 14, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },
  deliveryFeeSummary: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  deliveryFeeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  deliveryFeeLabel: { fontSize: 13, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  deliveryFeeValue: { fontSize: 14, fontWeight: '700', color: '#16A34A', writingDirection: 'rtl' },
  appliedCouponRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14 },
  appliedCouponInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  appliedCouponCode: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  appliedCouponDiscount: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  reviewSection: { backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, marginBottom: 10, gap: 4 },
  reviewLabel: { fontSize: 13, fontWeight: '600', color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl', marginBottom: 4 },
  reviewValue: { fontSize: 14, color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  reviewItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  reviewItemName: { fontSize: 13, color: theme.textPrimary, writingDirection: 'rtl', flex: 1 },
  reviewItemPrice: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  reviewTotal: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.backgroundDark, borderRadius: 14, padding: 16, marginTop: 8 },
  reviewTotalLabel: { fontSize: 16, fontWeight: '600', color: theme.textLight, writingDirection: 'rtl' },
  reviewTotalValue: { fontSize: 22, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  bottomBar: { flexDirection: 'row-reverse', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF', gap: 10 },
  backStepBtn: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backStepText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary, writingDirection: 'rtl' },
  nextBtn: { flex: 1, backgroundColor: theme.backgroundDark, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  successIcon: { marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl', textAlign: 'center' },
  successText: { fontSize: 16, fontWeight: '600', color: theme.primary, marginTop: 12, writingDirection: 'rtl' },
  successSubtext: { fontSize: 14, color: theme.textMuted, marginTop: 8, writingDirection: 'rtl', textAlign: 'center' },
  successBtn: { backgroundColor: theme.backgroundDark, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, marginTop: 32 },
  successBtnText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  viewOrderBtn: { paddingHorizontal: 40, paddingVertical: 12, marginTop: 12 },
  viewOrderBtnText: { fontSize: 14, fontWeight: '600', color: theme.primary, writingDirection: 'rtl', textDecorationLine: 'underline' },

  // Zone Selector
  zoneSelectorBtn: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB', minHeight: 52 },
  zoneSelectorBtnActive: { borderColor: theme.primary, backgroundColor: '#FAF7F2' },
  zonePlaceholderRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  zonePlaceholder: { flex: 1, fontSize: 15, color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl', marginRight: 8 },
  selectedZoneInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  selectedZoneName: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  selectedZoneGov: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', marginTop: 2 },
  selectedZoneFeeBox: { alignItems: 'center', backgroundColor: theme.backgroundDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  selectedZoneFee: { fontSize: 13, fontWeight: '700', color: theme.primary },
  selectedZoneDays: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  // Zone Picker
  zonePickerOverlay: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8, maxHeight: 380, overflow: 'hidden' },
  zonePickerHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  zonePickerTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  zonePickerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  zonePickerList: { padding: 12 },
  zoneGroup: { marginBottom: 16 },
  zoneGroupHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8, paddingHorizontal: 4 },
  zoneGroupTitle: { fontSize: 14, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  zoneItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#FAFAFA', marginBottom: 6, borderWidth: 1.5, borderColor: 'transparent' },
  zoneItemActive: { borderColor: theme.primary, backgroundColor: '#FAF7F2' },
  zoneItemName: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  zoneItemNameActive: { fontWeight: '700', color: theme.primary },
  zoneItemDays: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', marginTop: 2 },
  zoneItemFeeBox: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  zoneItemFee: { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  zoneItemFeeActive: { color: theme.primary },
  zoneRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' },
});
