import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { CartProvider } from '@/contexts/CartContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { BrandProvider } from '@/contexts/BrandContext';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AlertProvider>
      <AuthProvider>
        <BrandProvider>
        <CartProvider>
          <StoreProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="checkout" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="orders" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="favorites" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="offers" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
                <Stack.Screen name="contact" options={{ animation: 'slide_from_left', gestureDirection: 'horizontal-inverted' }} />
              </Stack>
            </SafeAreaProvider>
          </StoreProvider>
        </CartProvider>
        </BrandProvider>
      </AuthProvider>
    </AlertProvider>
    </GestureHandlerRootView>
  );
}
