import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../services/api';

type ItemType = 'labour' | 'material' | 'other';

interface LineItem {
  key: string;
  item_type: ItemType;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  supplier: string;
}

let nextKey = 1;

const emptyItem = (): LineItem => ({
  key: String(nextKey++),
  item_type: 'labour',
  description: '',
  quantity: '1',
  unit: '',
  unit_price: '',
  supplier: '',
});

export default function QuotationCreateScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateItem = (key: string, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)),
    );
  };

  const removeItem = (key: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const calculateTotals = () => {
    let labour = 0;
    let materials = 0;
    let other = 0;
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const total = qty * price;
      if (item.item_type === 'labour') labour += total;
      else if (item.item_type === 'material') materials += total;
      else other += total;
    }
    const subtotal = labour + materials + other;
    const fee = Math.round(subtotal * 0.05);
    return { labour, materials, other, subtotal, fee, total: subtotal + fee };
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    const validItems = items.filter(
      (it) => it.description.trim() && Number(it.unit_price) > 0,
    );
    if (validItems.length === 0) {
      Alert.alert('Required', 'Add at least one line item with a description and price.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        booking_id: Number(bookingId),
        notes,
        items: validItems.map((it) => ({
          item_type: it.item_type,
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unit: it.unit.trim() || undefined,
          unit_price: Number(it.unit_price),
          supplier: it.supplier.trim() || undefined,
        })),
      };
      const quotation = await api.createQuotation(payload);
      Alert.alert('Created', 'Quotation created as draft. Review and submit.', [
        { text: 'View', onPress: () => router.replace(`/quotation/${quotation.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create quotation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quotation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.bookingBadge}>Booking #{bookingId}</Text>

        {items.map((item, index) => (
          <View key={item.key} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>Item {index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(item.key)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['labour', 'material', 'other'] as ItemType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    item.item_type === t && styles.typeBtnActive,
                  ]}
                  onPress={() => updateItem(item.key, 'item_type', t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      item.item_type === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={item.description}
              onChangeText={(v) => updateItem(item.key, 'description', v)}
              placeholder="e.g. Plumbing repair"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Qty</Text>
                <TextInput
                  style={styles.input}
                  value={item.quantity}
                  onChangeText={(v) => updateItem(item.key, 'quantity', v)}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={item.unit}
                  onChangeText={(v) => updateItem(item.key, 'unit', v)}
                  placeholder="e.g. hrs, pcs"
                />
              </View>
              <View style={{ flex: 1.2, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Unit Price (UGX)</Text>
                <TextInput
                  style={styles.input}
                  value={item.unit_price}
                  onChangeText={(v) => updateItem(item.key, 'unit_price', v)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Supplier (optional)</Text>
            <TextInput
              style={styles.input}
              value={item.supplier}
              onChangeText={(v) => updateItem(item.key, 'supplier', v)}
              placeholder="Supplier name"
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addItemBtn} onPress={() => setItems([...items, emptyItem()])}>
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.addItemText}>Add Line Item</Text>
        </TouchableOpacity>

        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>Cost Breakdown</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Labour</Text>
            <Text style={styles.totalValue}>UGX {totals.labour.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Materials</Text>
            <Text style={styles.totalValue}>UGX {totals.materials.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Other</Text>
            <Text style={styles.totalValue}>UGX {totals.other.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TruHub Fee (5%)</Text>
            <Text style={styles.totalValue}>UGX {totals.fee.toLocaleString()}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>UGX {totals.total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes for the customer..."
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Draft Quotation</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  bookingBadge: {
    alignSelf: 'flex-start', backgroundColor: '#2563EB20', color: '#2563EB',
    fontSize: 13, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  itemIndex: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#E2E8F0', alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeBtnTextActive: { color: '#fff' },
  row: { flexDirection: 'row' },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, marginBottom: 20, gap: 8,
  },
  addItemText: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  totalsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  totalsTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 13, color: '#64748B' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  grandTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#E2E8F0' },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  notesSection: { marginBottom: 24 },
  notesInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
    minHeight: 80, textAlignVertical: 'top',
  },
  footer: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  submitBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
