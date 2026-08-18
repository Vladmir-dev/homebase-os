import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748B',
  submitted: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  expired: '#64748B',
};

const TYPE_LABELS: Record<string, string> = {
  labour: 'Labour',
  material: 'Materials',
  other: 'Other',
};

export default function QuotationDetailScreen() {
  const { quotationId } = useLocalSearchParams<{ quotationId: string }>();
  const router = useRouter();
  const { userProfile } = useApp();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchQuotation = async () => {
    try {
      const data = await api.getQuotationById(quotationId!);
      setQuotation(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const isCustomer =
    quotation?.customer_email === userProfile?.email;
  const isProvider =
    quotation?.provider === userProfile?.id;

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await api.submitQuotation(quotation.id);
      await fetchQuotation();
      Alert.alert('Submitted', 'Quotation has been submitted to the customer.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
      'Approve Quotation',
      `Approve this quotation for UGX ${Number(quotation.total).toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.approveQuotation(quotation.id, notes);
              await fetchQuotation();
              Alert.alert('Approved', 'Quotation approved. Job tracking is now active.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Quotation',
      'Are you sure you want to reject this quotation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.rejectQuotation(quotation.id, notes);
              await fetchQuotation();
              Alert.alert('Rejected', 'Quotation has been rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!quotation) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Quotation not found.</Text>
      </View>
    );
  }

  const itemsByType = {
    labour: (quotation.items || []).filter((i: any) => i.item_type === 'labour'),
    material: (quotation.items || []).filter((i: any) => i.item_type === 'material'),
    other: (quotation.items || []).filter((i: any) => i.item_type === 'other'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotation Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[quotation.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[quotation.status] }]}>
              {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.bookingId}>Booking #{quotation.booking_id_display}</Text>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyCard}>
            <Text style={styles.partyLabel}>Provider</Text>
            <Text style={styles.partyValue}>{quotation.provider_email}</Text>
          </View>
          <View style={styles.partyCard}>
            <Text style={styles.partyLabel}>Customer</Text>
            <Text style={styles.partyValue}>{quotation.customer_email}</Text>
          </View>
        </View>

        {(['labour', 'material', 'other'] as const).map((type) => {
          const typeItems = itemsByType[type];
          if (typeItems.length === 0) return null;
          return (
            <View key={type} style={styles.section}>
              <Text style={styles.sectionTitle}>{TYPE_LABELS[type]}</Text>
              {typeItems.map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity || 1} {item.unit || 'unit'} x UGX {Number(item.unit_price).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>UGX {Number(item.total).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Labour</Text>
            <Text style={styles.totalValue}>UGX {Number(quotation.subtotal_labour).toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Materials</Text>
            <Text style={styles.totalValue}>UGX {Number(quotation.subtotal_materials).toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Other</Text>
            <Text style={styles.totalValue}>UGX {Number(quotation.subtotal_other).toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TruHub Fee</Text>
            <Text style={styles.totalValue}>UGX {Number(quotation.truhub_fee).toLocaleString()}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>UGX {Number(quotation.total).toLocaleString()}</Text>
          </View>
        </View>

        {quotation.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Provider Notes</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        ) : null}

        {isCustomer && quotation.status === 'submitted' && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Your Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note..."
              multiline
            />
          </View>
        )}
      </ScrollView>

      {isProvider && quotation.status === 'draft' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, actionLoading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit to Customer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isCustomer && quotation.status === 'submitted' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.rejectBtn, actionLoading && styles.disabledBtn]}
            onPress={handleReject}
            disabled={actionLoading}
          >
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, actionLoading && styles.disabledBtn]}
            onPress={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.approveBtnText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '700' },
  bookingId: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  partiesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  partyCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  partyLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  partyValue: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8,
  },
  itemDesc: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  totalsSection: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 13, color: '#64748B' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  grandTotalRow: {
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#E2E8F0',
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  notesSection: { marginBottom: 20 },
  notesText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  notesInput: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14,
    color: '#1E293B', minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  footer: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12,
  },
  submitBtn: {
    flex: 1, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  approveBtn: {
    flex: 1, backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rejectBtn: {
    flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: '#EF4444',
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  rejectBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
