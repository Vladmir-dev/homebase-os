import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkspaceProps {
  role: 'OWNER' | 'TENANT' | string;
  assetId: string;
}

export default function PortfolioWorkspace({ role, assetId }: WorkspaceProps) {
  
  // PERSPECTIVE A: LANDLORD VIEW LAYOUT TREE
  if (role === 'OWNER') {
    return (
      <View style={styles.container}>
        
        {/* 1. AGGREGATE FINANCIAL HEALTH STRIP MATRIX */}
        <View style={styles.portfolioSummaryGrid}>
          <View style={styles.summaryMiniCard}>
            <Text style={styles.summaryLabel}>Total Units</Text>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summarySubtext}>83.3% Occupied</Text>
          </View>
          
          <View style={styles.summaryMiniCard}>
            <Text style={styles.summaryLabel}>Active Arrears</Text>
            <Text style={[styles.summaryValue, { color: '#c62828' }]}>2</Text>
            <Text style={styles.summarySubtext}>UGX 2.4M Owed</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Property Portfolio Queue</Text>
        
        {/* Unit Card 1: Stable Account */}
        <View style={styles.glassPropertyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.unitTitle}>Ntinda Unit 2</Text>
            <View style={[styles.statusBadge, styles.badgePaid]}>
              <Text style={styles.badgeTextPaid}>Paid</Text>
            </View>
          </View>
          
          <Text style={styles.tenantNameText}>Tenant: Alex K.</Text>
          <Text style={styles.metaText}>Rent Commitment: UGX 800,000/mo</Text>
          
          <View style={styles.healthBarContainer}>
            <View style={[styles.healthBarFill, { width: '100%', backgroundColor: '#2e7d32' }]} />
          </View>
          <View style={styles.healthMetaRow}>
            <Text style={styles.healthLabel}>Collection Index</Text>
            <Text style={[styles.healthLabel, styles.boldGreenText]}>100%</Text>
          </View>
          
          <View style={styles.dualInlineActionRow}>
            <TouchableOpacity style={styles.secondaryGlassButton} onPress={() => alert('Opening transactional ledger...')}>
              <Ionicons name="receipt-outline" size={14} color="#2e7d32" style={{ marginRight: 4 }} />
              <Text style={styles.secondaryGlassButtonText}>View Ledger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryGlassButton} onPress={() => alert('Logging maintenance expense...')}>
              <Ionicons name="hammer-outline" size={14} color="#2e7d32" style={{ marginRight: 4 }} />
              <Text style={styles.secondaryGlassButtonText}>Log Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit Card 2: Delinquent Account State */}
        <View style={styles.glassPropertyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.unitTitle}>Bukoto Unit 4B</Text>
            <View style={[styles.statusBadge, styles.badgeArrears]}>
              <Text style={styles.badgeTextArrears}>15 Days Overdue</Text>
            </View>
          </View>
          
          <Text style={styles.tenantNameText}>Tenant: Sarah A.</Text>
          <Text style={styles.metaText}>Rent Commitment: UGX 1,200,000/mo</Text>
          
          <View style={styles.healthBarContainer}>
            <View style={[styles.healthBarFill, { width: '30%', backgroundColor: '#d32f2f' }]} />
          </View>
          <View style={styles.healthMetaRow}>
            <Text style={styles.healthLabel}>Collection Index</Text>
            <Text style={[styles.healthLabel, { color: '#d32f2f', fontWeight: '700' }]}>30%</Text>
          </View>
          
          {/* Integrated Actions Layer */}
          <View style={styles.verticalButtonGroup}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => alert('Triggering network API payment prompt to tenant phone...')}>
              <Ionicons name="phone-portrait-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryActionText}>Push Mobile Money Request</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.legalNoticeButton} onPress={() => alert('Compiling tenant metadata into Landlord & Tenant Act 2022 framework PDF...')}>
              <Ionicons name="document-text-outline" size={16} color="#c62828" style={{ marginRight: 6 }} />
              <Text style={styles.legalNoticeButtonText}>Generate Legal Notice (PDF)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // PERSPECTIVE B: TENANT VIEW FLOW
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
        
        <Text style={styles.invoiceAmount}>UGX 450,000</Text>
        <Text style={styles.dueDateText}>Due Date: June 30, 2026</Text>

        {/* Micro-Installment Performance Visualization */}
        <View style={styles.healthBarContainer}>
          <View style={[styles.healthBarFill, { width: '60%', backgroundColor: '#2e7d32' }]} />
        </View>
        <View style={styles.healthMetaRow}>
          <Text style={styles.healthLabel}>Lease Cycle Clearing Progress</Text>
          <Text style={[styles.healthLabel, styles.boldGreenText]}>60% Cleared</Text>
        </View>

        <View style={[styles.verticalButtonGroup, { marginTop: 16 }]}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={() => alert('Processing split micro-installment payment loop...')}>
            <Ionicons name="wallet-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryActionText}>Pay Weekly Installment (UGX 112,500)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryGlassButtonLong} onPress={() => alert('Opening device camera module for maintenance snap...')}>
            <Text style={styles.secondaryGlassButtonLongText}>🛠️ Request Repair / Snap Asset Leak Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 4 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginBottom: 12, marginTop: 8 },
  
  // PORTFOLIO STATS GRID STYLE SIGNATURES
  portfolioSummaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#6b8c70', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#1b5e20', marginVertical: 2 },
  summarySubtext: { fontSize: 11, fontWeight: '500', color: '#4c8c4a' },

  // LIQUID GLASS THEMED CONTAINER SPECIFICATIONS
  glassPropertyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)', 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#122615',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 0, // Clean protection layer to completely eliminate the opaque backdrop bug
      }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  unitTitle: { fontSize: 16, fontWeight: '700', color: '#1a3b1c', flex: 1, marginRight: 8 },
  tenantNameText: { fontSize: 14, fontWeight: '600', color: '#2e7d32', marginBottom: 2 },
  metaText: { fontSize: 13, color: '#6b8c70', marginBottom: 12, fontWeight: '500' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePaid: { backgroundColor: '#e8f5e9' },
  badgeArrears: { backgroundColor: '#ffebee' },
  badgeTextPaid: { color: '#2e7d32', fontSize: 11, fontWeight: '700' },
  badgeTextArrears: { color: '#c62828', fontSize: 11, fontWeight: '700' },
  
  // HEALTH BAR RUNWAYS
  healthBarContainer: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  healthBarFill: { height: '100%' },
  healthMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  healthLabel: { fontSize: 12, fontWeight: '600', color: '#6b8c70' },
  boldGreenText: { color: '#2e7d32', fontWeight: '700' },

  // MULTI-ACTION CORE ALIGNMENTS
  dualInlineActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryGlassButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  secondaryGlassButtonText: { color: '#2e7d32', fontSize: 12, fontWeight: '700' },
  
  verticalButtonGroup: { gap: 8, marginTop: 12 },
  primaryActionButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#2e7d32', 
    borderRadius: 12, 
    paddingVertical: 12,
  },
  primaryActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  legalNoticeButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 40, 40, 0.05)', 
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.25)',
    borderRadius: 12, 
    paddingVertical: 12,
  },
  legalNoticeButtonText: { color: '#c62828', fontSize: 13, fontWeight: '700' },

  // TENANT SPECIFIC STYLES OVERRIDES
  tenantLabelHeading: { fontSize: 12, fontWeight: '700', color: '#6b8c70', textTransform: 'uppercase', letterSpacing: 0.5 },
  invoiceAmount: { fontSize: 26, fontWeight: '800', color: '#c62828', marginTop: 6, marginBottom: 2 },
  dueDateText: { fontSize: 13, color: '#4c8c4a', fontWeight: '600', marginBottom: 14 },
  secondaryGlassButtonLong: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryGlassButtonLongText: { color: '#2e7d32', fontSize: 13, fontWeight: '700' },
});