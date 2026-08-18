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

const PROCUREMENT_STATUS = [
  { value: 'needed', label: 'Needed', color: '#EF4444', icon: 'alert-circle-outline' },
  { value: 'quoted', label: 'Quoted', color: '#F59E0B', icon: 'document-text-outline' },
  { value: 'ordered', label: 'Ordered', color: '#2563EB', icon: 'cart-outline' },
  { value: 'delivered', label: 'Delivered', color: '#22C55E', icon: 'checkmark-circle-outline' },
];

export default function ProcurementScreen() {
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [boqs, setBoqs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [linkNotes, setLinkNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [boqData, supplierData] = await Promise.all([
        api.getBOQs(undefined, assetId).catch(() => []),
        api.getSuppliers().catch(() => []),
      ]);
      setBoqs(Array.isArray(boqData) ? boqData : boqData?.results || []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : supplierData?.results || []);
    } catch (err: any) {
      console.warn('Procurement load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const activeBOQ = boqs.find((b) => b.status === 'approved') || boqs[0];
  const items = activeBOQ?.items || [];

  // Map items to procurement status (from delivered_qty vs planned_qty)
  const procurementItems = items.map((item: any) => {
    const delivered = parseFloat(item.delivered_qty || 0);
    const planned = parseFloat(item.planned_qty || 0);
    let procStatus = 'needed';
    if (delivered >= planned) procStatus = 'delivered';
    else if (delivered > 0) procStatus = 'ordered';
    return { ...item, procStatus };
  });

  const filteredItems = filterStatus
    ? procurementItems.filter((i) => i.procStatus === filterStatus)
    : procurementItems;

  const counts = PROCUREMENT_STATUS.map((s) => ({
    ...s,
    count: procurementItems.filter((i) => i.procStatus === s.value).length,
  }));

  const formatCurrency = (v: number) => `UGX ${Number(v || 0).toLocaleString()}`;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Procurement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === null && styles.filterChipActive]}
            onPress={() => setFilterStatus(null)}
          >
            <Text style={[styles.filterText, filterStatus === null && { color: '#fff' }]}>
              All ({procurementItems.length})
            </Text>
          </TouchableOpacity>
          {counts.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.filterChip, filterStatus === c.value && { backgroundColor: c.color }]}
              onPress={() => setFilterStatus(filterStatus === c.value ? null : c.value)}
            >
              <Ionicons name={c.icon as any} size={14} color={filterStatus === c.value ? '#fff' : c.color} />
              <Text style={[styles.filterText, filterStatus === c.value && { color: '#fff' }]}>
                {c.label} ({c.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items */}
        <View style={styles.sectionCard}>
          {filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeBOQ ? 'No items match this filter.' : 'No BOQ found. Create one first.'}
            </Text>
          ) : (
            filteredItems.map((item: any) => {
              const statusInfo = PROCUREMENT_STATUS.find((s) => s.value === item.procStatus) || PROCUREMENT_STATUS[0];
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.material_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                      <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.color} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    {item.planned_qty} {item.unit} needed · {formatCurrency(item.planned_cost)}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Delivered: {item.delivered_qty} {item.unit} · Remaining: {item.remaining_qty} {item.unit}
                  </Text>
                  {item.procStatus !== 'delivered' && (
                    <TouchableOpacity
                      style={styles.linkBtn}
                      onPress={() => { setSelectedItem(item); setLinkModalVisible(true); }}
                    >
                      <Ionicons name="link-outline" size={14} color="#2563EB" />
                      <Text style={styles.linkBtnText}>Assign Supplier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Suppliers */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Available Suppliers ({suppliers.length})</Text>
          {suppliers.length === 0 ? (
            <Text style={styles.emptyText}>No suppliers added yet.</Text>
          ) : (
            suppliers.map((s: any) => (
              <View key={s.id} style={styles.supplierCard}>
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{s.business_name || s.name}</Text>
                  <Text style={styles.supplierMeta}>{s.specialty || s.category || 'General'} · {s.location || ''}</Text>
                </View>
                <View style={[styles.ratingBadge]}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{s.rating || '—'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Link Supplier Modal */}
      <Modal visible={linkModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Supplier</Text>
              <TouchableOpacity onPress={() => setLinkModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {selectedItem && (
              <Text style={styles.modalSubtitle}>
                {selectedItem.material_name} — {selectedItem.planned_qty} {selectedItem.unit}
              </Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {suppliers.map((s: any) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.supplierOption, selectedSupplier === s.id && styles.supplierOptionActive]}
                  onPress={() => setSelectedSupplier(s.id)}
                >
                  <Text style={styles.supplierOptionName}>{s.business_name || s.name}</Text>
                  <Text style={styles.supplierOptionMeta}>{s.specialty || s.category || 'General'}</Text>
                  {selectedSupplier === s.id && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                </TouchableOpacity>
              ))}
              {suppliers.length === 0 && (
                <Text style={styles.emptyText}>No suppliers available. Add suppliers first.</Text>
              )}
            </ScrollView>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput style={styles.formInput} value={linkNotes} onChangeText={setLinkNotes} placeholder="Optional notes" placeholderTextColor="#94A3B8" />
            </View>
            <TouchableOpacity
              style={[styles.submitButton, !selectedSupplier && { opacity: 0.5 }]}
              onPress={() => {
                Alert.alert('Linked', `Supplier assigned to ${selectedItem?.material_name}.`);
                setLinkModalVisible(false);
                setSelectedSupplier(null);
                setLinkNotes('');
              }}
              disabled={!selectedSupplier}
            >
              <Text style={styles.submitButtonText}>Assign Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
