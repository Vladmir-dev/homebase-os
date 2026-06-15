import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import 'react-native-reanimated';

import { AppProvider } from '@/context/AppContext';
import { useApp } from '@/context/AppContext';
import { BlurView } from 'expo-blur';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const styles = StyleSheet.create({
  floatingCartContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    ...Platform.select({
      android: { elevation: 0 },
    }),
  },

  floatingCart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    gap: 8,
  },

  floatingCartPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    transform: [{ scale: 0.96 }],
  },

  cartBadge: {
    backgroundColor: '#d32f2f', // Vibrant red for attention
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  cartTotalText: {
    color: '#1b5e20',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

const HIDE_CART_ROUTES = ['/checkout', '/cart', '/modal', '/(auth)'];

function CartBadge() {
  const { cartCount, cartTotal } = useApp();
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const pathname = usePathname();

  if (cartCount === 0) return null;
  if (HIDE_CART_ROUTES.some((route) => pathname.startsWith(route))) return null;

  return (
    <BlurView 
      intensity={85} 
      tint="light" 
      style={styles.floatingCartContainer}
    >
      <Pressable
        style={({ pressed }) => [
          styles.floatingCart,
          pressed && styles.floatingCartPressed
        ]}
        onPress={() => router.navigate('/cart')}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <Ionicons name="cart" size={24} color="#1b5e20" />

        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cartCount}</Text>
        </View>

        <Text style={styles.cartTotalText}>UGX {cartTotal.toLocaleString()}</Text>
      </Pressable>
    </BlurView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useApp();

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="category/[categoryId]" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
      ) : (
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      )}
      <CartBadge />
    </View>
  );
}
