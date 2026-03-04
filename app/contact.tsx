import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAlert } from '@/template';
import { Image } from 'expo-image';
import { fetchContactInfo, ContactInfo } from '@/services/database';
import { useBrand } from '@/hooks/useBrand';
import * as Haptics from 'expo-haptics';

const safeHaptics = {
  selectionAsync: () => {
    try { Haptics.selectionAsync(); } catch {}
  },
};

const DEFAULT_CONTACT: ContactInfo = {
  phone: '',
  whatsapp: '',
  email: '',
  instagram: '',
  working_hours: '',
  address: '',
  latitude: 15.3694,
  longitude: 44.191,
  map_zoom: 15,
};

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { brand } = useBrand();

  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Message form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadContactInfo = useCallback(async () => {
    const { data } = await fetchContactInfo();
    if (data) setContact(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContactInfo();
  }, [loadContactInfo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContactInfo();
    setRefreshing(false);
  }, [loadContactInfo]);

  const openWhatsApp = useCallback(() => {
    if (!contact.whatsapp) {
      showAlert('تنبيه', 'رقم الواتساب غير متوفر حالياً');
      return;
    }
    safeHaptics.selectionAsync();
    const cleanNumber = contact.whatsapp.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanNumber.replace('+', '')}`;
    Linking.openURL(url).catch(() => {
      showAlert('خطأ', 'تعذر فتح واتساب. تأكد من تثبيت التطبيق.');
    });
  }, [contact.whatsapp, showAlert]);

  const openPhoneDialer = useCallback(() => {
    if (!contact.phone) {
      showAlert('تنبيه', 'رقم الهاتف غير متوفر حالياً');
      return;
    }
    safeHaptics.selectionAsync();
    Linking.openURL(`tel:${contact.phone}`).catch(() => {
      showAlert('خطأ', 'تعذر فتح تطبيق الاتصال');
    });
  }, [contact.phone, showAlert]);

  const openEmail = useCallback(() => {
    if (!contact.email) return;
    safeHaptics.selectionAsync();
    Linking.openURL(`mailto:${contact.email}`).catch(() => {
      showAlert('خطأ', 'تعذر فتح تطبيق البريد');
    });
  }, [contact.email, showAlert]);

  const openInstagram = useCallback(() => {
    if (!contact.instagram) return;
    safeHaptics.selectionAsync();
    const url = `https://instagram.com/${contact.instagram}`;
    Linking.openURL(url).catch(() => {
      showAlert('خطأ', 'تعذر فتح انستغرام');
    });
  }, [contact.instagram, showAlert]);

  const openMap = useCallback(() => {
    if (!contact.latitude || !contact.longitude) return;
    safeHaptics.selectionAsync();
    const url = Platform.select({
      ios: `maps:0,0?q=${contact.latitude},${contact.longitude}`,
      android: `geo:0,0?q=${contact.latitude},${contact.longitude}(${encodeURIComponent('مراسيم الأمراء')})`,
      default: `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`);
      });
    }
  }, [contact.latitude, contact.longitude]);

  const handleSendMessage = useCallback(() => {
    if (!name.trim()) {
      showAlert('تنبيه', 'يرجى إدخال الاسم');
      return;
    }
    if (!phone.trim()) {
      showAlert('تنبيه', 'يرجى إدخال رقم الهاتف');
      return;
    }
    if (!message.trim()) {
      showAlert('تنبيه', 'يرجى كتابة الرسالة');
      return;
    }

    safeHaptics.selectionAsync();
    setSending(true);

    // Send via WhatsApp with pre-filled message
    const whatsappMsg = `*رسالة من التطبيق*\n\n👤 الاسم: ${name.trim()}\n📱 الهاتف: ${phone.trim()}\n\n💬 الرسالة:\n${message.trim()}`;
    const cleanNumber = (contact.whatsapp || contact.phone || '').replace(/[^0-9+]/g, '').replace('+', '');

    if (cleanNumber) {
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMsg)}`;
      Linking.openURL(url)
        .then(() => {
          setName('');
          setPhone('');
          setMessage('');
          setSending(false);
        })
        .catch(() => {
          setSending(false);
          showAlert('خطأ', 'تعذر فتح واتساب. تأكد من تثبيت التطبيق.');
        });
    } else {
      setSending(false);
      showAlert('تنبيه', 'بيانات الاتصال غير متوفرة حالياً. يرجى المحاولة لاحقاً.');
    }
  }, [name, phone, message, contact.whatsapp, contact.phone, showAlert]);

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
        <Text style={styles.headerTitle}>تواصل معنا</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* Hero Section */}
          <View style={[styles.heroSection, { backgroundColor: brand.background_dark }]}>
            {brand.logo_url ? (
              <Image
                source={{ uri: brand.logo_url }}
                style={styles.heroLogoImage}
                contentFit="contain"
                transition={300}
              />
            ) : (
              <Image
                source={require('../assets/images/logo-gold.jpeg')}
                style={styles.heroLogoImage}
                contentFit="contain"
                transition={300}
              />
            )}
            <Text style={[styles.heroTitle, { color: brand.primary_color }]}>نسعد بتواصلك معنا</Text>
            <Text style={styles.heroSubtitle}>فريق {brand.store_name} في خدمتك دائماً</Text>
          </View>

          {/* WhatsApp CTA */}
          <Pressable
            style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={openWhatsApp}
          >
            <View style={styles.whatsappIcon}>
              <MaterialIcons name="chat" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.whatsappInfo}>
              <Text style={styles.whatsappTitle}>تواصل عبر واتساب</Text>
              <Text style={styles.whatsappSubtext}>أسرع طريقة للتواصل - رد فوري</Text>
            </View>
            <MaterialIcons name="chevron-left" size={24} color="rgba(255,255,255,0.7)" />
          </Pressable>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>طرق التواصل</Text>
            <View style={styles.quickActionsGrid}>
              {contact.phone ? (
                <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={openPhoneDialer}>
                  <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialIcons name="phone" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.actionLabel}>اتصال</Text>
                  <Text style={styles.actionValue} numberOfLines={1}>{contact.phone}</Text>
                </Pressable>
              ) : null}

              {contact.email ? (
                <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={openEmail}>
                  <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialIcons name="email" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.actionLabel}>بريد إلكتروني</Text>
                  <Text style={styles.actionValue} numberOfLines={1}>{contact.email}</Text>
                </Pressable>
              ) : null}

              {contact.instagram ? (
                <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={openInstagram}>
                  <View style={[styles.actionIconBg, { backgroundColor: '#FDF4FF' }]}>
                    <MaterialIcons name="camera-alt" size={24} color="#A855F7" />
                  </View>
                  <Text style={styles.actionLabel}>انستغرام</Text>
                  <Text style={styles.actionValue} numberOfLines={1}>@{contact.instagram}</Text>
                </Pressable>
              ) : null}

              {contact.address ? (
                <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]} onPress={openMap}>
                  <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
                    <MaterialIcons name="location-on" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.actionLabel}>الموقع</Text>
                  <Text style={styles.actionValue} numberOfLines={1}>افتح الخريطة</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Store Info */}
          <View style={styles.storeInfoSection}>
            {contact.address ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="place" size={20} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>العنوان</Text>
                  <Text style={styles.infoValue}>{contact.address}</Text>
                </View>
              </View>
            ) : null}

            {contact.working_hours ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={20} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>ساعات العمل</Text>
                  <Text style={styles.infoValue}>{contact.working_hours}</Text>
                </View>
              </View>
            ) : null}

            {contact.phone ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color={theme.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>الهاتف</Text>
                  <Text style={styles.infoValue}>{contact.phone}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Map Preview */}
          {contact.latitude && contact.longitude ? (
            <Pressable style={styles.mapSection} onPress={openMap}>
              <View style={styles.mapPlaceholder}>
                <MaterialIcons name="map" size={48} color={theme.primary} />
                <Text style={styles.mapText}>اضغط لفتح الموقع على الخريطة</Text>
                <Text style={styles.mapAddress} numberOfLines={2}>{contact.address}</Text>
              </View>
              <View style={styles.mapOverlay}>
                <MaterialIcons name="open-in-new" size={18} color="#FFFFFF" />
                <Text style={styles.mapOverlayText}>فتح في الخريطة</Text>
              </View>
            </Pressable>
          ) : null}

          {/* Message Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>أرسل لنا رسالة</Text>
            <Text style={styles.formSubtext}>سيتم إرسال رسالتك عبر واتساب مباشرة</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الاسم</Text>
              <TextInput
                style={styles.textInput}
                placeholder="أدخل اسمك"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput
                style={styles.textInput}
                placeholder="777 XXX XXX"
                placeholderTextColor={theme.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الرسالة</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={theme.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                sending && styles.sendBtnDisabled,
                pressed && !sending && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={theme.primary} style={{ transform: [{ scaleX: -1 }] }} />
                  <Text style={styles.sendBtnText}>إرسال عبر واتساب</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },

  // Hero
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, backgroundColor: theme.backgroundDark },
  heroLogoImage: { width: 120, height: 100, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', writingDirection: 'rtl', marginTop: 4 },

  // WhatsApp CTA
  whatsappBtn: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#25D366', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  whatsappIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  whatsappInfo: { flex: 1, alignItems: 'flex-end' },
  whatsappTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', writingDirection: 'rtl' },
  whatsappSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.85)', writingDirection: 'rtl', marginTop: 2 },

  // Quick Actions
  quickActionsSection: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  quickActionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48%', flexGrow: 1, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  actionIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  actionValue: { fontSize: 11, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center' },

  // Store Info
  storeInfoSection: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, gap: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  infoRow: { flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  infoContent: { flex: 1, alignItems: 'flex-end' },
  infoLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted, writingDirection: 'rtl', marginBottom: 2 },
  infoValue: { fontSize: 14, color: theme.textPrimary, writingDirection: 'rtl', lineHeight: 20, textAlign: 'right' },

  // Map
  mapSection: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6', position: 'relative',
  },
  mapPlaceholder: {
    height: 160, backgroundColor: '#FAF7F2',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  mapText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, writingDirection: 'rtl' },
  mapAddress: { fontSize: 12, color: theme.textMuted, writingDirection: 'rtl', textAlign: 'center', paddingHorizontal: 24 },
  mapOverlay: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: theme.backgroundDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  mapOverlayText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', writingDirection: 'rtl' },

  // Form
  formSection: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  formSubtext: { fontSize: 13, color: theme.textMuted, textAlign: 'right', writingDirection: 'rtl', marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  textInput: {
    height: 48, backgroundColor: '#F9FAFB', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: theme.textPrimary,
    writingDirection: 'rtl', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  sendBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.backgroundDark, borderRadius: 14,
    paddingVertical: 16, gap: 8, marginTop: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
});
