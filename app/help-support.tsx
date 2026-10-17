import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

interface FeedbackMessage {
  id: number;
  author: number | null;
  author_email?: string | null;
  body: string;
  is_staff_reply: boolean;
  created_at: string;
}

interface FeedbackThread {
  id: number;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  order_number?: string;
  asset_name?: string | null;
  messages: FeedbackMessage[];
  resolved_at?: string | null;
  created_at: string;
}

interface FeedbackSummary {
  total: number;
  open: number;
  resolved: number;
  average_rating: number | null;
  rated_count: number;
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'maintenance', label: 'Maintenance Issue' },
  { value: 'compliment', label: 'Compliment' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#F59E0B',
  in_review: '#2563EB',
  resolved: '#22C55E',
  closed: '#64748B',
};

const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { activeAsset } = useApp();

  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('service_quality');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [orderNumber, setOrderNumber] = useState('');

  const [selected, setSelected] = useState<FeedbackThread | null>(null);
  const [reply, setReply] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [list, stats] = await Promise.all([
        api.getFeedback(),
        api.getFeedbackSummary(),
      ]);
      setThreads(Array.isArray(list) ? list : list?.results || []);
      setSummary(stats);
    } catch (error: any) {
      console.warn('Failed to load feedback:', error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setCategory('service_quality');
    setSubject('');
    setMessage('');
    setRating(0);
    setOrderNumber('');
  };

  const submitFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Add a subject and a message.');
      return;
    }
    setSaving(true);
    try {
      await api.createFeedback({
        category,
        subject: subject.trim(),
        message: message.trim(),
        ...(rating ? { rating } : {}),
        ...(orderNumber.trim() ? { order_number: orderNumber.trim() } : {}),
        ...(activeAsset?.backendId ? { asset: activeAsset.backendId } : {}),
      });
      Alert.alert('Submitted', 'Thank you. Your feedback has been received.');
      resetForm();
      setShowForm(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Could not submit feedback.');
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try {
      const updated = await api.replyToFeedback(selected.id, reply.trim());
      setSelected(updated);
      setReply('');
      loadData();
    } catch (error: any) {
      Alert.alert('Failed', error?.message || 'Could not send your message.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (action: 'resolve' | 'close' | 'reopen') => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated =
        action === 'resolve'
          ? await api.resolveFeedback(selected.id)
          : action === 'close'
          ? await api.closeFeedback(selected.id)
          : await api.reopenFeedback(selected.id);
      setSelected(updated);
      loadData();
    } catch (error: any) {
      Alert.alert('Failed', error?.message || `Could not ${action} thread.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Send feedback and track past requests</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {summary && (
          <View style={styles.summaryBand}>
            <Metric value={summary.total} label="Total" />
            <Metric value={summary.open} label="Open" />
            <Metric value={summary.resolved} label="Resolved" />
            <Metric
              value={
                summary.average_rating != null
                  ? summary.average_rating.toFixed(1)
                  : '—'
              }
              label="Avg rating"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowForm((v) => !v)}
        >
          <Ionicons
            name={showForm ? 'close' : 'chatbubble-ellipses-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.primaryButtonText}>
            {showForm ? 'Cancel' : 'New Feedback'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const active = c.value === category;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short summary"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what happened..."
              style={[styles.input, styles.largeInput]}
              multiline
            />

            <Text style={styles.inputLabel}>Related order (optional)</Text>
            <TextInput
              value={orderNumber}
              onChangeText={setOrderNumber}
              placeholder="HB-GRC-261017-0001"
              autoCapitalize="characters"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Rating (optional)</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star === rating ? 0 : star)}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={submitFeedback}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionLabel}>History ({threads.length})</Text>

        {loading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
        ) : threads.length === 0 ? (
          <Text style={styles.emptyText}>No feedback submitted yet.</Text>
        ) : (
          threads.map((thread) => (
            <TouchableOpacity
              key={thread.id}
              style={styles.itemCard}
              onPress={() => setSelected(thread)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {thread.subject}
                </Text>
                <Text
                  style={[
                    styles.itemBadge,
                    { color: STATUS_COLORS[thread.status] || '#2563EB' },
                  ]}
                >
                  {thread.status.replace('_', ' ')}
                </Text>
              </View>
              <Text style={styles.itemMeta}>{categoryLabel(thread.category)}</Text>
              {thread.order_number ? (
                <Text style={styles.orderNumber}>
                  Order: {thread.order_number}
                </Text>
              ) : null}
              <Text style={styles.itemMeta} numberOfLines={2}>
                {thread.message}
              </Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemMeta}>
                  {formatDate(thread.created_at)}
                </Text>
                <View style={styles.replyCount}>
                  <Ionicons name="chatbubbles-outline" size={14} color="#64748B" />
                  <Text style={styles.itemMeta}>{thread.messages?.length || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selected?.subject}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.threadScroll}>
              {(selected?.messages || []).map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubble,
                    msg.is_staff_reply ? styles.staffBubble : styles.userBubble,
                  ]}
                >
                  <Text style={styles.bubbleAuthor}>
                    {msg.is_staff_reply
                      ? 'Support'
                      : msg.author_email || 'You'}
                  </Text>
                  <Text style={styles.bubbleBody}>{msg.body}</Text>
                  <Text style={styles.bubbleTime}>
                    {formatDate(msg.created_at)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.replyRow}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder="Write a message..."
                style={styles.replyInput}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendReply}
                disabled={saving || !reply.trim()}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              {selected?.status !== 'resolved' && selected?.status !== 'closed' ? (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => changeStatus('resolve')}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Mark Resolved</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => changeStatus('reopen')}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Reopen</Text>
                </TouchableOpacity>
              )}
              {selected?.status !== 'closed' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => changeStatus('close')}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              )}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  summaryBand: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 14,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  metricLabel: {
    color: '#c8e6c9',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 46,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  inputLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    minHeight: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 14,
  },
  largeInput: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#2563EB', fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  saveButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sectionLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.08)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  itemTitle: { color: '#1E293B', fontSize: 15, fontWeight: '800', flex: 1 },
  itemBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  itemMeta: { color: '#64748B', fontSize: 12, lineHeight: 17 },
  orderNumber: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  replyCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: { color: '#1E293B', fontSize: 18, fontWeight: '800', flex: 1 },
  threadScroll: { maxHeight: 320, marginBottom: 12 },
  bubble: { borderRadius: 10, padding: 10, marginBottom: 8, maxWidth: '88%' },
  userBubble: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start' },
  staffBubble: { backgroundColor: '#DBEAFE', alignSelf: 'flex-end' },
  bubbleAuthor: { fontSize: 11, fontWeight: '800', color: '#475569' },
  bubbleBody: { fontSize: 13, color: '#1E293B', marginTop: 2 },
  bubbleTime: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  replyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    color: '#1E293B',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#2563EB', fontWeight: '800' },
});
