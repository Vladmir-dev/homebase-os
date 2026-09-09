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

const NAV_ITEMS = [
  { route: 'boq', label: 'Bill of Quantities', icon: 'calculator-outline' },
  { route: 'milestones', label: 'Milestones', icon: 'flag-outline' },
  { route: 'reconciliation', label: 'Material Reconciliation', icon: 'git-compare-outline' },
  { route: 'timeline', label: 'Project Timeline', icon: 'git-branch-outline' },
  { route: 'procurement', label: 'Procurement', icon: 'bag-handle-outline' },
  { route: 'site-management', label: 'Site Management', icon: 'clipboard-outline' },
];

export default function ConstructionDashboardScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [phases, setPhases] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [boqs, setBoqs] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [phaseData, msData, boqData, deliveryData, diaryData] = await Promise.all([
        api.getProjectPhases().catch(() => []),
        api.getMilestones().catch(() => []),
        api.getBOQs(undefined, assetId).catch(() => []),
        api.getMaterialDeliveries().catch(() => []),
        api.getSiteDiary().catch(() => []),
      ]);
      setPhases(Array.isArray(phaseData) ? phaseData : phaseData?.results || []);
      setMilestones(Array.isArray(msData) ? msData : msData?.results || []);
      setBoqs(Array.isArray(boqData) ? boqData : boqData?.results || []);
      setDeliveries(Array.isArray(deliveryData) ? deliveryData : deliveryData?.results || []);
      setDiaryEntries(Array.isArray(diaryData) ? diaryData : diaryData?.results || []);
    } catch (err: any) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (v: number) => `UGX ${Number(v || 0).toLocaleString()}`;

  // Computed stats
  const totalPhaseCost = phases.reduce((s: number, p: any) => s + parseFloat(p.planned_cost || 0), 0);
  const actualPhaseCost = phases.reduce((s: number, p: any) => s + parseFloat(p.actual_cost || 0), 0);
  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const totalDeliveredCost = deliveries.reduce((s: number, d: any) => s + parseFloat(d.total_cost || 0), 0);
  const activeBOQ = boqs.find((b) => b.status === 'approved');
  const boqItems = activeBOQ?.items || [];
  const totalPlannedBOQ = boqItems.reduce((s: number, i: any) => s + parseFloat(i.planned_cost || 0), 0);
  const latestDiary = diaryEntries[0];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Construction Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Stats Grid */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>PROJECT OVERVIEW</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedPhases}/{phases.length}</Text>
              <Text style={styles.statDesc}>Phases</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>{completedMilestones}/{milestones.length}</Text>
              <Text style={styles.statDesc}>Milestones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deliveries.length}</Text>
              <Text style={styles.statDesc}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{diaryEntries.length}</Text>
              <Text style={styles.statDesc}>Diary Days</Text>
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

        {/* Cost Summary */}
        <View style={styles.costCard}>
          <Text style={styles.costLabel}>COST TRACKING</Text>
          <View style={styles.costRow}>
            <View style={styles.costCol}>
              <Text style={styles.costValue}>{formatCurrency(totalPhaseCost)}</Text>
              <Text style={styles.costDesc}>Phase Planned</Text>
            </View>
            <View style={styles.costCol}>
              <Text style={[styles.costValue, { color: '#F59E0B' }]}>{formatCurrency(actualPhaseCost)}</Text>
              <Text style={styles.costDesc}>Phase Actual</Text>
            </View>
          </View>
          <View style={styles.costRow}>
            <View style={styles.costCol}>
              <Text style={styles.costValue}>{formatCurrency(totalPlannedBOQ)}</Text>
              <Text style={styles.costDesc}>BOQ Planned</Text>
            </View>
            <View style={styles.costCol}>
              <Text style={[styles.costValue, { color: '#22C55E' }]}>{formatCurrency(totalDeliveredCost)}</Text>
              <Text style={styles.costDesc}>Delivered Value</Text>
            </View>
          </View>
        </View>

        {/* Latest Diary */}
        {latestDiary && (
          <View style={styles.diaryCard}>
            <View style={styles.diaryHeader}>
              <Ionicons name="book-outline" size={16} color="#2563EB" />
              <Text style={styles.diaryTitle}>Latest Site Diary</Text>
            </View>
            <Text style={styles.diaryDate}>{latestDiary.entry_date}</Text>
            <Text style={styles.diaryNotes} numberOfLines={3}>{latestDiary.notes}</Text>
            {latestDiary.workers_count > 0 && (
              <Text style={styles.diaryMeta}>{latestDiary.workers_count} workers on site</Text>
            )}
          </View>
        )}

        {/* Quick Nav */}
        <View style={styles.navCard}>
          <Text style={styles.navTitle}>Quick Access</Text>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.navItem}
              onPress={() => router.push({
                pathname: `/property/[assetId]/${item.route}` as any,
                params: { assetId, assetName },
              })}
            >
              <View style={styles.navIcon}>
                <Ionicons name={item.icon as any} size={18} color="#2563EB" />
              </View>
              <Text style={styles.navLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
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

  statsCard: {
    backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 16,
  },
  statsLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 3 },

  costCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  costLabel: { fontSize: 11, fontWeight: '700', color: '#1E293B', letterSpacing: 0.5, marginBottom: 12 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  costCol: { width: '48%' },
  costValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  costDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  diaryCard: {
    backgroundColor: '#EFF6FF', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
  },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  diaryTitle: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  diaryDate: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  diaryNotes: { fontSize: 13, color: '#1E293B', lineHeight: 18 },
  diaryMeta: { fontSize: 11, color: '#64748B', marginTop: 6 },

  navCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  navIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
});
