import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useAuth, useAlert } from '@/template';
import { fetchUserProfile, fetchUserOrders } from '@/services/database';
import { useBrand } from '@/hooks/useBrand';
import * as Haptics from 'expo-haptics';

const safeHaptics = {
  selectionAsync: () => {
    try { Haptics.selectionAsync(); } catch {}
  },
};

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  showChevron?: boolean;
  color?: string;
  onPress?: () => void;
}

function SettingItem({ icon, label, value, showChevron = true, color, onPress }: SettingItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingItem, pressed && { opacity: 0.7 }]}
      onPress={() => { if (onPress) { safeHaptics.selectionAsync(); onPress(); } }}
    >
      <View style={styles.settingRight}>
        <View style={[styles.settingIcon, color ? { backgroundColor: color + '15' } : {}]}>
          <MaterialIcons name={icon as any} size={22} color={color || theme.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingLeft}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {showChevron ? (
          <MaterialIcons name="chevron-left" size={22} color={theme.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getItemCount, favorites } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const { showAlert } = useAlert();
  const { brand } = useBrand();

  const [profile, setProfile] = useState<any>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    const [profileRes, ordersRes] = await Promise.all([
      fetchUserProfile(),
      fetchUserOrders(),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (ordersRes.data) setOrderCount(ordersRes.data.length);
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  const handleLogout = () => {
    showAlert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) showAlert('خطأ', error);
        },
      },
    ]);
  };

  const isLoggedIn = !!user;
  const displayName = profile?.full_name || user?.username || user?.email?.split('@')[0] || 'ضيف';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={40} color={theme.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userSubtext}>
                {isLoggedIn ? (user?.email || '') : 'تسجيل الدخول للمزيد من المميزات'}
              </Text>
            </View>
          </View>
          {isLoggedIn ? (
            <Pressable
              style={styles.editProfileBtn}
              onPress={() => router.push('/edit-profile')}
            >
              <MaterialIcons name="edit" size={16} color={theme.primary} />
              <Text style={styles.editProfileText}>تعديل الملف الشخصي</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/cart')}>
            <Text style={styles.statValue}>{getItemCount()}</Text>
            <Text style={styles.statLabel}>في السلة</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => router.push('/favorites')}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>المفضلة</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => { if (isLoggedIn) router.push('/orders'); else router.push('/login'); }}>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>الطلبات</Text>
          </Pressable>
        </View>

        {/* Shopping */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>التسوق</Text>
          <SettingItem
            icon="local-offer"
            label="العروض والخصومات"
            onPress={() => router.push('/offers')}
          />
          <SettingItem
            icon="favorite"
            label="المفضلة"
            value={`${favorites.length} منتج`}
            onPress={() => router.push('/favorites')}
          />
        </View>

        {/* Orders */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>الطلبات والمشتريات</Text>
          <SettingItem
            icon="shopping-bag"
            label="طلباتي"
            value={orderCount > 0 ? `${orderCount} طلب` : 'لا توجد طلبات'}
            onPress={() => { if (isLoggedIn) router.push('/orders'); else router.push('/login'); }}
          />
          <SettingItem
            icon="history"
            label="المشاهدة مؤخرا"
            onPress={() => router.push('/(tabs)/categories')}
          />
        </View>

        {/* Account */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>الحساب</Text>
          {isLoggedIn ? (
            <>
              <SettingItem
                icon="person-outline"
                label="معلومات الحساب"
                onPress={() => router.push('/edit-profile')}
              />
              <SettingItem
                icon="location-on"
                label="عنوان التوصيل"
                value={profile?.address ? 'محدد' : 'غير محدد'}
                onPress={() => router.push('/edit-profile')}
              />
            </>
          ) : (
            <SettingItem
              icon="login"
              label="تسجيل الدخول / إنشاء حساب"
              onPress={() => router.push('/login')}
            />
          )}
        </View>

        {/* Support */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>الدعم</Text>
          <SettingItem icon="headset-mic" label="تواصل معنا" onPress={() => router.push('/contact')} />
          <SettingItem icon="help-outline" label="الأسئلة الشائعة" onPress={() => showAlert('الأسئلة الشائعة', 'سيتم إضافة هذا القسم قريبا')} />
          <SettingItem icon="info-outline" label="عن التطبيق" value="1.0.0" showChevron={false} />
        </View>

        {/* Logout / Delete */}
        {isLoggedIn ? (
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="logout"
              label="تسجيل الخروج"
              showChevron={false}
              color="#F59E0B"
              onPress={handleLogout}
            />
            <SettingItem
              icon="delete-outline"
              label="حذف الحساب"
              showChevron={false}
              color="#EF4444"
              onPress={() => showAlert('حذف الحساب', 'هذا الخيار غير متاح حاليا. تواصل مع الدعم لحذف حسابك.')}
            />
          </View>
        ) : null}

        {/* Store Info */}
        <View style={styles.storeInfo}>
          {(brand.icon_url || brand.logo_url) ? (
            <Image
              source={{ uri: brand.icon_url || brand.logo_url }}
              style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 8 }}
              contentFit="contain"
              transition={200}
            />
          ) : null}
          <Text style={[styles.storeInfoName, { color: brand.primary_color }]}>{brand.store_name}</Text>
          <Text style={styles.storeInfoText}>{brand.store_description}</Text>
          <Text style={styles.storeInfoVersion}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  profileHeader: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 20, marginBottom: 8 },
  avatarContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.primary },
  profileInfo: { flex: 1, alignItems: 'flex-end' },
  userName: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  userSubtext: { fontSize: 13, color: theme.textMuted, marginTop: 2, writingDirection: 'rtl' },
  loginBtn: { backgroundColor: theme.backgroundDark, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { fontSize: 15, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },
  editProfileBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB', paddingVertical: 10, borderRadius: 12 },
  editProfileText: { fontSize: 14, fontWeight: '600', color: theme.primary, writingDirection: 'rtl' },
  statsRow: { flexDirection: 'row-reverse', backgroundColor: '#FFFFFF', paddingVertical: 16, marginBottom: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  statLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2, writingDirection: 'rtl' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB', alignSelf: 'center' },
  settingsGroup: { backgroundColor: '#FFFFFF', marginBottom: 8, paddingTop: 4 },
  groupTitle: { fontSize: 13, fontWeight: '600', color: theme.textMuted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, textAlign: 'right', writingDirection: 'rtl', textTransform: 'uppercase', letterSpacing: 0.5 },
  settingItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  settingRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '500', color: theme.textPrimary, writingDirection: 'rtl' },
  settingLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 13, color: theme.textMuted, writingDirection: 'rtl' },
  storeInfo: { alignItems: 'center', paddingVertical: 32 },
  storeInfoName: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  storeInfoText: { fontSize: 12, color: theme.textMuted, marginTop: 4, writingDirection: 'rtl' },
  storeInfoVersion: { fontSize: 11, color: theme.textMuted, marginTop: 8 },
});
