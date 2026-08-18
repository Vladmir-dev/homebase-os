import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';

import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const CATEGORY_OPTIONS = [
  { value: 'repairs', label: 'Repairs', color: '#EF4444', icon: 'construct-outline' },
  { value: 'maintenance', label: 'Maintenance', color: '#F59E0B', icon: 'settings-outline' },
  { value: 'utilities', label: 'Utilities', color: '#2563EB', icon: 'flash-outline' },
  { value: 'materials', label: 'Materials', color: '#0D9488', icon: 'cube-outline' },
  { value: 'services', label: 'Services', color: '#8B5CF6', icon: 'people-outline' },
  { value: 'household', label: 'Household', color: '#EC4899', icon: 'home-outline' },
  { value: 'rent', label: 'Rent', color: '#06B6D4', icon: 'cash-outline' },
  { value: 'health', label: 'Health', color: '#22C55E', icon: 'medkit-outline' },
  { value: 'other', label: 'Other', color: '#64748B', icon: 'ellipsis-horizontal-outline' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TrackItScreen() {
  const router = useRouter();
  const { activeAsset } = useApp();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [budgetCategory, setBudgetCategory] = useState('repairs');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [receiptTitle, setReceiptTitle] = useState('');
  const [receiptVendor, setReceiptVendor] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptCategory, setReceiptCategory] = useState('other');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNotes, setReceiptNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const assetId = activeAsset?.backendId;
      const [budgetData, summaryData] = await Promise.all([
        api.getBudgets(assetId).catch(() => []),
        api.getReceiptSummary(assetId, selectedMonth, selectedYear).catch(() => ({ total_spent: 0, by_category: [] })),
      ]);
      setBudgets(Array.isArray(budgetData) ? budgetData : budgetData?.results || []);
      setSummary(summaryData);
    } catch (err: any) {
      console.warn('Track It load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAsset, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateBudget = async () => {
    if (!budgetLimit.trim()) {
      Alert.alert('Required', 'Please enter a budget limit.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createBudget({
        asset: activeAsset?.backendId,
        category: budgetCategory,
        monthly_limit: parseFloat(budgetLimit),
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgetModalVisible(false);
      setBudgetLimit('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create budget.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReceipt = async () => {
    if (!receiptTitle.trim() || !receiptAmount.trim()) {
      Alert.alert('Required', 'Please enter title and amount.');
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      if (activeAsset?.backendId) formData.append('asset', String(activeAsset.backendId));
      formData.append('title', receiptTitle.trim());
      formData.append('vendor', receiptVendor.trim());
      formData.append('amount', receiptAmount);
      formData.append('category', receiptCategory);
      formData.append('receipt_date', receiptDate);
      formData.append('notes', receiptNotes.trim());

      await api.createReceipt(formData);
      setReceiptModalVisible(false);
      setReceiptTitle('');
      setReceiptVendor('');
      setReceiptAmount('');
      setReceiptCategory('other');
      setReceiptNotes('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `UGX ${Number(amount || 0).toLocaleString()}`;

  const maxBarWidth = Dimensions.get('window').width - 100;
  const maxSpent = Math.max(
    ...(summary?.by_category || []).map((c: any) => parseFloat(c.total) || 0),
    1
  );

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
        <Text style={styles.headerTitle}>Track It</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MONTHS.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, selectedMonth === i + 1 && styles.monthChipActive]}
                onPress={() => setSelectedMonth(i + 1)}
              >
                <Text style={[styles.monthChipText, selectedMonth === i + 1 && styles.monthChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Spent Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spent — {MONTHS[selectedMonth - 1]} {selectedYear}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(summary?.total_spent || 0)}</Text>
          <View style={styles.totalActions}>
            <TouchableOpacity
              style={styles.totalActionButton}
              onPress={() => setReceiptModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.totalActionText}>Add Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.totalActionButton}
              onPress={() => setBudgetModalVisible(true)}
            >
              <Ionicons name="flag-outline" size={18} color="#0D9488" />
              <Text style={[styles.totalActionText, { color: '#0D9488' }]}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending by Category */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {(summary?.by_category || []).length === 0 ? (
            <Text style={styles.emptyText}>No spending recorded this month</Text>
          ) : (
            (summary?.by_category || []).map((cat: any) => {
              const catInfo = CATEGORY_OPTIONS.find((c) => c.value === cat.category) || CATEGORY_OPTIONS[8];
              const barWidth = (parseFloat(cat.total) / maxSpent) * maxBarWidth;
              return (
                <View key={cat.category} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <Ionicons name={catInfo.icon as any} size={16} color={catInfo.color} />
                    <Text style={styles.barLabelText}>{catInfo.label}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: barWidth, backgroundColor: catInfo.color }]} />
                  </View>
                  <Text style={styles.barValue}>{formatCurrency(cat.total)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Budgets */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Budgets</Text>
          </View>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets set for this month</Text>
          ) : (
            budgets.map((budget) => {
              const catInfo = CATEGORY_OPTIONS.find((c) => c.value === budget.category) || CATEGORY_OPTIONS[8];
              const pct = budget.monthly_limit > 0 ? Math.min((budget.spent / budget.monthly_limit) * 100, 100) : 0;
              const overBudget = budget.spent > budget.monthly_limit;
              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetLabel}>
                      <Ionicons name={catInfo.icon as any} size={16} color={catInfo.color} />
                      <Text style={styles.budgetLabelText}>{catInfo.label}</Text>
                    </View>
                    <Text style={[styles.budgetPct, overBudget && { color: '#EF4444' }]}>
                      {Math.round(pct)}%
                    </Text>
                  </View>
                  <View style={styles.budgetBar}>
                    <View
                      style={[
                        styles.budgetBarFill,
                        { width: `${pct}%`, backgroundColor: overBudget ? '#EF4444' : catInfo.color },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetFooter}>
                    <Text style={styles.budgetSpent}>{formatCurrency(budget.spent)} spent</Text>
                    <Text style={styles.budgetLimit}>of {formatCurrency(budget.monthly_limit)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Budget Modal */}
      <Modal visible={budgetModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Monthly Budget</Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        budgetCategory === cat.value && { backgroundColor: cat.color + '18', borderColor: cat.color },
                      ]}
                      onPress={() => setBudgetCategory(cat.value)}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={budgetCategory === cat.value ? cat.color : '#94A3B8'} />
                      <Text style={[styles.categoryText, budgetCategory === cat.value && { color: cat.color }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Monthly Limit (UGX)</Text>
                <TextInput
                  style={styles.formInput}
                  value={budgetLimit}
                  onChangeText={setBudgetLimit}
                  placeholder="e.g. 200000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, actionLoading && { opacity: 0.6 }]}
                onPress={handleCreateBudget}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Set Budget</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={receiptModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Receipt</Text>
              <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.formInput} value={receiptTitle} onChangeText={setReceiptTitle} placeholder="e.g. Plumbing materials" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Vendor</Text>
                <TextInput style={styles.formInput} value={receiptVendor} onChangeText={setReceiptVendor} placeholder="e.g. Hardware Plus" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Amount (UGX) *</Text>
                <TextInput style={styles.formInput} value={receiptAmount} onChangeText={setReceiptAmount} placeholder="e.g. 50000" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        receiptCategory === cat.value && { backgroundColor: cat.color + '18', borderColor: cat.color },
                      ]}
                      onPress={() => setReceiptCategory(cat.value)}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={receiptCategory === cat.value ? cat.color : '#94A3B8'} />
                      <Text style={[styles.categoryText, receiptCategory === cat.value && { color: cat.color }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput style={styles.formInput} value={receiptDate} onChangeText={setReceiptDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]} value={receiptNotes} onChangeText={setReceiptNotes} placeholder="Additional notes..." placeholderTextColor="#94A3B8" multiline />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, actionLoading && { opacity: 0.6 }]}
                onPress={handleCreateReceipt}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Save Receipt</Text>}
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

  monthSelector: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  monthChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginHorizontal: 4, backgroundColor: '#F1F5F9' },
  monthChipActive: { backgroundColor: '#2563EB' },
  monthChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  monthChipTextActive: { color: '#fff' },

  totalCard: {
    backgroundColor: '#1E293B', margin: 16, padding: 20, borderRadius: 16,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4, marginBottom: 16 },
  totalActions: { flexDirection: 'row', gap: 12 },
  totalActionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  totalActionText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  barLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 90 },
  barLabelText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '700', color: '#1E293B', width: 90, textAlign: 'right' },

  budgetCard: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  budgetLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetLabelText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  budgetPct: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
  budgetBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  budgetBarFill: { height: '100%', borderRadius: 3 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSpent: { fontSize: 12, color: '#64748B' },
  budgetLimit: { fontSize: 12, color: '#94A3B8' },

  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 16 },

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

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  submitButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
