import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../services/api';

interface OrderEvent {
  id: number;
  event_type: string;
  status: string;
  message: string;
  actor_email?: string | null;
  created_at: string;
}

interface OrderRecord {
  id: number;
  order_number: string;
  pillar: string;
  status: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  asset_name?: string | null;
  created_at: string;
  paid_at?: string | null;
  events: OrderEvent[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#22C55E',
  processing: '#2563EB',
  completed: '#0D9488',
  cancelled: '#EF4444',
  disputed: '#EF4444',
};

const formatMoney = (amount: string | number, currency = 'UGX') =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ order_number?: string }>();
  const initial =
    typeof params.order_number === 'string' ? params.order_number : '';

  const [query, setQuery] = useState(initial);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (raw: string) => {
    const value = raw.trim();
    if (!value) {
      setError('Enter an order number to track.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.trackOrder(value);
      setOrder(data);
    } catch (e: any) {
      setOrder(null);
      setError(e?.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial.trim()) {
      lookup(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Track Order</Text>
          <Text style={styles.subtitle}>Enter an order number to view its history</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
            placeholder="HB-GRC-261017-0001"
            style={styles.input}
            onSubmitEditing={() => lookup(query)}
          />
          <TouchableOpacity
            style={styles.squareAction}
            onPress={() => lookup(query)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {order ? (
          <View>
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text
                  style={[
                    styles.itemBadge,
                    {
                      color: STATUS_COLORS[order.status] || '#2563EB',
                      backgroundColor: '#F8FAFC',
                    },
                  ]}
                >
                  {order.status}
                </Text>
              </View>
              <Text style={styles.itemTitle}>
                {order.title || 'Order'}
              </Text>
              {order.description ? (
                <Text style={styles.itemMeta}>{order.description}</Text>
              ) : null}
              <Text style={styles.itemMeta}>
                {order.pillar} | {formatMoney(order.amount, order.currency)}
              </Text>
              {order.asset_name ? (
                <Text style={styles.itemMeta}>Asset: {order.asset_name}</Text>
              ) : null}
              <Text style={styles.itemMeta}>Placed: {formatDate(order.created_at)}</Text>
              {order.paid_at ? (
                <Text style={styles.itemMeta}>Paid: {formatDate(order.paid_at)}</Text>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>
              Timeline ({order.events?.length || 0})
            </Text>
            {(order.events || []).map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventDot}>
                  <Ionicons name="ellipse" size={10} color="#2563EB" />
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventType}>
                    {event.event_type.replace(/_/g, ' ')}
                    {event.status ? ` · ${event.status}` : ''}
                  </Text>
                  {event.message ? (
                    <Text style={styles.eventMessage}>{event.message}</Text>
                  ) : null}
                  <Text style={styles.eventMeta}>
                    {formatDate(event.created_at)}
                    {event.actor_email ? ` · ${event.actor_email}` : ''}
                  </Text>
                </View>
              </View>
            ))}
            {!order.events?.length && (
              <Text style={styles.emptyText}>No timeline events yet.</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#1E293B',
    fontWeight: '700',
  },
  squareAction: {
    width: 48,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  errorText: { color: '#EF4444', fontWeight: '700', flex: 1 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  orderNumber: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    flex: 1,
  },
  itemTitle: { color: '#1E293B', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  itemBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  itemMeta: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  sectionLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
  },
  eventRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  eventDot: { paddingTop: 3 },
  eventBody: { flex: 1 },
  eventType: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  eventMessage: { color: '#334155', fontSize: 12, marginTop: 2 },
  eventMeta: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 10,
  },
});
