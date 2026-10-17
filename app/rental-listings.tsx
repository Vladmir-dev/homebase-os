import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../services/api';

interface RentalListing {
  id: number;
  name: string;
  location: string;
  gps_coordinates?: string;
  description?: string;
  rent_amount: string;
  currency: string;
  deposit_amount: string;
  rental_status: string;
  landlord_name?: string | null;
  landlord_email?: string | null;
  landlord_phone?: string | null;
  is_mine: boolean;
  created_at: string;
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

const STATUS_COLORS: Record<string, string> = {
  vacant: '#22C55E',
  occupied: '#2563EB',
  maintenance: '#F59E0B',
};

const formatMoney = (amount: string | number, currency = 'UGX') =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

export default function RentalListingsScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<RentalListing | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      const data = await api.getRentalListings({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(query.trim() ? { q: query.trim() } : {}),
      });
      setListings(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to load rental listings:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, query]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const contactLandlord = (listing: RentalListing) => {
    if (listing.landlord_phone) {
      Linking.openURL(`tel:${listing.landlord_phone}`).catch(() =>
        Alert.alert('Contact', listing.landlord_phone || ''),
      );
    } else if (listing.landlord_email) {
      Linking.openURL(`mailto:${listing.landlord_email}`).catch(() =>
        Alert.alert('Contact', listing.landlord_email || ''),
      );
    } else {
      Alert.alert('Contact', 'No contact details on file.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Rental Listings</Text>
          <Text style={styles.subtitle}>Browse available rental units</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, location..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map((f) => {
          const active = f.value === statusFilter;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
        >
          {listings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No rental listings found</Text>
            </View>
          ) : (
            listings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={styles.card}
                onPress={() => setSelected(listing)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {listing.name}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      { color: STATUS_COLORS[listing.rental_status] || '#2563EB' },
                    ]}
                  >
                    {listing.rental_status}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.metaText}>{listing.location}</Text>
                </View>
                <Text style={styles.rent}>
                  {formatMoney(listing.rent_amount, listing.currency)}
                  <Text style={styles.rentUnit}> / month</Text>
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text style={styles.metaText}>
                    {listing.landlord_name || 'Landlord'}
                  </Text>
                </View>
                {listing.is_mine ? (
                  <Text style={styles.mineTag}>Your listing</Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selected?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.rent}>
              {selected && formatMoney(selected.rent_amount, selected.currency)}
              <Text style={styles.rentUnit}> / month</Text>
            </Text>
            {selected?.deposit_amount && Number(selected.deposit_amount) > 0 ? (
              <Text style={styles.metaText}>
                Deposit: {formatMoney(selected.deposit_amount, selected.currency)}
              </Text>
            ) : null}

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.detailValue}>{selected?.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#64748B" />
              <Text style={styles.detailValue}>
                {selected?.landlord_name || 'Landlord'}
              </Text>
            </View>
            {selected?.landlord_phone ? (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#64748B" />
                <Text style={styles.detailValue}>{selected.landlord_phone}</Text>
              </View>
            ) : null}
            {selected?.description ? (
              <Text style={styles.description}>{selected.description}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => selected && contactLandlord(selected)}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>Contact Landlord</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: { flex: 1, color: '#1E293B', fontWeight: '600', paddingVertical: 10 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 6 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  cardTitle: { color: '#1E293B', fontSize: 16, fontWeight: '800', flex: 1 },
  badge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  rent: { color: '#2563EB', fontSize: 18, fontWeight: '800', marginTop: 6 },
  rentUnit: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  mineTag: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: { color: '#1E293B', fontSize: 20, fontWeight: '800', flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  detailValue: { color: '#334155', fontSize: 14, fontWeight: '600' },
  description: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 12 },
  contactButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  contactButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
