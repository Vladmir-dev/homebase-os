import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../../services/api';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#64748B' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
];

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  pending: { icon: 'ellipse-outline', color: '#94A3B8' },
  in_progress: { icon: 'time-outline', color: '#2563EB' },
  completed: { icon: 'checkmark-circle', color: '#22C55E' },
  skipped: { icon: 'ban-outline', color: '#64748B' },
};

export default function MilestonesScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [milestones, setMilestones] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [createVisible, setCreateVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPhase, setNewPhase] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [phaseData, msData] = await Promise.all([
        api.request('/construction/phases/').catch(() => []),
        api.getMilestones(selectedPhase ? String(selectedPhase) : undefined).catch(() => []),
      ]);
      setPhases(Array.isArray(phaseData) ? phaseData : phaseData?.results || []);
      setMilestones(Array.isArray(msData) ? msData : msData?.results || []);
    } catch (err: any) {
      console.warn('Milestones load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPhase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newPhase) {
      Alert.alert('Required', 'Enter a title and select a phase.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createMilestone({
        phase: newPhase,
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        target_date: newTargetDate || undefined,
        estimated_cost: newCost ? parseFloat(newCost) : undefined,
      });
      setCreateVisible(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (ms: any, action: 'start' | 'complete' | 'skip') => {
    const labels = { start: 'Start', complete: 'Complete', skip: 'Skip' };
    Alert.alert(`${labels[action]} Milestone`, `Mark "${ms.title}" as ${action}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: labels[action],
        onPress: async () => {
          try {
            if (action === 'start') await api.startMilestone(ms.id);
            else if (action === 'complete') await api.completeMilestone(ms.id);
            else await api.skipMilestone(ms.id);
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message || `Failed to ${action}.`);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setNewTitle(''); setNewDesc(''); setNewPriority('medium');
    setNewTargetDate(''); setNewCost('');
  };

  const formatCurrency = (v: number) => `UGX ${Number(v || 0).toLocaleString()}`;

  const grouped = {
    pending: milestones.filter((m) => m.status === 'pending'),
    in_progress: milestones.filter((m) => m.status === 'in_progress'),
    completed: milestones.filter((m) => m.status === 'completed'),
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Milestones</Text>
        <TouchableOpacity onPress={() => setCreateVisible(true)}>
          <Ionicons name="add-circle" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Phase Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPhase === null && styles.filterChipActive]}
            onPress={() => setSelectedPhase(null)}
          >
            <Text style={[styles.filterText, selectedPhase === null && { color: '#fff' }]}>All Phases</Text>
          </TouchableOpacity>
          {phases.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.filterChip, selectedPhase === p.id && styles.filterChipActive]}
              onPress={() => setSelectedPhase(p.id)}
            >
              <Text style={[styles.filterText, selectedPhase === p.id && { color: '#fff' }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressCol}>
              <Text style={[styles.progressNum, { color: '#94A3B8' }]}>{grouped.pending.length}</Text>
              <Text style={styles.progressLabel}>Pending</Text>
            </View>
            <View style={styles.progressCol}>
              <Text style={[styles.progressNum, { color: '#2563EB' }]}>{grouped.in_progress.length}</Text>
              <Text style={styles.progressLabel}>In Progress</Text>
            </View>
            <View style={styles.progressCol}>
              <Text style={[styles.progressNum, { color: '#22C55E' }]}>{grouped.completed.length}</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressCol}>
              <Text style={[styles.progressNum, { color: '#1E293B' }]}>{milestones.length}</Text>
              <Text style={styles.progressLabel}>Total</Text>
            </View>
          </View>
          {milestones.length > 0 && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${(grouped.completed.length / milestones.length) * 100}%`,
                backgroundColor: '#22C55E',
              }]} />
            </View>
          )}
        </View>

        {/* Milestone Sections */}
        {(['in_progress', 'pending', 'completed'] as const).map((status) => {
          const list = grouped[status];
          if (list.length === 0) return null;
          const info = STATUS_ICONS[status];
          const sectionLabel = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
          return (
            <View key={status} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name={info.icon as any} size={18} color={info.color} />
                <Text style={[styles.sectionTitle, { color: info.color }]}>{sectionLabel} ({list.length})</Text>
              </View>
              {list.map((ms: any) => {
                const priInfo = PRIORITY_OPTIONS.find((p) => p.value === ms.priority) || PRIORITY_OPTIONS[1];
                return (
                  <View key={ms.id} style={styles.msCard}>
                    <View style={styles.msHeader}>
                      <View style={styles.msTitleRow}>
                        <Ionicons name={STATUS_ICONS[ms.status]?.icon as any} size={18} color={STATUS_ICONS[ms.status]?.color} />
                        <Text style={styles.msTitle}>{ms.title}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: priInfo.color + '20' }]}>
                        <Text style={[styles.priorityText, { color: priInfo.color }]}>{ms.priority}</Text>
                      </View>
                    </View>
                    {ms.description ? <Text style={styles.msDesc}>{ms.description}</Text> : null}
                    <View style={styles.msMeta}>
                      {ms.phase_name && <Text style={styles.msMetaText}>Phase: {ms.phase_name}</Text>}
                      {ms.target_date && <Text style={styles.msMetaText}>Due: {ms.target_date}</Text>}
                      {ms.days_remaining !== null && ms.days_remaining !== undefined && (
                        <Text style={[styles.msMetaText, ms.days_remaining < 0 && { color: '#EF4444' }]}>
                          {ms.days_remaining < 0 ? `${Math.abs(ms.days_remaining)}d overdue` : `${ms.days_remaining}d left`}
                        </Text>
                      )}
                      {ms.estimated_cost > 0 && <Text style={styles.msMetaText}>Est: {formatCurrency(ms.estimated_cost)}</Text>}
                    </View>
                    {ms.status !== 'completed' && ms.status !== 'skipped' && (
                      <View style={styles.msActions}>
                        {ms.status === 'pending' && (
                          <TouchableOpacity style={styles.msActionBtn} onPress={() => handleAction(ms, 'start')}>
                            <Text style={[styles.msActionText, { color: '#2563EB' }]}>Start</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.msActionBtn} onPress={() => handleAction(ms, 'complete')}>
                          <Text style={[styles.msActionText, { color: '#22C55E' }]}>Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.msActionBtn} onPress={() => handleAction(ms, 'skip')}>
                          <Text style={[styles.msActionText, { color: '#64748B' }]}>Skip</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {milestones.length === 0 && (
          <Text style={styles.emptyText}>No milestones yet. Tap + to create one.</Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Milestone</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Phase *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {phases.map((p: any) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.phaseChip, newPhase === p.id && styles.phaseChipActive]}
                      onPress={() => setNewPhase(p.id)}
                    >
                      <Text style={[styles.phaseChipText, newPhase === p.id && { color: '#fff' }]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.formInput} value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Foundation inspection" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]} value={newDesc} onChangeText={setNewDesc} placeholder="Optional description" placeholderTextColor="#94A3B8" multiline />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.chipRow}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      style={[styles.chip, newPriority === p.value && { backgroundColor: p.color, borderColor: p.color }]}
                      onPress={() => setNewPriority(p.value)}
                    >
                      <Text style={[styles.chipText, newPriority === p.value && { color: '#fff' }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Target Date</Text>
                  <TextInput style={styles.formInput} value={newTargetDate} onChangeText={setNewTargetDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
                </View>
                <View style={[styles.formSection, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Est. Cost (UGX)</Text>
                  <TextInput style={styles.formInput} value={newCost} onChangeText={setNewCost} placeholder="e.g. 500000" placeholderTextColor="#94A3B8" keyboardType="numeric" />
                </View>
              </View>
              <TouchableOpacity style={[styles.submitButton, actionLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Create Milestone</Text>}
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

  filterRow: { paddingVertical: 8, paddingHorizontal: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginHorizontal: 4, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  progressCard: {
    backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 16,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressCol: { alignItems: 'center' },
  progressNum: { fontSize: 20, fontWeight: '800' },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  progressTrack: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },

  msCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  msHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  msTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  msDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  msMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  msMetaText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  msActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  msActionBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  msActionText: { fontSize: 12, fontWeight: '700' },

  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 32 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  formSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },
  formRow: { flexDirection: 'row' },

  phaseChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 8 },
  phaseChipActive: { backgroundColor: '#2563EB' },
  phaseChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  submitButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
