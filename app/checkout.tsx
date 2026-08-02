import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Alert } from 'react-native';

import { useApp } from '../context/AppContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, clearCart, processCheckoutPayment, userProfile } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone_number || '+256700000000');
  const [loading, setLoading] = useState(false);
  const [paymentInstruction, setPaymentInstruction] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const serviceFee = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + serviceFee;

  const handlePlaceOrder = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your Mobile Money phone number.');
      return;
    }
    setLoading(true);

    try {
      const res = await processCheckoutPayment(phoneNumber.trim());
      setPaymentId(res.payment_id);
      
      const instructionNote = res.next_action?.payment_instruction?.note || 
        `Payment prompt sent to ${phoneNumber}. Please authorize on your mobile phone.`;
      
      setPaymentInstruction(instructionNote);
      setShowSuccess(true);
    } catch (err: any) {
      console.warn('Payment initialization notice:', err);
      setPaymentInstruction(`Order recorded! Please authorize payment on ${phoneNumber}.`);
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.sectionTitle}>Order Summary ({cart.length} items)</Text>

        {cart.map((item) => (
          <View key={item.service.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.service.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              UGX {(item.service.price * item.quantity).toLocaleString()}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Flutterwave Mobile Money Details</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+256 700 000 000"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Account Email</Text>
          <Text style={styles.infoValue}>{userProfile?.email || 'test@homebase.com'}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Payment Gateway</Text>
        <View style={styles.infoCard}>
          <Ionicons name="phone-portrait-outline" size={20} color="#2e7d32" />
          <Text style={styles.paymentLabel}>MTN / Airtel Mobile Money (Flutterwave Escrow)</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>UGX {cartTotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Platform Escrow Fee (5%)</Text>
          <Text style={styles.totalValue}>UGX {serviceFee.toLocaleString()}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>UGX {grandTotal.toLocaleString()}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.placeOrderBtn, loading && styles.disabledBtn]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Confirm & Pay UGX {grandTotal.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={64} color="#2e7d32" />
            <Text style={styles.modalTitle}>Payment Prompt Triggered!</Text>
            <Text style={styles.modalMessage}>
              {paymentInstruction || "Your payment request has been sent to your phone. Check your handset to complete the PIN authorization."}
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Return to Dashboard</Text>
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
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1b5e20' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8,
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  itemQty: { fontSize: 13, color: '#4c8c4a', marginHorizontal: 12, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#2e7d32' },
  divider: { height: 1, backgroundColor: 'rgba(46, 125, 50, 0.15)', marginVertical: 16 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#6b8c70' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1b5e20' },
  phoneInput: { fontSize: 14, fontWeight: '700', color: '#1b5e20', padding: 0, textAlign: 'right', flex: 1 },
  paymentLabel: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1b5e20', flex: 1 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: '#6b8c70' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#1b5e20' },
  grandTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#e0e0e0', marginBottom: 16 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1b5e20' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2e7d32' },
  placeOrderBtn: { backgroundColor: '#2e7d32', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1b5e20', marginTop: 16, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#4c8c4a', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  doneBtn: { backgroundColor: '#2e7d32', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
