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
} from 'react-native';

import { api } from '../services/api';

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await api.getSuppliers(searchQuery ? { q: searchQuery } : undefined);
      setSuppliers(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to load suppliers:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
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
        <Text style={styles.headerTitle}>Suppliers</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search suppliers by name, location..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {suppliers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No suppliers found</Text>
          </View>
        ) : (
          suppliers.map((s) => (
            <View key={s.id} style={styles.supplierCard}>
              <View style={styles.supplierTopRow}>
                <View style={styles.supplierAvatar}>
                  <Text style={styles.supplierInitials}>
                    {s.business_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.supplierName}>{s.business_name}</Text>
                    {s.is_verified && (
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    )}
                  </View>
                  <Text style={styles.supplierLocation}>{s.location || 'Location not set'}</Text>
                </View>
              </View>

              {s.description ? (
                <Text style={styles.supplierDesc} numberOfLines={2}>{s.description}</Text>
              ) : null}

              <View style={styles.supplierStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.statText}>{Number(s.rating || 0).toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="briefcase-outline" size={14} color="#64748B" />
                  <Text style={styles.statText}>{s.total_orders || 0} orders</Text>
                </View>
                {s.phone_number ? (
                  <View style={styles.statItem}>
                    <Ionicons name="call-outline" size={14} color="#64748B" />
                    <Text style={styles.statText}>{s.phone_number}</Text>
                  </View>
                ) : null}
              </View>

              {s.categories_detail?.length > 0 && (
                <View style={styles.categoryRow}>
                  {s.categories_detail.map((cat: any) => (
                    <View key={cat.id} style={styles.categoryChip}>
                      <Text style={styles.categoryText}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              )}
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
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  supplierCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  supplierTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  supplierAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB20',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  supplierInitials: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supplierName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  supplierLocation: { fontSize: 13, color: '#64748B', marginTop: 2 },
  supplierDesc: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 10 },
  supplierStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
});
