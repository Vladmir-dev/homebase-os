import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, Alert } from 'react-native';

import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type PaymentStatus = 'idle' | 'initializing' | 'pending' | 'successful' | 'failed' | 'error';

export default function CheckoutScreen() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    serviceFee,
    grandTotal,
    escrowFeeRate,
    clearCart,
    processCheckoutPayment,
    refreshAssetBalances,
    userProfile,
  } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [paymentInstruction, setPaymentInstruction] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const pollPaymentStatus = (id: number) => {
    stopPolling();
    pollTimer.current = setInterval(async () => {
      try {
        const res = await api.checkPaymentStatus(id);
        if (res.status === 'successful') {
          stopPolling();
          setPaymentStatus('successful');
          setPaymentInstruction('Payment confirmed and escrowed by the platform.');
          await refreshAssetBalances();
        } else if (res.status === 'failed') {
          stopPolling();
          setPaymentStatus('failed');
          setPaymentInstruction('Payment was not completed.');
        }
      } catch (e) {
        // Keep polling; the webhook may still be on its way.
        console.warn('Payment status check error:', e);
      }
    }, 4000);
  };

  const handlePlaceOrder = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your Mobile Money phone number.');
      return;
    }
    setLoading(true);
    setPaymentStatus('initializing');

    try {
      const res = await processCheckoutPayment(phoneNumber.trim());
      setPaymentId(res.payment_id);

      const instructionNote =
        res.next_action?.payment_instruction?.note ||
        `Payment prompt sent to ${phoneNumber}. Please authorize on your mobile phone.`;
      setPaymentInstruction(instructionNote);

      setPaymentStatus('pending');
      setModalVisible(true);
      if (res.payment_id) {
        pollPaymentStatus(res.payment_id);
      }
    } catch (err: any) {
      console.warn('Payment initialization notice:', err);
      setPaymentStatus('error');
      setPaymentInstruction(
        `Payment request recorded. Please authorize payment on ${phoneNumber}.`,
      );
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    stopPolling();
    clearCart();
    setModalVisible(false);
    router.replace('/(tabs)');
  };

  const handleRetry = () => {
    stopPolling();
    setModalVisible(false);
    setPaymentStatus('idle');
  };

  const statusIcon =
    paymentStatus === 'failed' || paymentStatus === 'error'
      ? 'close-circle'
      : paymentStatus === 'pending'
        ? 'time'
        : 'checkmark-circle';

  const statusColor =
    paymentStatus === 'failed' || paymentStatus === 'error'
      ? '#c62828'
      : paymentStatus === 'pending'
        ? '#f9a825'
        : '#2563EB';

  const modalTitle =
    paymentStatus === 'pending'
      ? 'Payment Processing'
      : paymentStatus === 'successful'
        ? 'Payment Confirmed & Escrowed'
        : paymentStatus === 'failed' || paymentStatus === 'error'
          ? 'Payment Not Completed'
          : 'Payment Prompt Triggered!';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
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
          <Ionicons name="phone-portrait-outline" size={20} color="#2563EB" />
          <Text style={styles.paymentLabel}>MTN / Airtel Mobile Money (Flutterwave Escrow)</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>UGX {cartTotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Platform Escrow Fee ({escrowFeeRate}%)</Text>
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

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {paymentStatus === 'pending' ? (
              <ActivityIndicator size="large" color={statusColor} />
            ) : (
              <Ionicons name={statusIcon} size={64} color={statusColor} />
            )}
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>
              {paymentInstruction || 'Please complete the PIN authorization on your phone.'}
            </Text>
            {paymentStatus === 'pending' ? (
              <Text style={styles.modalHint}>Confirming payment with the gateway…</Text>
            ) : null}
            {paymentStatus === 'failed' || paymentStatus === 'error' ? (
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.doneBtnText}>Try Again</Text>
              </TouchableOpacity>
            ) : null}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8,
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemQty: { fontSize: 13, color: '#64748B', marginHorizontal: 12, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  divider: { height: 1, backgroundColor: 'rgba(37, 99, 235, 0.15)', marginVertical: 16 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  infoLabel: { fontSize: 13, fontWeight: '600', color: '#6b8c70' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  phoneInput: { fontSize: 14, fontWeight: '700', color: '#1E293B', padding: 0, textAlign: 'right', flex: 1 },
  paymentLabel: { marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: '#6b8c70' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  grandTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#e0e0e0', marginBottom: 16 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  placeOrderBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalHint: { fontSize: 12, color: '#f9a825', marginBottom: 12 },
  doneBtn: { backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  retryBtn: { backgroundColor: '#c62828', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
