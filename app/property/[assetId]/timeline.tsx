import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../../services/api';

const PHASE_COLORS: Record<string, string> = {
  pre_construction: '#94A3B8', foundation: '#2563EB', superstructure: '#0D9488',
  roofing: '#F59E0B', finishing: '#8B5CF6', landscaping: '#22C55E', completed: '#1E293B',
};

const STATUS_DOT: Record<string, string> = {
  pending: '#CBD5E1', in_progress: '#2563EB', completed: '#22C55E',
  on_hold: '#F59E0B', review: '#8B5CF6',
};

export default function TimelineScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [phases, setPhases] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [phaseData, msData] = await Promise.all([
        api.request('/construction/phases/').catch(() => []),
        api.getMilestones().catch(() => []),
      ]);
      setPhases(Array.isArray(phaseData) ? phaseData : phaseData?.results || []);
      setMilestones(Array.isArray(msData) ? msData : msData?.results || []);
    } catch (err: any) {
      console.warn('Timeline load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const screenWidth = Dimensions.get('window').width;

  // Compute timeline range
  const allDates = [
    ...phases.flatMap((p: any) => [p.start_date, p.end_date].filter(Boolean)),
    ...milestones.flatMap((m: any) => [m.target_date, m.completed_date].filter(Boolean)),
  ].filter(Boolean).sort();

  if (allDates.length === 0) allDates.push(new Date().toISOString().split('T')[0]);

  const minDate = new Date(allDates[0]);
  const maxDate = new Date(allDates[allDates.length - 1]);
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24), 30);

  const getDatePosition = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, (days / totalDays) * (screenWidth - 80));
  };

  const getBarWidth = (start: string, end: string) => {
    return Math.max(getDatePosition(end) - getDatePosition(start), 20);
  };

  // Month markers
  const months: { label: string; x: number }[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    months.push({
      label: cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
      x: getDatePosition(cursor.toISOString().split('T')[0]),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const completedPhases = phases.filter((p: any) => p.status === 'completed').length;
  const completedMilestones = milestones.filter((m: any) => m.status === 'completed').length;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Timeline</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>PROJECT PROGRESS</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{completedPhases}/{phases.length}</Text>
              <Text style={styles.overviewDesc}>Phases</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewValue, { color: '#22C55E' }]}>{completedMilestones}/{milestones.length}</Text>
              <Text style={styles.overviewDesc}>Milestones</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {allDates[0]?.slice(0, 7) || '—'}
              </Text>
              <Text style={styles.overviewDesc}>Start</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {allDates[allDates.length - 1]?.slice(0, 7) || '—'}
              </Text>
              <Text style={styles.overviewDesc}>End</Text>
            </View>
          </View>
          {phases.length > 0 && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${(completedPhases / phases.length) * 100}%`,
              }]} />
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          {/* Month markers */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timelineContent}>
              <View style={styles.monthRow}>
                {months.map((m, i) => (
                  <Text key={i} style={[styles.monthLabel, { left: m.x + 120 }]}>{m.label}</Text>
                ))}
              </View>

              {/* Phases */}
              <Text style={styles.groupTitle}>Phases</Text>
              {phases.map((phase: any) => {
                if (!phase.start_date || !phase.end_date) return null;
                const x = getDatePosition(phase.start_date);
                const w = getBarWidth(phase.start_date, phase.end_date);
                const color = PHASE_COLORS[phase.phase_type] || '#2563EB';
                return (
                  <View key={phase.id} style={styles.timelineRow}>
                    <Text style={styles.rowLabel} numberOfLines={1}>{phase.name}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, {
                        left: x, width: w, backgroundColor: color,
                        opacity: phase.status === 'completed' ? 0.5 : 1,
                      }]}>
                        <Text style={styles.barText} numberOfLines={1}>
                          {phase.status === 'completed' ? '✓' : phase.status.replace('_', ' ')}
                        </Text>
                      </View>
                      <View style={[styles.statusDot, { left: x + w + 4, backgroundColor: STATUS_DOT[phase.status] }]} />
                    </View>
                  </View>
                );
              })}

              {/* Milestones */}
              <Text style={[styles.groupTitle, { marginTop: 16 }]}>Milestones</Text>
              {milestones.map((ms: any) => {
                const date = ms.completed_date || ms.target_date;
                if (!date) return null;
                const x = getDatePosition(date);
                const color = STATUS_DOT[ms.status] || '#CBD5E1';
                return (
                  <View key={ms.id} style={styles.timelineRow}>
                    <Text style={styles.rowLabel} numberOfLines={1}>{ms.title}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.milestoneMarker, { left: x, backgroundColor: color }]}>
                        <Ionicons
                          name={ms.status === 'completed' ? 'checkmark' : 'flag'}
                          size={10}
                          color="#fff"
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {phases.length === 0 && milestones.length === 0 && (
                <Text style={styles.emptyText}>No timeline data. Create phases and milestones first.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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

  overviewCard: {
    backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 16,
  },
  overviewLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  overviewItem: { alignItems: 'center' },
  overviewValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  overviewDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 3 },

  timelineCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  timelineContent: { minWidth: Dimensions.get('window').width - 32 },

  monthRow: { height: 20, marginBottom: 4 },
  monthLabel: { position: 'absolute', fontSize: 10, fontWeight: '600', color: '#94A3B8' },

  groupTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 4 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, height: 28 },
  rowLabel: { width: 100, fontSize: 11, fontWeight: '600', color: '#64748B', marginRight: 8 },
  barContainer: { flex: 1, height: 24, position: 'relative' },

  bar: {
    position: 'absolute', height: 20, top: 2, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    minWidth: 30,
  },
  barText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },

  statusDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 8 },

  milestoneMarker: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', top: 2,
  },

  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 24 },
});
