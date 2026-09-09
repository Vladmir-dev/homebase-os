import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function TrustCenterScreen() {
  const router = useRouter();
  const { activeAsset } = useApp();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getTrustSummary(activeAsset?.backendId);
      setSummary(data);
    } catch (error: any) {
      Alert.alert('Trust Summary Failed', error.message || 'Could not load trust summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAsset?.backendId]);

  const bandColor = (band?: string) => {
    if (band === 'strong' || band === 'excellent') return '#2563EB';
    if (band === 'verified' || band === 'good') return '#558b2f';
    if (band === 'building' || band === 'fair') return '#b26a00';
    return '#c62828';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Trust Center</Text>
          <Text style={styles.subtitle}>{activeAsset?.name || 'Account trust profile'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Verifying evidence chain...</Text>
        </View>
      ) : !summary ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No trust summary available.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.scoreCard, { backgroundColor: bandColor(summary.trust_band) }]}>
            <Text style={styles.scoreLabel}>Platform Trust Score</Text>
            <Text style={styles.scoreValue}>{summary.trust_score}<Text style={styles.scoreMax}>/100</Text></Text>
            <Text style={styles.scoreBand}>{summary.trust_band?.toUpperCase()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Reliability</Text>
          <View style={styles.itemCard}>
            <View style={styles.itemRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              <Text style={styles.itemLabel}>Reliability Score</Text>
              <Text style={styles.itemValue}>{summary.user?.reliability_score}/100</Text>
            </View>
            <View style={styles.itemRow}>
              <Ionicons name="ribbon-outline" size={18} color="#2563EB" />
              <Text style={styles.itemLabel}>Band</Text>
              <Text style={[styles.itemValue, { color: bandColor(summary.user?.reliability_band) }]}>
                {summary.user?.reliability_band}
              </Text>
            </View>
            <View style={styles.itemRow}>
              <Ionicons name="warning-outline" size={18} color="#c62828" />
              <Text style={styles.itemLabel}>Unresolved Strikes</Text>
              <Text style={styles.itemValue}>{summary.user?.unresolved_strikes}</Text>
            </View>
          </View>

          {summary.asset && (
            <>
              <Text style={styles.sectionTitle}>Evidence Chain ({summary.asset.name})</Text>
              <View style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                  <Text style={styles.itemLabel}>Total Evidence</Text>
                  <Text style={styles.itemValue}>{summary.asset.total_evidence}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
                  <Text style={styles.itemLabel}>Verified Records</Text>
                  <Text style={styles.itemValue}>{summary.asset.verified_evidence}</Text>
                </View>
                <View style={[styles.itemRow, summary.asset.chain_valid ? styles.chainValidRow : styles.chainBrokenRow]}>
                  <Ionicons
                    name={summary.asset.chain_valid ? 'lock-closed-outline' : 'alert-circle-outline'}
                    size={18}
                    color={summary.asset.chain_valid ? '#2563EB' : '#c62828'}
                  />
                  <Text style={styles.itemLabel}>Hash Chain Integrity</Text>
                  <Text style={[styles.itemValue, { color: summary.asset.chain_valid ? '#2563EB' : '#c62828' }]}>
                    {summary.asset.chain_valid ? 'Intact' : 'Broken'}
                  </Text>
                </View>
                {!summary.asset.chain_valid && (
                  <Text style={styles.warningText}>
                    Record #{summary.asset.broken_evidence_id} failed hash linkage. Re-run the
                    evidence audit and rebuild the chain.
                  </Text>
                )}
              </View>
            </>
          )}

          {summary.strikes && summary.strikes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Open Strikes</Text>
              {summary.strikes.map((strike: any) => (
                <View key={strike.id} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{strike.severity}</Text>
                    <Text style={styles.itemValue}>{new Date(strike.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{strike.reason}</Text>
                </View>
              ))}
            </>
          )}

          {summary.strikes && summary.strikes.length === 0 && (
            <View style={styles.cleanPanel}>
              <Ionicons name="sparkles-outline" size={20} color="#2563EB" />
              <Text style={styles.cleanText}>No open strikes. Your record is clean.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={loadData}>
            <Ionicons name="refresh" size={17} color="#fff" />
            <Text style={styles.primaryButtonText}>Refresh Trust Summary</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#2563EB', marginTop: 8, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  scoreCard: { borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  scoreLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  scoreValue: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 4 },
  scoreMax: { fontSize: 16, fontWeight: '700' },
  scoreBand: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800', marginTop: 2 },
  sectionTitle: { color: '#1E293B', fontSize: 16, fontWeight: '800', marginBottom: 10, marginTop: 4 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(37, 99, 235,0.12)' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemLabel: { flex: 1, color: '#333', fontSize: 14, fontWeight: '700' },
  itemValue: { color: '#1E293B', fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  itemMeta: { color: '#64748B', fontSize: 12, marginTop: 4 },
  chainValidRow: { backgroundColor: '#F8FAFC', borderRadius: 6, padding: 6, marginTop: 4 },
  chainBrokenRow: { backgroundColor: '#ffebee', borderRadius: 6, padding: 6, marginTop: 4 },
  warningText: { color: '#c62828', fontSize: 12, fontWeight: '600', marginTop: 8, lineHeight: 17 },
  cleanPanel: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10 },
  cleanText: { color: '#2563EB', fontSize: 13, fontWeight: '700', flex: 1 },
  primaryButton: { minHeight: 46, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 6 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
