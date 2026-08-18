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
import { useApp } from '../context/AppContext';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748B',
  medium: '#F59E0B',
  high: '#EF4444',
  emergency: '#DC2626',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#EF4444',
  in_progress: '#2563EB',
  resolved: '#22C55E',
  cancelled: '#94A3B8',
};

const STATUS_FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Cancelled'];

export default function MaintenanceScreen() {
  const router = useRouter();
  const { activeAsset, createMaintenanceRequest, userProfile } = useApp();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.getMaintenanceRequests();
      setTickets(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      console.warn('Failed to load maintenance tickets:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'All') return true;
    return t.status === filter.toLowerCase().replace(' ', '_');
  });

  const counts = {
    All: tickets.length,
    Open: tickets.filter((t) => t.status === 'open').length,
    'In Progress': tickets.filter((t) => t.status === 'in_progress').length,
    Resolved: tickets.filter((t) => t.status === 'resolved').length,
    Cancelled: tickets.filter((t) => t.status === 'cancelled').length,
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert('Required', 'Please enter a title and description.');
      return;
    }
    setActionLoading(true);
    try {
      await createMaintenanceRequest(newTitle.trim(), newDescription.trim(), newPriority);
      setNewModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      fetchTickets();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'start' | 'resolve' | 'cancel') => {
    const labels = { start: 'Start', resolve: 'Resolve', cancel: 'Cancel' };
    Alert.alert(
      `${labels[action]} Ticket`,
      `Are you sure you want to ${labels[action].toLowerCase()} this maintenance request?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setActionLoading(true);
            try {
              if (action === 'start') await api.startMaintenance(id);
              else if (action === 'resolve') await api.resolveMaintenance(id);
              else await api.cancelMaintenance(id);
              setDetailVisible(false);
              setSelectedTicket(null);
              fetchTickets();
            } catch (err: any) {
              Alert.alert('Error', err.message || `Failed to ${action} ticket.`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openDetail = (ticket: any) => {
    setSelectedTicket(ticket);
    setDetailVisible(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
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
        <Text style={styles.headerTitle}>Maintenance</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setNewModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f} ({counts[f as keyof typeof counts] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No maintenance tickets</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'All' ? 'Tap + to submit a maintenance request' : `No ${filter.toLowerCase()} tickets`}
            </Text>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => openDetail(ticket)}
              activeOpacity={0.7}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketTitleRow}>
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[ticket.priority] || '#64748B' }]} />
                  <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + '18' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] || '#64748B' }]}>
                    {ticket.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketDescription} numberOfLines={2}>{ticket.description}</Text>
              <View style={styles.ticketFooter}>
                <View style={styles.ticketMeta}>
                  <Ionicons name="home-outline" size={13} color="#94A3B8" />
                  <Text style={styles.ticketMetaText}>{ticket.asset_name || 'Asset'}</Text>
                </View>
                <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
              </View>
              {(ticket.estimated_cost || ticket.actual_cost) ? (
                <View style={styles.costRow}>
                  {ticket.estimated_cost && (
                    <Text style={styles.costText}>Est: UGX {Number(ticket.estimated_cost).toLocaleString()}</Text>
                  )}
                  {ticket.actual_cost && (
                    <Text style={[styles.costText, { color: '#22C55E' }]}>Actual: UGX {Number(ticket.actual_cost).toLocaleString()}</Text>
                  )}
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => { setDetailVisible(false); setSelectedTicket(null); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {selectedTicket && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>{selectedTicket.title}</Text>
                  <View style={styles.detailBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[selectedTicket.priority] + '18' }]}>
                      <Text style={[styles.priorityText, { color: PRIORITY_COLORS[selectedTicket.priority] }]}>
                        {selectedTicket.priority}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedTicket.status] + '18' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[selectedTicket.status] }]}>
                        {selectedTicket.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedTicket.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Property</Text>
                  <Text style={styles.detailValue}>{selectedTicket.asset_name || '—'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Submitted By</Text>
                  <Text style={styles.detailValue}>{selectedTicket.tenant_email || '—'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Created</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedTicket.created_at)}</Text>
                  </View>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Updated</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedTicket.updated_at)}</Text>
                  </View>
                </View>

                {(selectedTicket.estimated_cost || selectedTicket.actual_cost) && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Estimated Cost</Text>
                      <Text style={styles.detailValue}>
                        {selectedTicket.estimated_cost ? `UGX ${Number(selectedTicket.estimated_cost).toLocaleString()}` : '—'}
                      </Text>
                    </View>
                    <View style={styles.detailHalf}>
                      <Text style={styles.detailLabel}>Actual Cost</Text>
                      <Text style={styles.detailValue}>
                        {selectedTicket.actual_cost ? `UGX ${Number(selectedTicket.actual_cost).toLocaleString()}` : '—'}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedTicket.booking && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Linked Booking</Text>
                    <Text style={styles.detailValue}>#{selectedTicket.booking}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                  {selectedTicket.status === 'open' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
                      onPress={() => handleAction(selectedTicket.id, 'start')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="play-outline" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Start Work</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                      onPress={() => handleAction(selectedTicket.id, 'resolve')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Mark Resolved</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'cancelled' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EF4444' }]}
                      onPress={() => handleAction(selectedTicket.id, 'cancel')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* New Request Modal */}
      <Modal visible={newModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Maintenance Request</Text>
              <TouchableOpacity onPress={() => setNewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Leaking kitchen tap"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Describe the issue..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {(['low', 'medium', 'high', 'emergency'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityOption,
                        newPriority === p && { backgroundColor: PRIORITY_COLORS[p] + '18', borderColor: PRIORITY_COLORS[p] },
                      ]}
                      onPress={() => setNewPriority(p)}
                    >
                      <Text style={[styles.priorityOptionText, newPriority === p && { color: PRIORITY_COLORS[p] }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, actionLoading && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  addButton: {
    backgroundColor: '#2563EB', borderRadius: 20, width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },

  filterRow: { backgroundColor: '#fff', paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#fff' },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  ticketCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  ticketDescription: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketMetaText: { fontSize: 12, color: '#94A3B8' },
  ticketDate: { fontSize: 12, color: '#94A3B8' },
  costRow: { flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  costText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  detailSection: { marginBottom: 16 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  detailBadges: { flexDirection: 'row', gap: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  detailRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  detailHalf: { flex: 1 },

  actionsSection: { gap: 10, marginTop: 8, marginBottom: 16 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, gap: 6,
  },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  formSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },
  formTextArea: { minHeight: 100 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  priorityOptionText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  submitButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
