import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { api } from '../../../services/api';

const DOC_TYPE_OPTIONS = [
  { value: 'lease', label: 'Lease', icon: 'document-text-outline' },
  { value: 'receipt', label: 'Receipt', icon: 'receipt-outline' },
  { value: 'contract', label: 'Contract', icon: 'reader-outline' },
  { value: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' },
  { value: 'warranty', label: 'Warranty', icon: 'ribbon-outline' },
  { value: 'photo', label: 'Photo', icon: 'image-outline' },
  { value: 'report', label: 'Report', icon: 'analytics-outline' },
  { value: 'other', label: 'Other', icon: 'attach-outline' },
];

const TYPE_COLORS: Record<string, string> = {
  lease: '#EC4899',
  receipt: '#22C55E',
  contract: '#2563EB',
  insurance: '#8B5CF6',
  warranty: '#F59E0B',
  photo: '#06B6D4',
  report: '#0D9488',
  other: '#64748B',
};

export default function PropertyDocumentsScreen() {
  const router = useRouter();
  const { assetId, assetName } = useLocalSearchParams<{
    assetId: string;
    assetName: string;
  }>();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDocType, setNewDocType] = useState('other');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.getPropertyDocuments(assetId);
      setDocuments(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      console.warn('Failed to load documents:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const filteredDocs =
    filter === 'all'
      ? documents
      : documents.filter((d) => d.document_type === filter);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err: any) {
      console.warn('Document picker error:', err.message);
    }
  };

  const handleUpload = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a document title.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('asset', String(assetId));
      formData.append('title', newTitle.trim());
      formData.append('document_type', newDocType);
      formData.append('description', newDescription.trim());
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || 'document',
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      await api.createPropertyDocument(formData);
      setUploadModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewDocType('other');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (doc: any) => {
    Alert.alert('Delete Document', `Remove "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePropertyDocument(doc.id);
            fetchDocuments();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Documents</Text>
          {assetName && <Text style={styles.headerSubtitle}>{assetName}</Text>}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setUploadModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All ({documents.length})
            </Text>
          </TouchableOpacity>
          {DOC_TYPE_OPTIONS.map((opt) => {
            const count = documents.filter((d) => d.document_type === opt.value).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
                onPress={() => setFilter(opt.value)}
              >
                <Text style={[styles.filterChipText, filter === opt.value && styles.filterChipTextActive]}>
                  {opt.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No documents</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Tap + to upload a document for this property'
                : `No ${filter} documents found`}
            </Text>
          </View>
        ) : (
          filteredDocs.map((doc) => {
            const typeColor = TYPE_COLORS[doc.document_type] || TYPE_COLORS.other;
            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docIcon}>
                  <Ionicons name="document-outline" size={24} color={typeColor} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                  <View style={styles.docMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                      <Text style={[styles.typeText, { color: typeColor }]}>
                        {doc.document_type}
                      </Text>
                    </View>
                    <Text style={styles.docDate}>{formatDate(doc.created_at)}</Text>
                  </View>
                  {doc.description ? (
                    <Text style={styles.docDescription} numberOfLines={1}>{doc.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(doc)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select File</Text>
                <TouchableOpacity
                  style={styles.filePicker}
                  onPress={pickFile}
                >
                  <Ionicons
                    name={selectedFile ? 'checkmark-circle' : 'cloud-upload-outline'}
                    size={32}
                    color={selectedFile ? '#22C55E' : '#94A3B8'}
                  />
                  <Text style={styles.filePickerText}>
                    {selectedFile ? selectedFile.name : 'Tap to select a file'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Document Title</Text>
                <TextInput
                  style={styles.formInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Lease Agreement 2026"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Document Type</Text>
                <View style={styles.typeRow}>
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.typeOption,
                        newDocType === opt.value && {
                          backgroundColor: TYPE_COLORS[opt.value] + '18',
                          borderColor: TYPE_COLORS[opt.value],
                        },
                      ]}
                      onPress={() => setNewDocType(opt.value)}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={16}
                        color={newDocType === opt.value ? TYPE_COLORS[opt.value] : '#94A3B8'}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          newDocType === opt.value && { color: TYPE_COLORS[opt.value] },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Add notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, uploading && { opacity: 0.6 }]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Upload Document</Text>
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
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  addButton: {
    backgroundColor: '#2563EB', borderRadius: 20, width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },

  filterRow: { backgroundColor: '#fff', paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#2563EB' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#fff' },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  docCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  docDate: { fontSize: 11, color: '#94A3B8' },
  docDescription: { fontSize: 12, color: '#64748B', marginTop: 4 },
  deleteBtn: { padding: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  formSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1E293B',
  },

  filePicker: {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0',
    borderStyle: 'dashed', paddingVertical: 24, alignItems: 'center', gap: 8,
  },
  filePickerText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  typeOptionText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  submitButton: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
