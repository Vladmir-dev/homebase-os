import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <Stack screenOptions={{ headerShown: false }} />
      <View style={styles.bottomTabContainer}>
        <TouchableOpacity style={styles.tabNode} onPress={() => router.replace('/')}>
          <Ionicons name="home-outline" size={22} color="#757575" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabNode}>
          <Ionicons name="cart-outline" size={22} color="#757575" />
          <Text style={styles.tabLabel}>Cart</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.tabNode}>
          <Ionicons name="basket-outline" size={22} color="#757575" />
          <Text style={styles.tabLabel}>Native</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity style={styles.tabNode}>
          <Ionicons name="sparkles-outline" size={22} color="#757575" />
          <Text style={styles.tabLabel}>Beauty</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.tabNode}>
          <Ionicons name="person-outline" size={22} color="#757575" />
          <Text style={styles.tabLabel}>Account</Text>
        </TouchableOpacity>
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
  tabIconCircle: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  activeTabCircle: { backgroundColor: '#000', borderRadius: 6 },
  tabIconText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tabLabel: { fontSize: 11, color: '#757575', marginTop: 4, fontWeight: '500' },
  activeTabLabel: { color: '#000', fontWeight: '700' },
});
