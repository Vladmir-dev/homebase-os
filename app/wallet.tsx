import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../services/api';

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletData, txData] = await Promise.all([
        api.getMyWallet(),
        api.getMyWallet().then((w: any) =>
          w?.id ? api.getWalletTransactions(w.id) : []
        ),
      ]);
      setWallet(walletData);
      setTransactions(Array.isArray(txData) ? txData : txData?.results || []);
    } catch (err: any) {
      console.warn('Wallet load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            UGX {Number(wallet?.total_balance || 0).toLocaleString()}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Available</Text>
              <Text style={styles.balanceItemValue}>
                UGX {Number(wallet?.available_balance || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Protected (Escrow)</Text>
              <Text style={styles.balanceItemValueProtected}>
                UGX {Number(wallet?.protected_balance || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons
                  name={
                    tx.type === 'top_up' ? 'add-circle-outline'
                    : tx.type === 'withdraw' ? 'remove-circle-outline'
                    : tx.type === 'escrow_hold' ? 'lock-closed-outline'
                    : tx.type === 'escrow_release' ? 'lock-open-outline'
                    : 'swap-horizontal-outline'
                  }
                  size={20}
                  color={
                    tx.type === 'escrow_hold' ? '#F59E0B'
                    : tx.type === 'escrow_release' ? '#22C55E'
                    : '#2563EB'
                  }
                />
              </View>
              <View style={styles.txContent}>
                <Text style={styles.txDesc}>{tx.description || tx.type.replace('_', ' ')}</Text>
                <Text style={styles.txTime}>
                  {new Date(tx.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.txAmount}>
                <Text
                  style={[
                    styles.txAmountText,
                    { color: tx.type === 'escrow_hold' ? '#F59E0B' : '#22C55E' },
                  ]}
                >
                  {tx.type === 'escrow_hold' ? '-' : '+'} UGX {Number(tx.amount).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  balanceCard: {
    margin: 16, backgroundColor: '#1E293B', borderRadius: 20, padding: 24,
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 20 },
  balanceRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#334155', paddingTop: 16 },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  balanceItemValue: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  balanceItemValueProtected: { fontSize: 16, fontWeight: '700', color: '#F59E0B' },
  balanceDivider: { width: 1, backgroundColor: '#334155', marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginHorizontal: 16, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 8,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  txContent: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  txTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  txAmount: { alignItems: 'flex-end' },
  txAmountText: { fontSize: 14, fontWeight: '700' },
});
