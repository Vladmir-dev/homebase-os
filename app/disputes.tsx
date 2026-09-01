import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';

import { api } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  open: '#EF4444',
  under_review: '#F59E0B',
  evidence_requested: '#F59E0B',
  arbitration: '#2563EB',
  resolved_customer: '#22C55E',
  resolved_provider: '#22C55E',
  resolved_refund: '#22C55E',
  closed: '#64748B',
};

export default function DisputesScreen() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newDisputeModal, setNewDisputeModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [transactionDropdownVisible, setTransactionDropdownVisible] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [disputeType, setDisputeType] = useState('quality');
  const [newMessage, setNewMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      const data = await api.getDisputes();
      setDisputes(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to load disputes:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to load transactions:', err.message);
    }
  }, []);

  const openNewDisputeModal = () => {
    fetchTransactions();
    setNewDisputeModal(true);
  };

  const handleCreateDispute = async () => {
    if (!transactionId.trim() || !subject.trim() || !description.trim()) {
      Alert.alert('Required', 'Please select a transaction, subject, and description.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createDispute({
        transaction: Number(transactionId),
        dispute_type: disputeType,
        subject: subject.trim(),
        description: description.trim(),
      });
      setNewDisputeModal(false);
      setTransactionId('');
      setSubject('');
      setDescription('');
      fetchDisputes();
      Alert.alert('Filed', 'Dispute has been filed.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;
    setActionLoading(true);
    try {
      await api.addDisputeMessage(selectedDispute.id, newMessage.trim());
      setNewMessage('');
      const updated = await api.getDisputeById(selectedDispute.id);
      setSelectedDispute(updated);
      fetchDisputes();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (resolution: string) => {
    Alert.alert('Resolve', `Resolve as ${resolution.replace('_', ' ')}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.resolveDispute(selectedDispute.id, resolution);
            setDetailModalVisible(false);
            setSelectedDispute(null);
            fetchDisputes();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disputes</Text>
        <TouchableOpacity onPress={openNewDisputeModal}>
          <Ionicons name="add-circle-outline" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {disputes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No disputes filed</Text>
          </View>
        ) : (
          disputes.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.disputeCard}
              onPress={() => {
                setSelectedDispute(d);
                setDetailModalVisible(true);
              }}
            >
              <View style={styles.disputeTopRow}>
                <Text style={styles.disputeId}>#{d.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[d.status] || '#64748B') + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[d.status] || '#64748B' }]}>
                    {d.status?.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.disputeSubject}>{d.subject}</Text>
              <Text style={styles.disputeMeta}>
                {d.dispute_type} • Filed by {d.filed_by_email}
              </Text>
              {d.refund_amount > 0 && (
                <Text style={styles.disputeRefund}>
                  Refund: UGX {Number(d.refund_amount).toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispute #{selectedDispute?.id}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailSubject}>{selectedDispute?.subject}</Text>
              <Text style={styles.detailDesc}>{selectedDispute?.description}</Text>

              <Text style={styles.messagesTitle}>Messages</Text>
              {(selectedDispute?.messages || []).map((msg: any) => (
                <View key={msg.id} style={styles.messageBubble}>
                  <Text style={styles.messageSender}>{msg.sender_email}</Text>
                  <Text style={styles.messageText}>{msg.message}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.created_at).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Add a message..."
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendMessage}
                  disabled={actionLoading || !newMessage.trim()}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {selectedDispute?.status !== 'closed' && (
                <View style={styles.resolveButtons}>
                  <TouchableOpacity
                    style={styles.resolveBtn}
                    onPress={() => handleResolve('resolved_customer')}
                  >
                    <Text style={styles.resolveBtnText}>Resolve for Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveBtn, { backgroundColor: '#22C55E' }]}
                    onPress={() => handleResolve('resolved_provider')}
                  >
                    <Text style={styles.resolveBtnText}>Resolve for Provider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => handleResolve('closed')}
                  >
                    <Text style={styles.resolveBtnText}>Close Dispute</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Dispute Modal */}
      <Modal visible={newDisputeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Dispute</Text>
              <TouchableOpacity onPress={() => setNewDisputeModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Transaction</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setTransactionDropdownVisible(!transactionDropdownVisible)}
            >
              <Text style={transactionId ? styles.dropdownText : styles.dropdownPlaceholder}>
                {transactionId ? `#${transactionId}` : 'Select a transaction'}
              </Text>
              <Ionicons name={transactionDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
            </TouchableOpacity>
            {transactionDropdownVisible && (
              <View style={styles.dropdownList}>
                {transactions.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No transactions available.</Text>
                ) : (
                  transactions.map((t: any) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.dropdownOption, String(t.id) === transactionId && styles.dropdownOptionActive]}
                      onPress={() => { setTransactionId(String(t.id)); setTransactionDropdownVisible(false); }}
                    >
                      <Text style={[styles.dropdownOptionText, String(t.id) === transactionId && { color: '#fff' }]}>
                        #{t.id} · {t.currency} {t.amount}{t.asset_name ? ` · ${t.asset_name}` : ''}{t.type ? ` · ${t.type.replace('_', ' ')}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['quality', 'incomplete', 'overcharge', 'no_show', 'material', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, disputeType === t && styles.typeBtnActive]}
                  onPress={() => setDisputeType(t)}
                >
                  <Text style={[styles.typeBtnText, disputeType === t && styles.typeBtnTextActive]}>
                    {t.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief summary"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue..."
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, actionLoading && { opacity: 0.6 }]}
              onPress={handleCreateDispute}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>File Dispute</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  disputeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  disputeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  disputeId: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  disputeSubject: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  disputeMeta: { fontSize: 13, color: '#64748B' },
  disputeRefund: { fontSize: 13, fontWeight: '700', color: '#F59E0B', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  detailSubject: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  messagesTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  messageBubble: {
    backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  messageSender: { fontSize: 12, fontWeight: '600', color: '#2563EB', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#1E293B' },
  messageTime: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  messageInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  messageInput: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  resolveButtons: { gap: 8, marginBottom: 20 },
  resolveBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  resolveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownText: { fontSize: 14, color: '#1E293B' },
  dropdownPlaceholder: { fontSize: 14, color: '#94A3B8' },
  dropdownList: { marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionActive: { backgroundColor: '#2563EB' },
  dropdownOptionText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropdownEmpty: { padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  typeBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
