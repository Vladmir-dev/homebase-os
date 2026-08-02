import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type Panel = 'staff' | 'chama' | 'family' | 'grocery';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function ResidentCommandScreen() {
  const router = useRouter();
  const { activeAsset, userProfile } = useApp();
  const [activePanel, setActivePanel] = useState<Panel>('staff');
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [chama, setChama] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groceryOrders, setGroceryOrders] = useState<any[]>([]);
  const [staffModal, setStaffModal] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'House Manager',
    salary: '250000',
    nssf_number: '',
    nssf_contribution: '25000',
  });
  const [contributionAmount, setContributionAmount] = useState('50000');
  const [groceryItems, setGroceryItems] = useState('Sugar 1kg, Rice 2kg, Soap');
  const [savingAction, setSavingAction] = useState(false);

  const householdAssetId = activeAsset?.backendId;

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, chamaData, roleData, groceryData] = await Promise.all([
        api.getDomesticStaff().catch(() => []),
        api.getChamaContributions(userProfile?.id).catch(() => []),
        api.getAssetRoles().catch(() => []),
        api.getGroceryOrders().catch(() => []),
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setChama(Array.isArray(chamaData) ? chamaData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
      setGroceryOrders(Array.isArray(groceryData) ? groceryData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [householdAssetId, userProfile?.id]);

  const totalChama = useMemo(
    () => chama.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [chama],
  );

  const createStaff = async () => {
    if (!householdAssetId) {
      Alert.alert('Select Household', 'Choose a household asset before adding staff.');
      return;
    }
    if (!staffForm.first_name.trim() || !staffForm.phone_number.trim()) {
      Alert.alert('Missing Details', 'Enter at least a first name and phone number.');
      return;
    }

    setSavingStaff(true);
    try {
      await api.createDomesticStaff({
        asset: householdAssetId,
        first_name: staffForm.first_name.trim(),
        last_name: staffForm.last_name.trim() || '-',
        phone_number: staffForm.phone_number.trim(),
        role: staffForm.role.trim() || 'House Manager',
        salary: Number(staffForm.salary) || 0,
        nssf_number: staffForm.nssf_number.trim(),
        nssf_contribution: Number(staffForm.nssf_contribution) || 0,
        permissions: { errands: true, maintenance_access: true },
      });
      setStaffModal(false);
      setStaffForm({
        first_name: '',
        last_name: '',
        phone_number: '',
        role: 'House Manager',
        salary: '250000',
        nssf_number: '',
        nssf_contribution: '25000',
      });
      loadData();
    } catch (error: any) {
      Alert.alert('Staff Save Failed', error.message || 'Could not add household staff.');
    } finally {
      setSavingStaff(false);
    }
  };

  const createContribution = async () => {
    if (!userProfile?.id) {
      Alert.alert('Profile Missing', 'Your account profile is required to create a contribution.');
      return;
    }
    setSavingAction(true);
    try {
      await api.createChamaContribution({
        user: userProfile.id,
        amount: Number(contributionAmount) || 0,
        currency: 'UGX',
        contribution_number: chama.length + 1,
        due_date: todayIso(),
        status: 'pending',
      });
      setContributionAmount('50000');
      loadData();
    } catch (error: any) {
      Alert.alert('Contribution Failed', error.message || 'Could not create Chama contribution.');
    } finally {
      setSavingAction(false);
    }
  };

  const confirmContribution = async (item: any) => {
    setSavingAction(true);
    try {
      await api.confirmChamaContribution(item.id);
      Alert.alert('Confirmed', `Contribution round #${item.contribution_number} marked confirmed.`);
      loadData();
    } catch (error: any) {
      Alert.alert('Confirm Failed', error.message || 'Could not confirm contribution.');
    } finally {
      setSavingAction(false);
    }
  };

  const sendGroceryOrder = async () => {
    const items = groceryItems
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, quantity: 1, price: 0 }));

    if (!items.length) {
      Alert.alert('Empty Basket', 'Enter at least one grocery item.');
      return;
    }

    setSavingAction(true);
    try {
      await api.createGroceryOrder({
        items,
        mode: 'kadogo',
        delivery_address: activeAsset?.location || 'Homebase household',
      });
      Alert.alert('Order Sent', 'Kadogo grocery order has been submitted.');
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Could not send grocery order.');
    } finally {
      setSavingAction(false);
    }
  };

  const cancelGroceryOrder = async (order: any) => {
    setSavingAction(true);
    try {
      await api.cancelGroceryOrder(order.id);
      Alert.alert('Cancelled', 'The grocery order has been cancelled.');
      loadData();
    } catch (error: any) {
      Alert.alert('Cancel Failed', error.message || 'Could not cancel grocery order.');
    } finally {
      setSavingAction(false);
    }
  };

  const panels: Array<{ id: Panel; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'staff', label: 'Staff', icon: 'people-outline' },
    { id: 'chama', label: 'Chama', icon: 'wallet-outline' },
    { id: 'family', label: 'Family', icon: 'qr-code-outline' },
    { id: 'grocery', label: 'Grocery', icon: 'basket-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Resident Command</Text>
          <Text style={styles.subtitle}>{activeAsset?.name || 'Household controls'}</Text>
        </View>
      </View>

      <View style={styles.panelTabs}>
        {panels.map((panel) => (
          <TouchableOpacity
            key={panel.id}
            style={[styles.panelTab, activePanel === panel.id && styles.panelTabActive]}
            onPress={() => setActivePanel(panel.id)}
          >
            <Ionicons name={panel.icon} size={17} color={activePanel === panel.id ? '#fff' : '#2e7d32'} />
            <Text style={activePanel === panel.id ? styles.panelTabTextActive : styles.panelTabText}>{panel.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Syncing household controls...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activePanel === 'staff' && (
            <View>
              <View style={styles.summaryBand}>
                <Metric value={staff.length} label="Staff" />
                <Metric
                  value={`UGX ${staff.reduce((sum, item) => sum + (Number(item.salary) || 0), 0).toLocaleString()}`}
                  label="Payroll"
                />
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setStaffModal(true)}>
                <Ionicons name="person-add-outline" size={17} color="#fff" />
                <Text style={styles.primaryButtonText}>Register Staff Member</Text>
              </TouchableOpacity>
              {staff.map((person) => (
                <View key={person.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{person.first_name} {person.last_name}</Text>
                    <Text style={styles.itemBadge}>{person.status || 'active'}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{person.role} | {person.phone_number}</Text>
                  <Text style={styles.itemMeta}>Salary UGX {Number(person.salary || 0).toLocaleString()} | NSSF UGX {Number(person.nssf_contribution || 0).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}

          {activePanel === 'chama' && (
            <View>
              <View style={styles.summaryBand}>
                <Metric value={chama.length} label="Contributions" />
                <Metric value={`UGX ${totalChama.toLocaleString()}`} label="Tracked" />
              </View>
              <View style={styles.formRow}>
                <TextInput
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Contribution amount"
                />
                <TouchableOpacity style={styles.squareAction} onPress={createContribution} disabled={savingAction}>
                  {savingAction ? <ActivityIndicator color="#fff" /> : <Ionicons name="add" size={22} color="#fff" />}
                </TouchableOpacity>
              </View>
              {chama.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Round #{item.contribution_number}</Text>
                    <Text style={styles.itemBadge}>{item.status}</Text>
                  </View>
                  <Text style={styles.itemMeta}>UGX {Number(item.amount || 0).toLocaleString()} due {item.due_date}</Text>
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => confirmContribution(item)}
                      disabled={savingAction}
                    >
                      {savingAction ? <ActivityIndicator color="#2e7d32" /> : <Text style={styles.secondaryButtonText}>Mark Paid</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {activePanel === 'family' && (
            <View>
              <View style={styles.infoPanel}>
                <Ionicons name="qr-code-outline" size={26} color="#2e7d32" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Family Link Code</Text>
                  <Text style={styles.infoText}>HB-{householdAssetId || '000'}-{userProfile?.id || 'USER'}</Text>
                </View>
              </View>
              {roles.map((role) => (
                <View key={role.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{role.user_email}</Text>
                    <Text style={styles.itemBadge}>{role.role}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{role.asset_name}</Text>
                </View>
              ))}
            </View>
          )}

          {activePanel === 'grocery' && (
            <View>
              <Text style={styles.inputLabel}>Kadogo Basket</Text>
              <TextInput
                value={groceryItems}
                onChangeText={setGroceryItems}
                style={[styles.input, styles.largeInput]}
                multiline
                placeholder="Separate items with commas"
              />
              <TouchableOpacity style={styles.primaryButton} onPress={sendGroceryOrder} disabled={savingAction}>
                {savingAction ? <ActivityIndicator color="#fff" /> : <Ionicons name="send-outline" size={17} color="#fff" />}
                <Text style={styles.primaryButtonText}>Submit Grocery Order</Text>
              </TouchableOpacity>
              <Text style={styles.inputLabel}>Order History ({groceryOrders.length})</Text>
              {groceryOrders.slice(0, 6).map((order) => (
                <View key={order.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>
                      {Array.isArray(order.items) && order.items.length
                        ? order.items.map((item: any) => item.name || item).join(', ')
                        : 'Grocery order'}
                    </Text>
                    <Text style={styles.itemBadge}>{order.status}</Text>
                  </View>
                  <Text style={styles.itemMeta}>
                    {order.mode} | {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                  </Text>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => cancelGroceryOrder(order)}
                      disabled={savingAction}
                    >
                      {savingAction ? <ActivityIndicator color="#2e7d32" /> : <Text style={styles.secondaryButtonText}>Cancel Order</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {groceryOrders.length === 0 && (
                <Text style={styles.emptyText}>No grocery orders yet.</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={staffModal} transparent animationType="slide" onRequestClose={() => setStaffModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register Staff</Text>
            {(['first_name', 'last_name', 'phone_number', 'role', 'salary', 'nssf_number', 'nssf_contribution'] as const).map((field) => (
              <TextInput
                key={field}
                value={staffForm[field]}
                onChangeText={(value) => setStaffForm((current) => ({ ...current, [field]: value }))}
                style={styles.modalInput}
                placeholder={field.replace(/_/g, ' ')}
                keyboardType={field === 'salary' || field === 'nssf_contribution' ? 'numeric' : 'default'}
              />
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setStaffModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={createStaff} disabled={savingStaff}>
                {savingStaff ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#1b5e20' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#4c8c4a', marginTop: 2 },
  panelTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  panelTab: { flex: 1, minHeight: 42, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 3 },
  panelTabActive: { backgroundColor: '#2e7d32' },
  panelTabText: { color: '#2e7d32', fontSize: 11, fontWeight: '800' },
  panelTabTextActive: { color: '#fff', fontSize: 11, fontWeight: '800' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#2e7d32', marginTop: 8, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  summaryBand: { flexDirection: 'row', backgroundColor: '#1b5e20', borderRadius: 8, paddingVertical: 16, marginBottom: 14 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  metricLabel: { color: '#c8e6c9', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  primaryButton: { minHeight: 46, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 14 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  itemTitle: { color: '#1b5e20', fontSize: 15, fontWeight: '800', flex: 1 },
  itemBadge: { color: '#2e7d32', backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  itemMeta: { color: '#4c8c4a', fontSize: 12, lineHeight: 17 },
  secondaryButton: { minHeight: 38, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryButtonText: { color: '#2e7d32', fontSize: 13, fontWeight: '800' },
  emptyText: { color: '#4c8c4a', fontSize: 13, fontWeight: '600', textAlign: 'center', marginVertical: 10 },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: { flex: 1, minHeight: 46, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, color: '#1b5e20', fontWeight: '700' },
  squareAction: { width: 48, height: 46, borderRadius: 8, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center' },
  infoPanel: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  infoTitle: { color: '#1b5e20', fontWeight: '800', fontSize: 15 },
  infoText: { color: '#4c8c4a', fontWeight: '800', marginTop: 4 },
  inputLabel: { color: '#1b5e20', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  largeInput: { height: 110, textAlignVertical: 'top', paddingTop: 12, marginBottom: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 8, padding: 18 },
  modalTitle: { color: '#1b5e20', fontSize: 19, fontWeight: '800', marginBottom: 12 },
  modalInput: { backgroundColor: '#f0f4f1', borderRadius: 8, minHeight: 44, paddingHorizontal: 12, marginBottom: 9, color: '#1b5e20' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelButton: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#2e7d32', fontWeight: '800' },
  saveButton: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800' },
});
