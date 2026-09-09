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

export default function SiteManagementScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{ assetId: string; assetName: string }>();

  const [activeTab, setActiveTab] = useState<'diary' | 'attendance' | 'cameras'>('diary');
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [diaryModalVisible, setDiaryModalVisible] = useState(false);
  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [diaryNotes, setDiaryNotes] = useState('');
  const [diaryWeather, setDiaryWeather] = useState('');
  const [diaryWorkers, setDiaryWorkers] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [diaryData, attData, camData] = await Promise.all([
        api.getSiteDiary().catch(() => []),
        api.getLaborAttendance().catch(() => []),
        api.getSiteCameras().catch(() => []),
      ]);
      setDiaryEntries(Array.isArray(diaryData) ? diaryData : diaryData?.results || []);
      setAttendance(Array.isArray(attData) ? attData : attData?.results || []);
      setCameras(Array.isArray(camData) ? camData : camData?.results || []);
    } catch (err: any) {
      console.warn('Site load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCreateDiary = async () => {
    if (!diaryNotes.trim()) {
      Alert.alert('Required', 'Enter diary notes.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createSiteDiary({
        site: parseInt(assetId),
        entry_date: diaryDate,
        notes: diaryNotes.trim(),
        weather: diaryWeather.trim(),
        workers_count: parseInt(diaryWorkers) || 0,
      });
      setDiaryModalVisible(false);
      setDiaryNotes(''); setDiaryWeather(''); setDiaryWorkers('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create diary entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#22C55E';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'half_day': return '#8B5CF6';
      default: return '#94A3B8';
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Management</Text>
        <TouchableOpacity onPress={() => {
          if (activeTab === 'diary') setDiaryModalVisible(true);
        }}>
          <Ionicons name="add-circle" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['diary', 'attendance', 'cameras'] as const).map((tab) => {
          const labels: Record<string, string> = { diary: 'Diary', attendance: 'Attendance', cameras: 'Cameras' };
          const icons: Record<string, string> = { diary: 'book-outline', attendance: 'people-outline', cameras: 'camera-outline' };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons name={icons[tab] as any} size={16} color={activeTab === tab ? '#2563EB' : '#94A3B8'} />
              <Text style={[styles.tabText, activeTab === tab && { color: '#2563EB' }]}>{labels[tab]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Diary Tab */}
        {activeTab === 'diary' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Site Diary ({diaryEntries.length})</Text>
            {diaryEntries.length === 0 ? (
              <Text style={styles.emptyText}>No diary entries yet.</Text>
            ) : (
              diaryEntries.map((entry: any) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{entry.entry_date}</Text>
                    {entry.weather ? (
                      <View style={styles.weatherBadge}>
                        <Text style={styles.weatherText}>{entry.weather}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.entryNotes} numberOfLines={3}>{entry.notes}</Text>
                  <View style={styles.entryMeta}>
                    {entry.workers_count > 0 && (
                      <Text style={styles.entryMetaText}>
                        <Ionicons name="people-outline" size={12} /> {entry.workers_count} workers
                      </Text>
                    )}
                    <Text style={styles.entryMetaText}>by {entry.user_email || 'Unknown'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attendance ({attendance.length})</Text>
            {attendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records.</Text>
            ) : (
              attendance.map((att: any) => (
                <View key={att.id} style={styles.attCard}>
                  <View style={[styles.attDot, { backgroundColor: getStatusColor(att.status) }]} />
                  <View style={styles.attInfo}>
                    <Text style={styles.attName}>{att.worker_email || 'Worker'}</Text>
                    <Text style={styles.attMeta}>
                      {att.status} · {att.hours_worked}h · {att.check_in_time?.slice(11, 16) || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.attWage, { color: getStatusColor(att.status) }]}>
                    UGX {Number(att.daily_wage || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Cameras Tab */}
        {activeTab === 'cameras' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Site Cameras ({cameras.length})</Text>
            {cameras.length === 0 ? (
              <Text style={styles.emptyText}>No camera snapshots.</Text>
            ) : (
              cameras.map((cam: any) => (
                <View key={cam.id} style={styles.camCard}>
                  <View style={styles.camIcon}>
                    <Ionicons name="camera" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.camInfo}>
                    <Text style={styles.camName}>{cam.camera_name}</Text>
                    <Text style={styles.camMeta}>{cam.timestamp?.slice(0, 16) || '—'}</Text>
                    {cam.frame_description ? (
                      <Text style={styles.camDesc} numberOfLines={2}>{cam.frame_description}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Diary Modal */}
      <Modal visible={diaryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Diary Entry</Text>
              <TouchableOpacity onPress={() => setDiaryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput style={styles.formInput} value={diaryDate} onChangeText={setDiaryDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Notes *</Text>
                <TextInput style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]} value={diaryNotes} onChangeText={setDiaryNotes} placeholder="What happened on site today?" placeholderTextColor="#94A3B8" multiline />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Weather</Text>
                <TextInput style={styles.formInput} value={diaryWeather} onChangeText={setDiaryWeather} placeholder="e.g. Sunny, Rainy" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Workers on Site</Text>
                <TextInput style={styles.formInput} value={diaryWorkers} onChangeText={setDiaryWorkers} placeholder="e.g. 12" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <TouchableOpacity style={[styles.submitButton, actionLoading && { opacity: 0.6 }]} onPress={handleCreateDiary} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Save Entry</Text>}
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

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 12, paddingHorizontal: 16, marginRight: 8,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },

  sectionCard: {
    backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingVertical: 24 },

  entryCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  entryDate: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  weatherBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  weatherText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  entryNotes: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  entryMetaText: { fontSize: 11, color: '#94A3B8' },

  attCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  attDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  attInfo: { flex: 1 },
  attName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  attMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' },
  attWage: { fontSize: 12, fontWeight: '700' },

  camCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  camIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  camInfo: { flex: 1 },
  camName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  camMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  camDesc: { fontSize: 12, color: '#64748B', marginTop: 4 },

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
  submitButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
