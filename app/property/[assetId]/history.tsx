import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { api } from '../../../services/api';

const EVENT_ICONS: Record<string, { name: string; color: string }> = {
  job: { name: 'briefcase-outline', color: '#2563EB' },
  maintenance: { name: 'construct-outline', color: '#F59E0B' },
  payment: { name: 'wallet-outline', color: '#22C55E' },
  evidence: { name: 'camera-outline', color: '#0D9488' },
  milestone: { name: 'flag-outline', color: '#8B5CF6' },
  lease: { name: 'document-text-outline', color: '#EC4899' },
  delivery: { name: 'car-outline', color: '#06B6D4' },
  document: { name: 'paperclip-outline', color: '#64748B' },
  other: { name: 'ellipse-outline', color: '#94A3B8' },
};

export default function PropertyHistoryScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{
    assetId: string;
    assetName: string;
  }>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getPropertyEvents(assetId);
      setEvents(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      console.warn('Failed to load property events:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-UG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Property History</Text>
          {assetName && <Text style={styles.headerSubtitle}>{assetName}</Text>}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Events for this property will appear here as they happen.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {events.map((event, index) => {
              const icon = EVENT_ICONS[event.event_type] || EVENT_ICONS.other;
              const isLast = index === events.length - 1;
              return (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: icon.color + '18' }]}>
                      <Ionicons
                        name={icon.name as any}
                        size={16}
                        color={icon.color}
                      />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={[styles.typeBadge, { backgroundColor: icon.color + '18' }]}>
                        <Text style={[styles.typeText, { color: icon.color }]}>
                          {event.event_type}
                        </Text>
                      </View>
                    </View>
                    {event.description ? (
                      <Text style={styles.timelineDescription} numberOfLines={3}>
                        {event.description}
                      </Text>
                    ) : null}
                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineDate}>
                        {formatDate(event.timestamp)} · {formatTime(event.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },

  timeline: { padding: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 40, alignItems: 'center' },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  timelineDescription: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 6 },
  timelineMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineDate: { fontSize: 11, color: '#94A3B8' },
});
