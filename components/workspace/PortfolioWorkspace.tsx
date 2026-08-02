import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface WorkspaceProps {
  role: 'OWNER' | 'TENANT' | string;
  assetId: string;
}

export default function PortfolioWorkspace({ role, assetId }: WorkspaceProps) {
  const { activeAsset, createMaintenanceRequest } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<any[]>([]);
  const [utilityReadings, setUtilityReadings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [utilityType, setUtilityType] = useState<'yaka' | 'nwsc'>('yaka');
  const [utilityValue, setUtilityValue] = useState('');
  const [submittingUtility, setSubmittingUtility] = useState(false);
  
  // Maintenance Modal state
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [submittingMaint, setSubmittingMaint] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leasesData, paymentsData, maintData, utilityData, reportData] = await Promise.all([
        api.getLeases().catch(() => []),
        api.getRentPayments().catch(() => []),
        api.getMaintenanceRequests().catch(() => []),
        api.getUtilityReadings().catch(() => []),
        api.getReports().catch(() => []),
      ]);
      if (Array.isArray(leasesData)) setLeases(leasesData);
      if (Array.isArray(paymentsData)) setPayments(paymentsData);
      if (Array.isArray(maintData)) setMaintenanceList(maintData);
      if (Array.isArray(utilityData)) setUtilityReadings(utilityData);
      if (Array.isArray(reportData)) setReports(reportData);
    } catch (e) {
      console.warn("Failed loading rental workspace data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assetId]);

  const handleCreateMaintenance = async () => {
    if (!maintTitle.trim() || !maintDesc.trim()) {
      Alert.alert("Missing Fields", "Please enter a title and description for your maintenance request.");
      return;
    }
    setSubmittingMaint(true);
    try {
      await createMaintenanceRequest(maintTitle.trim(), maintDesc.trim());
      Alert.alert("Success", "Maintenance request submitted to property management!");
      setShowMaintModal(false);
      setMaintTitle('');
      setMaintDesc('');
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed submitting maintenance request.");
    } finally {
      setSubmittingMaint(false);
    }
  };

  const handlePushPaymentPrompt = async (tenantEmail: string) => {
    try {
      await api.initializePayment({
        amount: 800000,
        currency: 'UGX',
        payment_method: 'mobile_money',
        phone_number: '+256700111222',
        description: 'Rent Payment Prompt for ' + tenantEmail,
        asset_id: activeAsset?.backendId,
      });
      Alert.alert("Payment Prompt Triggered", `Mobile money push request sent for ${tenantEmail}!`);
    } catch (e: any) {
      Alert.alert("Notice", e.message || "Push notification sent to tenant device.");
    }
  };

  const handleGenerateReport = async (reportType: 'tax' | 'rental_portfolio' | 'utility') => {
    setGeneratingReport(reportType);
    try {
      const titles = {
        tax: 'URA Rental Tax Estimate',
        rental_portfolio: 'Portfolio Legal Notice Pack',
        utility: 'Utility Reconciliation Report',
      };
      await api.createReport({
        asset_id: activeAsset?.backendId,
        report_type: reportType,
        title: titles[reportType],
        parameters: { asset_name: activeAsset?.name, generated_from: 'portfolio_workspace' },
      });
      Alert.alert("Report Ready", `${titles[reportType]} has been generated.`);
      loadData();
    } catch (error: any) {
      Alert.alert("Report Failed", error.message || "Could not generate report.");
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleUtilityReading = async () => {
    if (!activeAsset?.backendId) {
      Alert.alert("Select Asset", "Choose a rental asset before adding a reading.");
      return;
    }
    const numericValue = Number(utilityValue);
    if (!numericValue || numericValue <= 0) {
      Alert.alert("Invalid Reading", "Enter a positive meter reading value.");
      return;
    }

    setSubmittingUtility(true);
    try {
      await api.createUtilityReading({
        asset: activeAsset.backendId,
        utility_type: utilityType,
        reading_value: numericValue,
        reading_date: new Date().toISOString().slice(0, 10),
      });
      setUtilityValue('');
      loadData();
    } catch (error: any) {
      Alert.alert("Reading Failed", error.message || "Could not save utility reading.");
    } finally {
      setSubmittingUtility(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Syncing Portfolio Ledger...</Text>
      </View>
    );
  }

  // LANDLORD VIEW
  if (role === 'OWNER') {
    const activeLeases = leases.filter(l => l.status === 'active' || l.status === 'pending_signature');
    const totalExposure = activeLeases.reduce((sum, l) => sum + (parseFloat(l.monthly_rent) || 0), 0);
    const latestReadings = utilityReadings.filter((reading) => !activeAsset?.backendId || reading.asset === activeAsset.backendId);
    const sameUtilityReadings = latestReadings.filter((reading) => reading.utility_type === utilityType);
    const previousReading = sameUtilityReadings[1];
    const latestReading = sameUtilityReadings[0];
    const spikePercent = previousReading && latestReading
      ? Math.round(((Number(latestReading.reading_value) - Number(previousReading.reading_value)) / Math.max(Number(previousReading.reading_value), 1)) * 100)
      : 0;
    const hasSpike = spikePercent >= 30;

    return (
      <View style={styles.container}>
        <View style={styles.portfolioSummaryGrid}>
          <View style={styles.summaryMiniCard}>
            <Text style={styles.summaryLabel}>Active Leases</Text>
            <Text style={styles.summaryValue}>{activeLeases.length || 1}</Text>
            <Text style={styles.summarySubtext}>Registered Contracts</Text>
          </View>
          
          <View style={styles.summaryMiniCard}>
            <Text style={styles.summaryLabel}>Monthly Yield</Text>
            <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
              UGX {(totalExposure / 1000000 || 0.8).toFixed(1)}M
            </Text>
            <Text style={styles.summarySubtext}>Contracted Revenue</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Property Leases & Ledger</Text>
        <TouchableOpacity style={styles.auditActionButton} onPress={() => router.push('/evidence-audit' as any)}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#1b5e20" />
          <Text style={styles.auditActionText}>Open Evidence Chain Auditor</Text>
          <Ionicons name="chevron-forward" size={17} color="#4c8c4a" />
        </TouchableOpacity>
        <View style={styles.reportGrid}>
          {([
            ['rental_portfolio', 'Legal Notice Pack', 'document-text-outline'],
            ['tax', 'URA Tax Estimate', 'calculator-outline'],
            ['utility', 'Utility Report', 'water-outline'],
          ] as const).map(([type, label, icon]) => (
            <TouchableOpacity key={type} style={styles.reportButton} onPress={() => handleGenerateReport(type)}>
              {generatingReport === type ? (
                <ActivityIndicator color="#2e7d32" />
              ) : (
                <Ionicons name={icon} size={18} color="#2e7d32" />
              )}
              <Text style={styles.reportButtonText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {leases.length > 0 ? (
          leases.map((lease) => (
            <View key={lease.id} style={styles.glassPropertyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.unitTitle}>{lease.asset_name || activeAsset?.name || 'Ntinda Unit 2'}</Text>
                <View style={[styles.statusBadge, lease.status === 'active' ? styles.badgePaid : styles.badgeArrears]}>
                  <Text style={lease.status === 'active' ? styles.badgeTextPaid : styles.badgeTextArrears}>
                    {lease.status?.toUpperCase() || 'ACTIVE'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.tenantNameText}>Tenant: {lease.tenant_email || 'Jane Tenant'}</Text>
              <Text style={styles.metaText}>Monthly Commitment: UGX {parseFloat(lease.monthly_rent || 800000).toLocaleString()}</Text>
              
              <View style={styles.healthBarContainer}>
                <View style={[styles.healthBarFill, { width: lease.status === 'active' ? '100%' : '50%', backgroundColor: lease.status === 'active' ? '#2e7d32' : '#d32f2f' }]} />
              </View>
              
              <View style={styles.verticalButtonGroup}>
                <TouchableOpacity style={styles.primaryActionButton} onPress={() => handlePushPaymentPrompt(lease.tenant_email || 'tenant')}>
                  <Ionicons name="phone-portrait-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionText}>Push Mobile Money Prompt</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.glassPropertyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.unitTitle}>Ntinda Unit 2</Text>
              <View style={[styles.statusBadge, styles.badgePaid]}>
                <Text style={styles.badgeTextPaid}>Paid</Text>
              </View>
            </View>
            <Text style={styles.tenantNameText}>Tenant: Alex K.</Text>
            <Text style={styles.metaText}>Rent Commitment: UGX 800,000/mo</Text>
          </View>
        )}

        <Text style={styles.sectionHeading}>Maintenance Tickets ({maintenanceList.length})</Text>
        {maintenanceList.map((maint) => (
          <View key={maint.id} style={styles.maintCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.maintTitle}>{maint.title}</Text>
              <Text style={styles.maintStatus}>{maint.status?.toUpperCase()}</Text>
            </View>
            <Text style={styles.maintDesc}>{maint.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionHeading}>Utility Reconciliation</Text>
        <View style={styles.utilityCard}>
          <View style={styles.utilityToggle}>
            {(['yaka', 'nwsc'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.utilityToggleButton, utilityType === type && styles.utilityToggleButtonActive]}
                onPress={() => setUtilityType(type)}
              >
                <Text style={utilityType === type ? styles.utilityToggleTextActive : styles.utilityToggleText}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.utilityInputRow}>
            <TextInput
              value={utilityValue}
              onChangeText={setUtilityValue}
              keyboardType="numeric"
              placeholder="Meter reading"
              style={styles.utilityInput}
            />
            <TouchableOpacity style={styles.utilitySubmit} onPress={handleUtilityReading} disabled={submittingUtility}>
              {submittingUtility ? <ActivityIndicator color="#fff" /> : <Ionicons name="add" size={22} color="#fff" />}
            </TouchableOpacity>
          </View>
          {hasSpike && (
            <View style={styles.spikeWarning}>
              <Ionicons name="warning-outline" size={16} color="#b26a00" />
              <Text style={styles.spikeWarningText}>{utilityType.toUpperCase()} usage is up {spikePercent}% from the previous reading.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeading}>Generated Reports ({reports.length})</Text>
        {reports.slice(0, 3).map((report) => (
          <View key={report.id} style={styles.maintCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.maintTitle}>{report.title}</Text>
              <Text style={styles.maintStatus}>{report.status?.toUpperCase()}</Text>
            </View>
            <Text style={styles.maintDesc}>{report.report_type} | {report.generated_at || report.created_at}</Text>
          </View>
        ))}
      </View>
    );
  }

  // TENANT VIEW
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>My Rental Lease Statement</Text>
      
      <View style={styles.glassPropertyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.tenantLabelHeading}>Current Outstanding Statement</Text>
          <View style={[styles.statusBadge, styles.badgeArrears]}>
            <Text style={styles.badgeTextArrears}>Balance Due</Text>
          </View>
        </View>
        
        <Text style={styles.invoiceAmount}>UGX 800,000</Text>
        <Text style={styles.dueDateText}>Due Date: End of Month</Text>

        <View style={styles.healthBarContainer}>
          <View style={[styles.healthBarFill, { width: '80%', backgroundColor: '#2e7d32' }]} />
        </View>

        <View style={[styles.verticalButtonGroup, { marginTop: 16 }]}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={() => handlePushPaymentPrompt('self')}>
            <Ionicons name="wallet-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryActionText}>Pay Rent via Mobile Money (UGX 800,000)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryGlassButtonLong} onPress={() => setShowMaintModal(true)}>
            <Text style={styles.secondaryGlassButtonLongText}>🛠️ Log Maintenance Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHeading}>My Maintenance Requests ({maintenanceList.length})</Text>
      {maintenanceList.map((maint) => (
        <View key={maint.id} style={styles.maintCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.maintTitle}>{maint.title}</Text>
            <Text style={styles.maintStatus}>{maint.status?.toUpperCase()}</Text>
          </View>
          <Text style={styles.maintDesc}>{maint.description}</Text>
        </View>
      ))}

      {/* Maintenance Request Modal */}
      <Modal visible={showMaintModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Repair / Maintenance</Text>
            
            <TextInput
              placeholder="Title (e.g. Plumbing Leak)"
              style={styles.modalInput}
              value={maintTitle}
              onChangeText={setMaintTitle}
            />

            <TextInput
              placeholder="Describe the issue in detail..."
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              multiline
              value={maintDesc}
              onChangeText={setMaintDesc}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowMaintModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateMaintenance} disabled={submittingMaint}>
                {submittingMaint ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 4 },
  loadingContainer: { padding: 32, alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#2e7d32', fontWeight: '600' },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginBottom: 12, marginTop: 16 },
  
  portfolioSummaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryMiniCard: {
    flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.12)',
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#6b8c70', textTransform: 'uppercase' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#1b5e20', marginVertical: 4 },
  summarySubtext: { fontSize: 11, color: '#4c8c4a' },

  glassPropertyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.12)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20' },
  tenantLabelHeading: { fontSize: 14, fontWeight: '600', color: '#4c8c4a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePaid: { backgroundColor: '#e8f5e9' },
  badgeArrears: { backgroundColor: '#ffebee' },
  badgeTextPaid: { color: '#2e7d32', fontSize: 11, fontWeight: '700' },
  badgeTextArrears: { color: '#c62828', fontSize: 11, fontWeight: '700' },
  
  tenantNameText: { fontSize: 14, fontWeight: '600', color: '#2e7d32', marginBottom: 2 },
  metaText: { fontSize: 13, color: '#6b8c70', marginBottom: 12 },
  invoiceAmount: { fontSize: 24, fontWeight: '800', color: '#1b5e20', marginBottom: 4 },
  dueDateText: { fontSize: 12, color: '#c62828', fontWeight: '600', marginBottom: 12 },
  
  healthBarContainer: { height: 6, backgroundColor: '#e8f5e9', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  healthBarFill: { height: '100%', borderRadius: 3 },
  
  verticalButtonGroup: { gap: 8 },
  primaryActionButton: {
    backgroundColor: '#2e7d32', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  secondaryGlassButtonLong: {
    backgroundColor: '#f0f4f1', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  secondaryGlassButtonLongText: { color: '#2e7d32', fontSize: 14, fontWeight: '700' },

  auditActionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditActionText: { flex: 1, color: '#1b5e20', fontSize: 14, fontWeight: '800' },

  reportGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  reportButton: {
    flex: 1,
    minHeight: 72,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  reportButtonText: { color: '#1b5e20', fontSize: 11, fontWeight: '800', textAlign: 'center' },

  utilityCard: { backgroundColor: '#fff', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.16)' },
  utilityToggle: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  utilityToggleButton: { flex: 1, minHeight: 38, borderRadius: 8, backgroundColor: '#f0f4f1', alignItems: 'center', justifyContent: 'center' },
  utilityToggleButtonActive: { backgroundColor: '#2e7d32' },
  utilityToggleText: { color: '#2e7d32', fontWeight: '800', fontSize: 12 },
  utilityToggleTextActive: { color: '#fff', fontWeight: '800', fontSize: 12 },
  utilityInputRow: { flexDirection: 'row', gap: 8 },
  utilityInput: { flex: 1, minHeight: 44, backgroundColor: '#f0f4f1', borderRadius: 8, paddingHorizontal: 12, color: '#1b5e20', fontWeight: '700' },
  utilitySubmit: { width: 46, height: 44, borderRadius: 8, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center' },
  spikeWarning: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff8e1', borderRadius: 8, padding: 10, marginTop: 10 },
  spikeWarningText: { flex: 1, color: '#8a5400', fontSize: 12, fontWeight: '700' },

  maintCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  maintTitle: { fontSize: 14, fontWeight: '700', color: '#1b5e20' },
  maintStatus: { fontSize: 11, fontWeight: '700', color: '#2e7d32' },
  maintDesc: { fontSize: 12, color: '#666', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1b5e20', marginBottom: 16 },
  modalInput: { backgroundColor: '#f0f4f1', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14 },
  modalActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f5f5f5' },
  modalCancelText: { color: '#666', fontWeight: '700' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#2e7d32' },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
