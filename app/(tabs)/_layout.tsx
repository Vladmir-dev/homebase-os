import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { label: 'Home', icon: 'home-outline' as const, route: '/' },
  { label: 'Cart', icon: 'cart-outline' as const, route: '/cart' },
  { label: 'Account', icon: 'person-outline' as const, route: '/account' },
];

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentSegment = segments[segments.length - 1] || '(tabs)';

  return (
    <View style={styles.wrapper}>
      <Stack screenOptions={{ headerShown: false }} />
      <View style={styles.bottomTabContainer}>
        {TABS.map((tab) => {
          const active =
            tab.route === '/'
              ? currentSegment === '(tabs)'
              : currentSegment === tab.route.slice(1);
          return (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabNode}
              onPress={() => router.replace(tab.route as any)}
            >
              <Ionicons name={tab.icon} size={22} color={active ? '#2e7d32' : '#757575'} />
              <Text
                style={[
                  styles.tabLabel,
                  active && { color: '#2e7d32', fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  bottomTabContainer: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    borderColor: '#f5f5f5',
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabNode: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: {
    fontSize: 11,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
});
