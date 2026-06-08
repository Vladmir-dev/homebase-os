import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useApp();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color="#a5d6a7" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add services to get started</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/')}>
            <Text style={styles.browseBtnText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.service.id} style={styles.cartRow}>
                <Image source={{ uri: item.service.image }} style={styles.cartImage} />
                <View style={styles.cartInfo}>
                  <Text style={styles.cartName}>{item.service.name}</Text>
                  <Text style={styles.cartPrice}>UGX {item.service.price}</Text>
                </View>
                <View style={styles.counterBox}>
                  <TouchableOpacity onPress={() => removeFromCart(item.service.id)}>
                    <Text style={styles.counterBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => addToCart(item.service)}>
                    <Text style={styles.counterBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>UGX {cartTotal}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1b5e20' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#4c8c4a', marginTop: 6 },
  browseBtn: {
    marginTop: 24,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  cartImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#c8e6c9' },
  cartInfo: { flex: 1, marginLeft: 12 },
  cartName: { fontSize: 15, fontWeight: '600', color: '#1b5e20' },
  cartPrice: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 4 },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 4,
  },
  counterBtn: { color: '#fff', fontSize: 16, fontWeight: '700', paddingHorizontal: 12 },
  countText: { color: '#fff', fontWeight: '700', fontSize: 14, minWidth: 20, textAlign: 'center' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#1b5e20' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  checkoutBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
