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

const STATUS_COLORS: Record<string, string> = {
  under: '#F59E0B',
  on_track: '#22C55E',
  over: '#EF4444',
};

export default function ReconciliationScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [boqs, setBoqs] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [boqData, deliveryData] = await Promise.all([
        api.getBOQs(undefined, assetId).catch(() => []),
        api.request(`/construction/deliveries/?asset=${assetId}`).catch(() => []),
      ]);
      setBoqs(Array.isArray(boqData) ? boqData : boqData?.results || []);
      setDeliveries(Array.isArray(deliveryData) ? deliveryData : deliveryData?.results || []);
    } catch (err: any) {
      console.warn('Reconciliation load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (v: number) => `UGX ${Number(v || 0).toLocaleString()}`;
  const statusBarWidth = Dimensions.get('window').width - 64;

  // Build reconciliation rows from BOQ items
  const activeBOQ = boqs.find((b) => b.status === 'approved') || boqs[0];
  const boqItems = activeBOQ?.items || [];

  const rows = boqItems.map((item: any) => {
    const matchingDeliveries = deliveries.filter(
      (d) => d.item?.toLowerCase().includes(item.material_name?.toLowerCase())
    );
    const totalDelivered = matchingDeliveries.reduce(
      (sum: number, d: any) => sum + parseFloat(d.quantity || 0), 0
    );
    const totalCost = matchingDeliveries.reduce(
      (sum: number, d: any) => sum + parseFloat(d.total_cost || 0), 0
    );
    const used = parseFloat(item.used_qty || 0);
    const planned = parseFloat(item.planned_qty || 0);
    const remaining = totalDelivered - used;
    const pct = planned > 0 ? (totalDelivered / planned) * 100 : 0;
    const variance = totalDelivered - planned;

    let status = 'on_track';
    if (pct < 80) status = 'under';
    else if (pct > 105) status = 'over';

    return {
      ...item,
      totalDelivered,
      totalCost,
      used,
      remaining,
      pct: Math.min(pct, 100),
      variance,
      status,
      deliveryCount: matchingDeliveries.length,
    };
  });

  // Summary stats
  const totalPlannedCost = rows.reduce((s: number, r: any) => s + parseFloat(r.planned_cost || 0), 0);
  const totalDeliveredCost = rows.reduce((s: number, r: any) => s + r.totalCost, 0);
  const totalVariance = rows.reduce((s: number, r: any) => s + Math.abs(r.variance), 0);
  const itemsOnTrack = rows.filter((r) => r.status === 'on_track').length;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Reconciliation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>RECONCILIATION OVERVIEW</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalPlannedCost)}</Text>
              <Text style={styles.summaryDesc}>Planned Cost</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{formatCurrency(totalDeliveredCost)}</Text>
              <Text style={styles.summaryDesc}>Delivered Cost</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatCurrency(totalVariance)}</Text>
              <Text style={styles.summaryDesc}>Total Variance</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{itemsOnTrack}/{rows.length}</Text>
              <Text style={styles.summaryDesc}>On Track</Text>
            </View>
          </View>
        </View>

        {/* Reconciliation Table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Planned → Delivered → Used → Remaining</Text>

          {rows.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeBOQ ? 'No BOQ items found. Add items in the BOQ editor.' : 'No approved BOQ. Create and approve a BOQ first.'}
            </Text>
          ) : (
            rows.map((row: any) => (
              <View key={row.id} style={styles.rowCard}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowName}>{row.material_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[row.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[row.status] }]}>
                      {row.status === 'on_track' ? 'On Track' : row.status === 'under' ? 'Under' : 'Over'}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Planned</Text>
                    <Text style={styles.statValue}>{row.planned_qty} {row.unit}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Delivered</Text>
                    <Text style={[styles.statValue, row.variance > 0 && { color: '#EF4444' }]}>
                      {row.totalDelivered} {row.unit}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Used</Text>
                    <Text style={styles.statValue}>{row.used} {row.unit}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#CBD5E1" />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Remaining</Text>
                    <Text style={[styles.statValue, row.remaining < 0 && { color: '#EF4444' }]}>
                      {row.remaining} {row.unit}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {
                    width: `${Math.min((row.totalDelivered / row.planned_qty) * 100, 100)}%`,
                    backgroundColor: STATUS_COLORS[row.status],
                  }]} />
                </View>

                <View style={styles.rowFooter}>
                  <Text style={styles.rowFooterText}>
                    {Math.round((row.totalDelivered / row.planned_qty) * 100)}% delivered
                  </Text>
                  <Text style={styles.rowFooterText}>
                    {row.deliveryCount} deliveries · {formatCurrency(row.totalCost)}
                  </Text>
                </View>
              </View>
            ))
          )}
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

  summaryCard: {
    backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 16,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '47%' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  summaryDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

  rowCard: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  rowStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 4 },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 1 },

  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },

  rowFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  rowFooterText: { fontSize: 10, color: '#94A3B8' },

  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 24 },
});
