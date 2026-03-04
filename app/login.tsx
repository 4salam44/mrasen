import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAuth, useAlert } from '@/template';
import { useBrand } from '@/hooks/useBrand';
import * as Haptics from 'expo-haptics';

type AuthMode = 'login' | 'register';
type RegisterStep = 'info' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const { brand } = useBrand();

  const [mode, setMode] = useState<AuthMode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('info');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const MIN_PASSWORD_LENGTH = 8;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }
    try { Haptics.selectionAsync(); } catch {}
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      showAlert('خطأ', error);
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('تنبيه', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!password.trim() || password.length < MIN_PASSWORD_LENGTH) {
      showAlert('تنبيه', `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`);
      return;
    }
    if (password !== confirmPassword) {
      showAlert('تنبيه', 'كلمة المرور غير متطابقة');
      return;
    }
    try { Haptics.selectionAsync(); } catch {}
    const { error } = await sendOTP(email.trim());
    if (error) {
      showAlert('خطأ', error);
      return;
    }
    showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    setRegisterStep('otp');
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('تنبيه', 'يرجى إدخال رمز التحقق');
      return;
    }
    try { Haptics.selectionAsync(); } catch {}
    const { error } = await verifyOTPAndLogin(email.trim(), otp.trim(), { password });
    if (error) {
      showAlert('خطأ', error);
    }
  };

  const switchMode = () => {
    try { Haptics.selectionAsync(); } catch {}
    setMode(mode === 'login' ? 'register' : 'login');
    setRegisterStep('info');
    setOtp('');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-forward" size={24} color={theme.textPrimary} />
          </Pressable>

          {/* Logo / Brand */}
          <View style={[styles.brandSection, { backgroundColor: brand.background_dark }]}>
            <View style={styles.logoContainer}>
              {brand.logo_url ? (
                <Image
                  source={{ uri: brand.logo_url }}
                  style={styles.logoImage}
                  contentFit="contain"
                  transition={300}
                />
              ) : (
                <Image
                  source={require('../assets/images/logo-gold.jpeg')}
                  style={styles.logoImage}
                  contentFit="contain"
                  transition={300}
                />
              )}
            </View>
            <Text style={[styles.brandTagline, { color: brand.primary_color }]}>{brand.tagline}</Text>
          </View>

          {/* Title */}
          <Text style={styles.pageTitle}>
            {mode === 'login' ? 'تسجيل الدخول' : (registerStep === 'otp' ? 'رمز التحقق' : 'إنشاء حساب')}
          </Text>
          <Text style={styles.pageSubtitle}>
            {mode === 'login'
              ? 'أدخل بياناتك للوصول إلى حسابك'
              : registerStep === 'otp'
                ? `تم إرسال رمز التحقق إلى ${email}`
                : 'أنشئ حساب جديد للتسوق بسهولة'}
          </Text>

          {/* Login Form */}
          {mode === 'login' ? (
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={theme.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="example@email.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
                  </Pressable>
                  <TextInput
                    style={styles.textInput}
                    placeholder="أدخل كلمة المرور"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textAlign="right"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={handleLogin}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={styles.primaryBtnText}>تسجيل الدخول</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* Register Form - Info Step */}
          {mode === 'register' && registerStep === 'info' ? (
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={theme.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="example@email.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={theme.textMuted} />
                  </Pressable>
                  <TextInput
                    style={styles.textInput}
                    placeholder="8 أحرف على الأقل"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color={theme.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="أعد إدخال كلمة المرور"
                    placeholderTextColor={theme.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    textAlign="right"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={handleSendOTP}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={styles.primaryBtnText}>إرسال رمز التحقق</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* Register Form - OTP Step */}
          {mode === 'register' && registerStep === 'otp' ? (
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رمز التحقق (4 أرقام)</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="verified" size={20} color={theme.textMuted} />
                  <TextInput
                    style={[styles.textInput, styles.otpInput]}
                    placeholder="- - - -"
                    placeholderTextColor={theme.textMuted}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                  />
                </View>
              </View>

              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={styles.primaryBtnText}>تأكيد وإنشاء الحساب</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.resendBtn}
                onPress={handleSendOTP}
                disabled={operationLoading}
              >
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Switch Mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            </Text>
            <Pressable onPress={switchMode}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Text>
            </Pressable>
          </View>

          {/* Skip Login */}
          <Pressable style={styles.skipBtn} onPress={() => router.back()}>
            <Text style={styles.skipText}>تصفح كضيف</Text>
            <MaterialIcons name="arrow-back" size={16} color={theme.textMuted} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end', marginTop: 8,
  },
  brandSection: { alignItems: 'center', marginTop: 16, marginBottom: 28, backgroundColor: theme.backgroundDark, marginHorizontal: -24, paddingVertical: 28, paddingHorizontal: 24, borderRadius: 20 },
  logoContainer: {
    width: 160, height: 140, marginBottom: 8,
  },
  logoImage: { width: '100%', height: '100%' },
  brandTagline: { fontSize: 14, color: theme.primary, marginTop: 4, writingDirection: 'rtl', fontWeight: '500', letterSpacing: 0.5 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  pageSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'right', writingDirection: 'rtl', marginTop: 6, marginBottom: 24, lineHeight: 22 },
  formSection: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  inputContainer: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 14, height: 52, gap: 10,
    borderWidth: 1.5, borderColor: '#F3F4F6',
  },
  textInput: { flex: 1, fontSize: 15, color: theme.textPrimary, writingDirection: 'rtl' },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 12 },
  primaryBtn: {
    backgroundColor: theme.backgroundDark, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  resendBtn: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14, color: theme.primary, fontWeight: '600', writingDirection: 'rtl' },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  switchText: { fontSize: 14, color: theme.textSecondary, writingDirection: 'rtl' },
  switchLink: { fontSize: 14, fontWeight: '700', color: theme.primary, writingDirection: 'rtl' },
  skipBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, paddingVertical: 12,
  },
  skipText: { fontSize: 14, color: theme.textMuted, writingDirection: 'rtl' },
});
