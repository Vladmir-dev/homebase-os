import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const UNIT_OPTIONS = [
  'kg', 'tonnes', 'm', 'm2', 'm3', 'litres',
  'pcs', 'bags', 'rolls', 'bundles', 'sheets',
  'blocks', 'bricks', 'units', 'sets', 'load', 'trip',
];

const CATEGORY_OPTIONS = [
  'structural', 'finishing', 'electrical', 'plumbing',
  'roofing', 'flooring', 'painting', 'landscaping', 'other',
];

export default function BOQScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [boqs, setBoqs] = useState<any[]>([]);
  const [selectedBOQ, setSelectedBOQ] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [createBOQVisible, setCreateBOQVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [editItemVisible, setEditItemVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newBOQTitle, setNewBOQTitle] = useState('Bill of Quantities');
  const [newBOQPhase, setNewBOQPhase] = useState('');
  const [phaseDropdownVisible, setPhaseDropdownVisible] = useState(false);
  const [phases, setPhases] = useState<any[]>([]);

  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('structural');

  const fetchData = useCallback(async () => {
    try {
      const [boqData, phaseData] = await Promise.all([
        api.getBOQs(undefined, assetId).catch(() => []),
        api.getProjectPhases().catch(() => []),
      ]);
      const boqList = Array.isArray(boqData) ? boqData : boqData?.results || [];
      setBoqs(boqList);
      setPhases(Array.isArray(phaseData) ? phaseData : phaseData?.results || []);
      if (boqList.length > 0 && !selectedBOQ) {
        setSelectedBOQ(boqList[0]);
      }
    } catch (err: any) {
      console.warn('BOQ load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  const fetchItems = useCallback(async () => {
    if (!selectedBOQ) return;
    try {
      const data = await api.getBOQItems(selectedBOQ.id);
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      console.warn('BOQ items load error:', err.message);
    }
  }, [selectedBOQ]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const selectedPhase = phases.find((p: any) => String(p.id) === newBOQPhase);

  const handleCreateBOQ = async () => {
    if (!newBOQPhase) {
      Alert.alert('Required', 'Please select a phase.');
      return;
    }
    setActionLoading(true);
    try {
      const boq = await api.createBOQ({
        phase: parseInt(newBOQPhase),
        asset: parseInt(assetId!),
        title: newBOQTitle,
      });
      setCreateBOQVisible(false);
      setNewBOQTitle('Bill of Quantities');
      setNewBOQPhase('');
      await fetchData();
      setSelectedBOQ(boq);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create BOQ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemQty || !itemPrice) {
      Alert.alert('Required', 'Please fill in material name, quantity, and price.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createBOQItem({
        boq: selectedBOQ.id,
        material_name: itemName.trim(),
        description: itemDesc.trim(),
        unit: itemUnit,
        planned_qty: parseFloat(itemQty),
        unit_price: parseFloat(itemPrice),
        category: itemCategory,
        sort_order: items.length,
      });
      setAddItemVisible(false);
      resetItemForm();
      await fetchItems();
      await fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    setActionLoading(true);
    try {
      await api.updateBOQItem(editingItem.id, {
        material_name: itemName.trim(),
        description: itemDesc.trim(),
        unit: itemUnit,
        planned_qty: parseFloat(itemQty),
        unit_price: parseFloat(itemPrice),
        category: itemCategory,
      });
      setEditItemVisible(false);
      resetItemForm();
      await fetchItems();
      await fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = (item: any) => {
    Alert.alert('Delete Item', `Remove "${item.material_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.deleteBOQItem(item.id);
          fetchItems();
          fetchData();
        },
      },
    ]);
  };

  const handleApprove = async () => {
    Alert.alert('Approve BOQ', 'Mark this BOQ as approved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          await api.approveBOQ(selectedBOQ.id);
          fetchData();
        },
      },
    ]);
  };

  const handleRecalculate = async () => {
    setActionLoading(true);
    try {
      await api.recalculateBOQ(selectedBOQ.id);
      await fetchItems();
      await fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Recalculation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetItemForm = () => {
    setItemName(''); setItemDesc(''); setItemUnit('pcs');
    setItemQty(''); setItemPrice(''); setItemCategory('structural');
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemName(item.material_name);
    setItemDesc(item.description || '');
    setItemUnit(item.unit);
    setItemQty(String(item.planned_qty));
    setItemPrice(String(item.unit_price));
    setItemCategory(item.category || 'structural');
    setEditItemVisible(true);
  };

  const formatCurrency = (v: number) => `UGX ${Number(v || 0).toLocaleString()}`;

  const totalPlanned = items.reduce((s: number, i: any) => s + parseFloat(i.planned_cost || 0), 0);
  const totalDelivered = items.reduce((s: number, i: any) => s + parseFloat(i.delivered_qty || 0) * parseFloat(i.unit_price || 0), 0);

  const statusBarWidth = Dimensions.get('window').width - 48;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill of Quantities</Text>
        <TouchableOpacity onPress={() => setCreateBOQVisible(true)}>
          <Ionicons name="add-circle" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* BOQ Summary Card */}
        {selectedBOQ && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>{selectedBOQ.title}</Text>
                <Text style={styles.summarySubtitle}>Phase: {selectedBOQ.phase_name || selectedBOQ.phase}</Text>
              </View>
              <View style={[styles.statusBadge, selectedBOQ.status === 'approved' ? styles.badgeGreen : styles.badgeGray]}>
                <Text style={styles.badgeText}>{selectedBOQ.status}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Planned</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalPlanned)}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Delivered</Text>
                <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{formatCurrency(totalDelivered)}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{items.length}</Text>
              </View>
            </View>
            <View style={styles.summaryActions}>
              {selectedBOQ.status === 'draft' && (
                <TouchableOpacity style={styles.actionBtn} onPress={handleApprove}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
                  <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>Approve</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={handleRecalculate} disabled={actionLoading}>
                <Ionicons name="refresh-outline" size={16} color="#2563EB" />
                <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Recalculate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Items List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Material Items</Text>
            {selectedBOQ && (
              <TouchableOpacity onPress={() => { resetItemForm(); setAddItemVisible(true); }}>
                <Ionicons name="add-circle-outline" size={22} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          {!selectedBOQ ? (
            <Text style={styles.emptyText}>No BOQ created yet. Tap + to create one.</Text>
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>No items added. Tap + to add materials.</Text>
          ) : (
            items.map((item: any) => {
              const pct = item.delivered_pct || 0;
              const over = parseFloat(item.delivered_qty || 0) > parseFloat(item.planned_qty || 0);
              return (
                <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openEditItem(item)}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.material_name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteItem(item)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemDesc}>
                    {item.description || 'No description'} · {item.category || 'uncategorized'}
                  </Text>
                  <View style={styles.itemStats}>
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Planned</Text>
                      <Text style={styles.itemStatValue}>{item.planned_qty} {item.unit}</Text>
                    </View>
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Delivered</Text>
                      <Text style={[styles.itemStatValue, over && { color: '#EF4444' }]}>
                        {item.delivered_qty} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Remaining</Text>
                      <Text style={styles.itemStatValue}>{item.remaining_qty} {item.unit}</Text>
                    </View>
                    <View style={styles.itemStat}>
                      <Text style={styles.itemStatLabel}>Cost</Text>
                      <Text style={styles.itemStatValue}>{formatCurrency(item.planned_cost)}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: over ? '#EF4444' : pct >= 80 ? '#22C55E' : '#2563EB',
                    }]} />
                  </View>
                  <Text style={styles.progressLabel}>{Math.round(pct)}% delivered</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create BOQ Modal */}
      <Modal visible={createBOQVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create BOQ</Text>
              <TouchableOpacity onPress={() => setCreateBOQVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput style={styles.formInput} value={newBOQTitle} onChangeText={setNewBOQTitle} placeholder="Bill of Quantities" placeholderTextColor="#94A3B8" />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Phase</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setPhaseDropdownVisible(!phaseDropdownVisible)}
              >
                <Text style={newBOQPhase ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {selectedPhase ? selectedPhase.name : 'Select a phase'}
                </Text>
                <Ionicons name={phaseDropdownVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
              </TouchableOpacity>
              {phaseDropdownVisible && (
                <View style={styles.dropdownList}>
                  {phases.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>No phases available.</Text>
                  ) : (
                    phases.map((p: any) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.dropdownOption, String(p.id) === newBOQPhase && styles.dropdownOptionActive]}
                        onPress={() => { setNewBOQPhase(String(p.id)); setPhaseDropdownVisible(false); }}
                      >
                        <Text style={[styles.dropdownOptionText, String(p.id) === newBOQPhase && { color: '#fff' }]}>
                          {p.name}{p.phase_type ? ` · ${p.phase_type}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity style={[styles.submitButton, actionLoading && { opacity: 0.6 }]} onPress={handleCreateBOQ} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Create BOQ</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal visible={addItemVisible || editItemVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editItemVisible ? 'Edit Item' : 'Add Material'}</Text>
              <TouchableOpacity onPress={() => { setAddItemVisible(false); setEditItemVisible(false); resetItemForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Material Name *</Text>
                <TextInput style={styles.formInput} value={itemName} onChangeText={setItemName} placeholder="e.g. Cement CEM I 42.5R" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={styles.formInput} value={itemDesc} onChangeText={setItemDesc} placeholder="Optional description" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, itemCategory === c && styles.chipActive]}
                      onPress={() => setItemCategory(c)}
                    >
                      <Text style={[styles.chipText, itemCategory === c && { color: '#fff' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <View style={styles.chipRow}>
                    {UNIT_OPTIONS.slice(0, 10).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.chip, itemUnit === u && styles.chipActive]}
                        onPress={() => setItemUnit(u)}
                      >
                        <Text style={[styles.chipText, itemUnit === u && { color: '#fff' }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Planned Qty *</Text>
                  <TextInput style={styles.formInput} value={itemQty} onChangeText={setItemQty} placeholder="e.g. 100" placeholderTextColor="#94A3B8" keyboardType="numeric" />
                </View>
                <View style={[styles.formSection, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Unit Price (UGX) *</Text>
                  <TextInput style={styles.formInput} value={itemPrice} onChangeText={setItemPrice} placeholder="e.g. 35000" placeholderTextColor="#94A3B8" keyboardType="numeric" />
                </View>
              </View>
              {itemQty && itemPrice && (
                <Text style={styles.calcText}>
                  Total: {formatCurrency(parseFloat(itemQty) * parseFloat(itemPrice))}
                </Text>
              )}
              {editItemVisible && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Used Qty</Text>
                  <TextInput
                    style={styles.formInput}
                    value={String(editingItem?.used_qty || 0)}
                    onChangeText={(t) => {
                      if (editingItem) setEditingItem({ ...editingItem, used_qty: t });
                    }}
                    placeholder="Qty used on site"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              )}
              <TouchableOpacity
                style={[styles.submitButton, actionLoading && { opacity: 0.6 }]}
                onPress={editItemVisible ? handleUpdateItem : handleAddItem}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{editItemVisible ? 'Update Item' : 'Add Item'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summarySubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeGreen: { backgroundColor: '#22C55E20' },
  badgeGray: { backgroundColor: '#64748B20' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryCol: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 2 },

  summaryActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  itemCard: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  itemDesc: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 8 },

  itemStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemStat: { alignItems: 'center' },
  itemStatLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  itemStatValue: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 1 },

  progressBar: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 10, color: '#94A3B8', textAlign: 'right' },

  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  formSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },
  formRow: { flexDirection: 'row' },

  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownText: { fontSize: 14, color: '#1E293B' },
  dropdownPlaceholder: { fontSize: 14, color: '#94A3B8' },
  dropdownList: { marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionActive: { backgroundColor: '#2563EB' },
  dropdownOptionText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropdownEmpty: { padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  phaseChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#F1F5F9', marginRight: 8,
  },
  phaseChipActive: { backgroundColor: '#2563EB' },
  phaseChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  calcText: { fontSize: 14, fontWeight: '700', color: '#2563EB', textAlign: 'center', marginBottom: 12 },

  submitButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
