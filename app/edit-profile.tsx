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
import { useAuth, useAlert } from '@/template';
import { fetchUserProfile, updateUserProfile } from '@/services/database';
import * as Haptics from 'expo-haptics';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchUserProfile().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert('تنبيه', 'يرجى إدخال الاسم الكامل');
      return;
    }
    Haptics.selectionAsync();
    setSaving(true);
    const { error } = await updateUserProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setSaving(false);

    if (error) {
      showAlert('خطأ', error);
    } else {
      showAlert('تم', 'تم تحديث الملف الشخصي بنجاح');
      router.back();
    }
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={44} color={theme.primary} />
            </View>
            <Text style={styles.emailText}>{user?.email || ''}</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الاسم الكامل</Text>
              <TextInput
                style={styles.textInput}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={setFullName}
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
              <Text style={styles.inputLabel}>عنوان التوصيل الافتراضي</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="المدينة - الحي - الشارع - رقم المنزل"
                placeholderTextColor={theme.textMuted}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlign="right"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, writingDirection: 'rtl' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.primary },
  emailText: { fontSize: 14, color: theme.textMuted },
  formSection: { gap: 16, marginTop: 8 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  textInput: { height: 52, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl', borderWidth: 1.5, borderColor: '#F3F4F6' },
  textArea: { height: 90, paddingTop: 14, textAlignVertical: 'top' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  saveBtn: { backgroundColor: theme.backgroundDark, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
});
