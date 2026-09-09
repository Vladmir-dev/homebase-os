import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#2563EB',
  in_progress: '#0D9488',
  completed: '#22C55E',
  cancelled: '#EF4444',
  disputed: '#EF4444',
};

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchBookings = useCallback(async () => {
    try {
      const data = await api.getBookings();
      setBookings(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to load bookings:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'needs_quote') return b.status === 'pending' && !b.quotation;
    if (filter === 'active') return ['confirmed', 'in_progress'].includes(b.status);
    return b.status === filter;
  });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'needs_quote', label: 'Needs Quote' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
  ];

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
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          filtered.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => router.push(`/job/${booking.id}`)}
            >
              <View style={styles.bookingTopRow}>
                <Text style={styles.bookingId}>#{booking.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[booking.status] || '#64748B') + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] || '#64748B' }]}>
                    {booking.status?.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.bookingService}>
                {booking.service_name || booking.category_name || 'Service Booking'}
              </Text>
              <Text style={styles.bookingCustomer}>
                Customer: {booking.customer_email || 'Unknown'}
              </Text>

              <View style={styles.bookingBottomRow}>
                <Text style={styles.bookingPrice}>
                  UGX {Number(booking.price || 0).toLocaleString()}
                </Text>
                {booking.scheduled_time && (
                  <Text style={styles.bookingDate}>
                    {new Date(booking.scheduled_time).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {booking.status === 'pending' && !booking.quotation && (
                <TouchableOpacity
                  style={styles.quoteAction}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/quotation/create?bookingId=${booking.id}`);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#2563EB" />
                  <Text style={styles.quoteActionText}>Create Quotation</Text>
                </TouchableOpacity>
              )}

              {booking.quotation && (
                <View style={styles.quoteRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                  <Text style={styles.quoteRowText}>Quotation attached</Text>
                </View>
              )}

              <View style={styles.stepIndicator}>
                <Text style={styles.stepLabel}>
                  Step: {booking.current_step?.replace('_', ' ') || 'requested'}
                </Text>
              </View>
            </TouchableOpacity>
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
  filterBar: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  bookingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  bookingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingId: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingService: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  bookingCustomer: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  bookingBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingPrice: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  bookingDate: { fontSize: 12, color: '#64748B' },
  quoteAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 8,
  },
  quoteActionText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  quoteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6,
  },
  quoteRowText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 8,
    borderTopWidth: 1, borderColor: '#F1F5F9',
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
});
