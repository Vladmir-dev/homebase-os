import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApp } from '../context/AppContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);

  const serviceFee = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + serviceFee;

  const handlePlaceOrder = () => {
    setShowSuccess(true);
  };

  const handleDone = () => {
    clearCart();
    setShowSuccess(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        {cart.map((item) => (
          <View key={item.service.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.service.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              UGX {item.service.price * item.quantity}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>+256 700 000 000</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>pius@example.com</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.infoCard}>
          <Ionicons name="cash-outline" size={20} color="#2e7d32" />
          <Text style={styles.paymentLabel}>Cash on Delivery</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>UGX {cartTotal}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Service Fee (5%)</Text>
          <Text style={styles.totalValue}>UGX {serviceFee}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>UGX {grandTotal}</Text>
        </View>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={64} color="#2e7d32" />
            <Text style={styles.modalTitle}>Order Placed!</Text>
            <Text style={styles.modalMessage}>
              Your order has been placed successfully. You will be notified once it's confirmed.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  itemQty: { fontSize: 13, color: '#4c8c4a', marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#000' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 20 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  infoLabel: { fontSize: 13, color: '#4c8c4a', width: 60 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1b5e20', flex: 1 },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: '#1b5e20', marginLeft: 10 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: '#4c8c4a' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  grandTotalRow: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  grandTotalLabel: { fontSize: 17, fontWeight: '700', color: '#1b5e20' },
  grandTotalValue: { fontSize: 17, fontWeight: '700', color: '#000' },
  placeOrderBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1b5e20', marginTop: 16, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#4c8c4a', textAlign: 'center', lineHeight: 22 },
  doneBtn: {
    marginTop: 24,
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
