import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const JOB_STEPS = [
  { key: 'requested', label: 'Requested', icon: 'document-text-outline' },
  { key: 'inspection', label: 'Inspection', icon: 'search-outline' },
  { key: 'quotation', label: 'Quotation', icon: 'receipt-outline' },
  { key: 'approval', label: 'Approval', icon: 'checkmark-circle-outline' },
  { key: 'materials', label: 'Materials', icon: 'cube-outline' },
  { key: 'work_started', label: 'Work Started', icon: 'hammer-outline' },
  { key: 'milestone', label: 'Milestone', icon: 'flag-outline' },
  { key: 'final_inspection', label: 'Final Inspection', icon: 'clipboard-check-outline' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-circle-outline' },
  { key: 'payment_released', label: 'Payment Released', icon: 'wallet-outline' },
  { key: 'closed', label: 'Closed', icon: 'lock-closed-outline' },
];

const STEP_STATUS_COLORS: Record<string, string> = {
  pending: '#E2E8F0',
  in_progress: '#F59E0B',
  completed: '#22C55E',
  skipped: '#CBD5E1',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#2563EB',
  in_progress: '#0D9488',
  completed: '#22C55E',
  cancelled: '#EF4444',
  disputed: '#EF4444',
};

export default function JobTrackingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { userProfile } = useApp();
  const [booking, setBooking] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [bookingData, stepsData] = await Promise.all([
        api.getBookings(),
        api.getJobSteps(bookingId!),
      ]);
      const found = Array.isArray(bookingData)
        ? bookingData.find((b: any) => String(b.id) === String(bookingId))
        : bookingData;
      setBooking(found);
      const stepsArr = Array.isArray(stepsData) ? stepsData : stepsData.results || [];
      setSteps(stepsArr.sort((a: any, b: any) => a.step - b.step));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const isCustomer = booking?.customer_email === userProfile?.email;
  const isProvider = booking?.pro_user_email === userProfile?.email;

  const handleStartStep = async (stepId: number) => {
    Alert.alert('Start Step', 'Mark this step as in progress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.startJobStep(stepId);
            await fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCompleteStep = async (stepId: number) => {
    Alert.alert('Complete Step', 'Mark this step as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.completeJobStep(stepId);
            await fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleBookingAction = async (
    action: 'confirm' | 'start' | 'complete' | 'cancel',
  ) => {
    const messages: Record<string, string> = {
      confirm: 'Confirm this booking?',
      start: 'Start work on this booking?',
      complete: 'Mark this booking as completed?',
      cancel: 'Cancel this booking?',
    };
    Alert.alert(action.charAt(0).toUpperCase() + action.slice(1), messages[action], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        style: action === 'cancel' ? 'destructive' : 'default',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.advanceBookingStep(bookingId!, action);
            await fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Booking not found.</Text>
      </View>
    );
  }

  const currentStepIndex = JOB_STEPS.findIndex(
    (s) => s.key === booking.current_step,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingCard}>
          <View style={styles.bookingTopRow}>
            <Text style={styles.bookingId}>Booking #{booking.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: (BOOKING_STATUS_COLORS[booking.status] || '#64748B') + '20' }]}>
              <Text style={[styles.statusText, { color: BOOKING_STATUS_COLORS[booking.status] || '#64748B' }]}>
                {booking.status?.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.bookingService}>{booking.service_name || booking.category_name || 'Service'}</Text>
          <Text style={styles.bookingPrice}>UGX {Number(booking.price || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Job Lifecycle</Text>

        <View style={styles.stepsCard}>
          {JOB_STEPS.map((stepDef, idx) => {
            const stepData = steps.find((s: any) => s.step === stepDef.key);
            const stepStatus = stepData?.status || 'pending';
            const isCurrent = stepDef.key === booking.current_step;
            const color = STEP_STATUS_COLORS[stepStatus] || '#E2E8F0';

            return (
              <View key={stepDef.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, { backgroundColor: color }, isCurrent && styles.stepDotCurrent]}>
                    {stepStatus === 'completed' && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                    {stepStatus === 'in_progress' && (
                      <View style={styles.inProgressDot} />
                    )}
                  </View>
                  {idx < JOB_STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: stepStatus === 'completed' ? '#22C55E' : '#E2E8F0' }]} />
                  )}
                </View>
                <View style={[styles.stepContent, isCurrent && styles.stepContentCurrent]}>
                  <View style={styles.stepTopRow}>
                    <Ionicons name={stepDef.icon as any} size={18} color={isCurrent ? '#2563EB' : '#64748B'} />
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                      {stepDef.label}
                    </Text>
                  </View>
                  {stepData?.started_at && (
                    <Text style={styles.stepTime}>
                      Started: {new Date(stepData.started_at).toLocaleDateString()}
                    </Text>
                  )}
                  {stepData?.completed_at && (
                    <Text style={styles.stepTime}>
                      Done: {new Date(stepData.completed_at).toLocaleDateString()}
                    </Text>
                  )}
                  {stepData?.notes ? (
                    <Text style={styles.stepNotes}>{stepData.notes}</Text>
                  ) : null}
                  {isProvider && stepStatus === 'pending' && isCurrent && (
                    <TouchableOpacity
                      style={styles.stepAction}
                      onPress={() => handleStartStep(stepData.id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.stepActionText}>Start</Text>
                    </TouchableOpacity>
                  )}
                  {isProvider && stepStatus === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.stepAction, { backgroundColor: '#22C55E' }]}
                      onPress={() => handleCompleteStep(stepData.id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.stepActionText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {isProvider && booking.status === 'pending' && (
          <TouchableOpacity
            style={styles.bookingActionBtn}
            onPress={() => handleBookingAction('confirm')}
            disabled={actionLoading}
          >
            <Text style={styles.bookingActionText}>Confirm Booking</Text>
          </TouchableOpacity>
        )}

        {isProvider && booking.status === 'confirmed' && (
          <TouchableOpacity
            style={styles.bookingActionBtn}
            onPress={() => handleBookingAction('start')}
            disabled={actionLoading}
          >
            <Text style={styles.bookingActionText}>Start Work</Text>
          </TouchableOpacity>
        )}

        {isCustomer && booking.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.bookingActionBtn, { backgroundColor: '#22C55E' }]}
            onPress={() => handleBookingAction('complete')}
            disabled={actionLoading}
          >
            <Text style={styles.bookingActionText}>Confirm Completion</Text>
          </TouchableOpacity>
        )}

        {!booking.quotation && isProvider && booking.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.quoteBtn}
            onPress={() => router.push(`/quotation/create?bookingId=${booking.id}`)}
          >
            <Ionicons name="create-outline" size={20} color="#2563EB" />
            <Text style={styles.quoteBtnText}>Create Quotation</Text>
          </TouchableOpacity>
        )}

        {booking.quotation && (
          <TouchableOpacity
            style={styles.quoteBtn}
            onPress={() => router.push(`/quotation/${booking.quotation}`)}
          >
            <Ionicons name="receipt-outline" size={20} color="#2563EB" />
            <Text style={styles.quoteBtnText}>View Quotation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  bookingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  bookingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingId: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingService: { fontSize: 15, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  bookingPrice: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  stepsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  stepRow: { flexDirection: 'row', marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 32, marginRight: 12 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  stepDotCurrent: { borderColor: '#2563EB', borderWidth: 3 },
  inProgressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  stepLine: { width: 2, flex: 1, minHeight: 20 },
  stepContent: { flex: 1, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  stepContentCurrent: { backgroundColor: '#EFF6FF', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8, paddingBottom: 12 },
  stepTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  stepLabelCurrent: { color: '#2563EB', fontWeight: '700' },
  stepTime: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  stepNotes: { fontSize: 12, color: '#64748B', marginTop: 4, fontStyle: 'italic' },
  stepAction: {
    alignSelf: 'flex-start', backgroundColor: '#2563EB', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8, marginTop: 8,
  },
  stepActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bookingActionBtn: {
    backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 12,
  },
  bookingActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  quoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#2563EB',
    marginBottom: 24, gap: 8,
  },
  quoteBtnText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
});
