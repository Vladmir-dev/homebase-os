import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface EvidenceRecord {
  id: number;
  asset: number;
  asset_name?: string;
  user_id?: number;
  user_email?: string;
  signed_by_email?: string | null;
  timestamp?: string;
  gps_coordinates?: string;
  evidence_type?: string;
  description?: string;
  prev_hash?: string | null;
  curr_hash?: string;
  hash_timestamp?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface ChainStatus {
  valid: boolean;
  checked: number;
  brokenIds: number[];
}

const shortHash = (hash?: string | null) => {
  if (!hash) return 'Genesis';
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Pending timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const hashPayload = (record: EvidenceRecord) =>
  [
    String(record.asset ?? ''),
    String(record.user_id ?? ''),
    record.evidence_type || '',
    record.description || '',
    record.gps_coordinates || '',
    record.prev_hash || '',
    record.hash_timestamp || '',
  ].join('|');

const computeRecordHash = (record: EvidenceRecord) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hashPayload(record));

const verifyChain = async (records: EvidenceRecord[]): Promise<ChainStatus> => {
  const ordered = [...records]
    .filter((record) => record.id != null)
    .sort((a, b) => {
      const aTime = (a.created_at || '').localeCompare(b.created_at || '');
      return aTime !== 0 ? aTime : a.id - b.id;
    });
  const brokenIds: number[] = [];
  let previousHash = '';
  for (const record of ordered) {
    if (!record.hash_timestamp || !record.curr_hash) {
      brokenIds.push(record.id);
      previousHash = record.curr_hash || '';
      continue;
    }
    const recomputed = await computeRecordHash(record);
    const linkageOk =
      (record.prev_hash || '') === previousHash;
    const hashOk = recomputed === record.curr_hash;
    if (!linkageOk || !hashOk) brokenIds.push(record.id);
    previousHash = record.curr_hash;
  }
  return { valid: brokenIds.length === 0, checked: ordered.length, brokenIds };
};

export default function EvidenceAuditScreen() {
  const router = useRouter();
  const { activeAsset, userProfile } = useApp();
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [chainStatus, setChainStatus] = useState<ChainStatus>({
    valid: false,
    checked: 0,
    brokenIds: [],
  });
  const [verifyingChain, setVerifyingChain] = useState(false);

  const runChainCheck = async (list: EvidenceRecord[]) => {
    if (list.length === 0) {
      setChainStatus({ valid: false, checked: 0, brokenIds: [] });
      return;
    }
    setVerifyingChain(true);
    try {
      const result = await verifyChain(list);
      setChainStatus(result);
    } catch (error: any) {
      setChainStatus({ valid: false, checked: list.length, brokenIds: [] });
    } finally {
      setVerifyingChain(false);
    }
  };

  const loadEvidence = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getEvidence(activeAsset?.backendId);
      const list = Array.isArray(data) ? data : [];
      setRecords(list);
      await runChainCheck(list);
    } catch (error: any) {
      Alert.alert('Evidence Sync Failed', error.message || 'Could not load the evidence chain.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [activeAsset?.backendId]);

  const verifiedCount = records.filter((record) => record.is_verified).length;
  const chainHealth = useMemo(() => {
    if (records.length === 0) return 0;
    return Math.round((verifiedCount / records.length) * 100);
  }, [records.length, verifiedCount]);

  const brokenSet = new Set(chainStatus.brokenIds);

  const handleVerify = async (recordId: number) => {
    setVerifyingId(recordId);
    try {
      const updated = await api.verifyEvidence(recordId);
      setRecords((current) =>
        current.map((record) => (record.id === recordId ? { ...record, ...updated } : record)),
      );
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Could not verify this evidence record.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Evidence Audit</Text>
          <Text style={styles.subtitle}>{activeAsset?.name || 'All registered assets'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading evidence chain...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadEvidence(true)} tintColor="#2563EB" />
          }
        >
          <View style={styles.summaryBand}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>{records.length}</Text>
              <Text style={styles.metricLabel}>Records</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>{chainHealth}%</Text>
              <Text style={styles.metricLabel}>Verified</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricValue}>{userProfile?.reliability_score ?? 0}</Text>
              <Text style={styles.metricLabel}>Score</Text>
            </View>
          </View>

          <View style={styles.statusPanel}>
            <View
              style={[
                styles.statusIcon,
                records.length && chainStatus.valid
                  ? styles.statusIconValid
                  : records.length
                    ? styles.statusIconWarning
                    : null,
              ]}
            >
              <Ionicons
                name={
                  !records.length
                    ? 'shield-outline'
                    : chainStatus.valid
                      ? 'shield-checkmark'
                      : 'alert-circle'
                }
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>
                {!records.length
                  ? 'No Evidence Yet'
                  : verifyingChain
                    ? 'Verifying Chain…'
                    : chainStatus.valid
                      ? 'Chain Intact'
                      : 'Tampering Detected'}
              </Text>
              <Text style={styles.statusText}>
                {!records.length
                  ? 'Upload job, lease, delivery, inspection, or payment evidence to start the chain.'
                  : verifyingChain
                    ? 'Recomputing SHA-256 hashes for every block in this asset\'s custody chain.'
                    : chainStatus.valid
                      ? `${chainStatus.checked} of ${chainStatus.checked} hashes recomputed client-side. Every block links to the previous one.`
                      : `${chainStatus.brokenIds.length} block(s) failed hash or linkage verification. Chain custody cannot be trusted.`}
              </Text>
            </View>
          </View>

          {records.map((record, index) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <View>
                  <Text style={styles.recordType}>{(record.evidence_type || 'other').replace(/_/g, ' ')}</Text>
                  <Text style={styles.recordAsset}>{record.asset_name || `Asset ${record.asset}`}</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.verifyBadge,
                      brokenSet.has(record.id) || !record.curr_hash
                        ? styles.verifyBadgeBroken
                        : styles.verifyBadgeValid,
                    ]}
                  >
                    <Ionicons
                      name={
                        brokenSet.has(record.id) || !record.curr_hash
                          ? 'alert-circle-outline'
                          : 'shield-checkmark'
                      }
                      size={14}
                      color={
                        brokenSet.has(record.id) || !record.curr_hash
                          ? '#b3261e'
                          : '#2563EB'
                      }
                    />
                    <Text
                      style={
                        brokenSet.has(record.id) || !record.curr_hash
                          ? styles.verifyTextBroken
                          : styles.verifyTextValid
                      }
                    >
                      {brokenSet.has(record.id) || !record.curr_hash
                        ? 'Hash Mismatch'
                        : 'Hash OK'}
                    </Text>
                  </View>
                  <View style={[styles.verifyBadge, record.is_verified ? styles.verifyBadgeValid : styles.verifyBadgeOpen]}>
                    <Ionicons
                      name={record.is_verified ? 'checkmark-circle' : 'time-outline'}
                      size={14}
                      color={record.is_verified ? '#2563EB' : '#9a6b00'}
                    />
                    <Text style={record.is_verified ? styles.verifyTextValid : styles.verifyTextOpen}>
                      {record.is_verified ? 'Verified' : 'Open'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.description}>{record.description || 'No description supplied.'}</Text>

              <View style={styles.hashGrid}>
                <View style={styles.hashCell}>
                  <Text style={styles.hashLabel}>Previous Hash</Text>
                  <Text style={styles.hashValue}>{shortHash(record.prev_hash)}</Text>
                </View>
                <View style={styles.hashCell}>
                  <Text style={styles.hashLabel}>Current Hash</Text>
                  <Text style={styles.hashValue}>{shortHash(record.curr_hash)}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={15} color="#64748B" />
                  <Text style={styles.metaText}>{formatDate(record.timestamp || record.created_at)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <Text style={styles.metaText}>{record.gps_coordinates || 'GPS not attached'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={15} color="#64748B" />
                  <Text style={styles.metaText}>{record.user_email || 'Unknown uploader'}</Text>
                </View>
              </View>

              <View style={styles.chainRow}>
                <View style={styles.chainDot}>
                  <Text style={styles.chainIndex}>{index + 1}</Text>
                </View>
                <View style={styles.chainLine} />
                <Text style={styles.chainCopy}>
                  {record.prev_hash ? 'Linked to previous evidence block' : 'Genesis evidence block'}
                </Text>
              </View>

              {!record.is_verified && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => handleVerify(record.id)}
                  disabled={verifyingId === record.id}
                >
                  {verifyingId === record.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.verifyButtonText}>Digitally Verify</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#2563EB', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  summaryBand: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 14,
  },
  summaryMetric: { flex: 1, alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  metricLabel: { color: '#E2E8F0', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 3 },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235,0.12)',
    marginBottom: 14,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusIconValid: { backgroundColor: '#2563EB' },
  statusIconWarning: { backgroundColor: '#b3261e' },
  statusTextWrap: { flex: 1 },
  statusTitle: { color: '#1E293B', fontSize: 15, fontWeight: '800' },
  statusText: { color: '#64748B', fontSize: 12, lineHeight: 17, marginTop: 3 },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235,0.12)',
  },
  recordTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  recordType: { fontSize: 16, fontWeight: '800', color: '#1E293B', textTransform: 'capitalize' },
  recordAsset: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  verifyBadgeValid: { backgroundColor: '#F8FAFC' },
  verifyBadgeOpen: { backgroundColor: '#fff8e1' },
  verifyBadgeBroken: { backgroundColor: '#fdecea' },
  verifyTextValid: { color: '#2563EB', fontSize: 11, fontWeight: '800' },
  verifyTextOpen: { color: '#9a6b00', fontSize: 11, fontWeight: '800' },
  verifyTextBroken: { color: '#b3261e', fontSize: 11, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  description: { color: '#263b28', fontSize: 13, lineHeight: 19, marginTop: 12 },
  hashGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  hashCell: { flex: 1, backgroundColor: '#f4f8f5', borderRadius: 8, padding: 10 },
  hashLabel: { color: '#6b8c70', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  hashValue: { color: '#1E293B', fontSize: 12, fontWeight: '700' },
  metaGrid: { gap: 7, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { color: '#64748B', fontSize: 12, flex: 1 },
  chainRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  chainDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIndex: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  chainLine: { width: 26, height: 2, backgroundColor: '#a5d6a7', marginHorizontal: 8 },
  chainCopy: { color: '#64748B', fontSize: 12, fontWeight: '600', flex: 1 },
  verifyButton: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  verifyButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
