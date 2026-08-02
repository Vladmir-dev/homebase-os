import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type Panel = 'symptoms' | 'pharmacy' | 'doctors' | 'sos';

const SYMPTOM_OPTIONS = ['fever', 'cough', 'headache', 'chest_pain', 'bleeding', 'malaria'];

export default function HealthServicesScreen() {
  const router = useRouter();
  const { activeAsset, userProfile } = useApp();
  const [activePanel, setActivePanel] = useState<Panel>('symptoms');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['fever']);
  const [symptomResult, setSymptomResult] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [location, setLocation] = useState(activeAsset?.location || 'Kampala');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pharmacyData, medicineData, doctorData, bookingData] = await Promise.all([
        api.getPharmacies().catch(() => []),
        api.getMedicines().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getHealthBookings(userProfile?.id).catch(() => []),
      ]);
      setPharmacies(Array.isArray(pharmacyData) ? pharmacyData : []);
      setMedicines(Array.isArray(medicineData) ? medicineData : []);
      setDoctors(Array.isArray(doctorData) ? doctorData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.id]);

  const severity = useMemo(() => {
    const order = ['low', 'medium', 'high', 'emergency'];
    return symptomResult.reduce((highest, item) => {
      return order.indexOf(item.severity) > order.indexOf(highest) ? item.severity : highest;
    }, 'low');
  }, [symptomResult]);

  const severityStyle = {
    low: styles.severity_low,
    medium: styles.severity_medium,
    high: styles.severity_high,
    emergency: styles.severity_emergency,
  }[severity as 'low' | 'medium' | 'high' | 'emergency'];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    );
  };

  const checkSymptoms = async () => {
    if (!selectedSymptoms.length) {
      Alert.alert('Select Symptoms', 'Choose at least one symptom.');
      return;
    }
    setBusyAction('symptoms');
    try {
      const result = await api.checkSymptoms(selectedSymptoms);
      setSymptomResult(Array.isArray(result.results) ? result.results : []);
    } catch (error: any) {
      Alert.alert('Check Failed', error.message || 'Could not check symptoms.');
    } finally {
      setBusyAction(null);
    }
  };

  const bookDoctor = async (doctor: any) => {
    setBusyAction(`doctor-${doctor.id}`);
    try {
      await api.createHealthBooking({
        doctor: doctor.id,
        booking_type: 'consultation',
        scheduled_time: new Date(Date.now() + 86400000).toISOString(),
        symptoms: selectedSymptoms.join(', '),
        notes: 'Booked from Homebase OS health services',
      });
      Alert.alert('Booking Created', 'Doctor consultation ticket has been created.');
      loadData();
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Could not book this doctor.');
    } finally {
      setBusyAction(null);
    }
  };

  const orderMedicine = async (medicine: any) => {
    setBusyAction(`medicine-${medicine.id}`);
    try {
      await api.createHealthBooking({
        pharmacy: medicine.pharmacy,
        booking_type: 'prescription',
        symptoms: selectedSymptoms.join(', '),
        notes: `Medicine delivery request: ${medicine.name}`,
      });
      Alert.alert('Order Created', 'Medicine delivery request has been submitted.');
      loadData();
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Could not request medicine delivery.');
    } finally {
      setBusyAction(null);
    }
  };

  const requestAmbulance = async () => {
    setBusyAction('ambulance');
    try {
      await api.requestAmbulance({
        location,
        notes: `Emergency request from ${userProfile?.email || 'Homebase user'}`,
      });
      Alert.alert('SOS Requested', 'Nearest ambulance dispatch has been requested.');
    } catch (error: any) {
      Alert.alert('SOS Failed', error.message || 'Could not request ambulance dispatch.');
    } finally {
      setBusyAction(null);
    }
  };

  const panels: Array<{ id: Panel; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'symptoms', label: 'Check', icon: 'pulse-outline' },
    { id: 'pharmacy', label: 'Meds', icon: 'medical-outline' },
    { id: 'doctors', label: 'Doctor', icon: 'person-circle-outline' },
    { id: 'sos', label: 'SOS', icon: 'alert-circle-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1b5e20" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Health Services</Text>
          <Text style={styles.subtitle}>{activeAsset?.location || 'Medical support'}</Text>
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
          <Text style={styles.loadingText}>Syncing health network...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activePanel === 'symptoms' && (
            <View>
              <View style={[styles.severityBand, severityStyle]}>
                <Text style={styles.severityLabel}>Current Triage</Text>
                <Text style={styles.severityValue}>{severity.toUpperCase()}</Text>
              </View>
              <View style={styles.symptomGrid}>
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom}
                    style={[styles.symptomChip, selectedSymptoms.includes(symptom) && styles.symptomChipActive]}
                    onPress={() => toggleSymptom(symptom)}
                  >
                    <Text style={selectedSymptoms.includes(symptom) ? styles.symptomTextActive : styles.symptomText}>
                      {symptom.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={checkSymptoms} disabled={busyAction === 'symptoms'}>
                {busyAction === 'symptoms' ? <ActivityIndicator color="#fff" /> : <Ionicons name="pulse-outline" size={17} color="#fff" />}
                <Text style={styles.primaryButtonText}>Run Symptom Check</Text>
              </TouchableOpacity>
              {symptomResult.map((result) => (
                <View key={result.symptom} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{result.symptom.replace(/_/g, ' ')}</Text>
                    <Text style={styles.itemBadge}>{result.severity}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{result.recommendation}</Text>
                </View>
              ))}
            </View>
          )}

          {activePanel === 'pharmacy' && (
            <View>
              <Text style={styles.sectionTitle}>Nearby Pharmacies ({pharmacies.length})</Text>
              {medicines.slice(0, 8).map((medicine) => (
                <View key={medicine.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{medicine.name}</Text>
                    <Text style={styles.itemBadge}>UGX {Number(medicine.price || 0).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{medicine.pharmacy_name} | Stock {medicine.quantity}</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => orderMedicine(medicine)} disabled={busyAction === `medicine-${medicine.id}`}>
                    {busyAction === `medicine-${medicine.id}` ? <ActivityIndicator color="#2e7d32" /> : <Text style={styles.secondaryButtonText}>Request Delivery</Text>}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activePanel === 'doctors' && (
            <View>
              {doctors.map((doctor) => (
                <View key={doctor.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{doctor.user_name || doctor.user_email}</Text>
                    <Text style={styles.itemBadge}>{doctor.available ? 'Available' : 'Offline'}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{doctor.specialization} | UGX {Number(doctor.consultation_fee || 0).toLocaleString()}</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => bookDoctor(doctor)} disabled={!doctor.available || busyAction === `doctor-${doctor.id}`}>
                    {busyAction === `doctor-${doctor.id}` ? <ActivityIndicator color="#2e7d32" /> : <Text style={styles.secondaryButtonText}>Book QR Ticket</Text>}
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.sectionTitle}>My Tickets ({bookings.length})</Text>
              {bookings.slice(0, 3).map((booking) => (
                <View key={booking.id} style={styles.ticketCard}>
                  <Ionicons name="qr-code-outline" size={30} color="#2e7d32" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{booking.booking_type}</Text>
                    <Text style={styles.itemMeta}>{booking.status} | Ticket HBH-{booking.id}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activePanel === 'sos' && (
            <View>
              <View style={styles.sosPanel}>
                <Ionicons name="alert-circle-outline" size={40} color="#fff" />
                <Text style={styles.sosTitle}>Emergency Dispatch</Text>
                <Text style={styles.sosText}>Creates an ambulance dispatch request for the current household location.</Text>
              </View>
              <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Emergency location" />
              <TouchableOpacity style={styles.sosButton} onPress={requestAmbulance} disabled={busyAction === 'ambulance'}>
                {busyAction === 'ambulance' ? <ActivityIndicator color="#fff" /> : <Ionicons name="call-outline" size={19} color="#fff" />}
                <Text style={styles.sosButtonText}>Request Ambulance SOS</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
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
  severityBand: { borderRadius: 8, padding: 16, marginBottom: 14 },
  severity_low: { backgroundColor: '#2e7d32' },
  severity_medium: { backgroundColor: '#b26a00' },
  severity_high: { backgroundColor: '#c62828' },
  severity_emergency: { backgroundColor: '#7b1b1b' },
  severityLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  severityValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 3 },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  symptomChip: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(46,125,50,0.14)' },
  symptomChipActive: { backgroundColor: '#2e7d32' },
  symptomText: { color: '#2e7d32', fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  symptomTextActive: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  primaryButton: { minHeight: 46, backgroundColor: '#2e7d32', borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 14 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sectionTitle: { color: '#1b5e20', fontSize: 16, fontWeight: '800', marginBottom: 10, marginTop: 4 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  itemTitle: { color: '#1b5e20', fontSize: 15, fontWeight: '800', flex: 1, textTransform: 'capitalize' },
  itemBadge: { color: '#2e7d32', backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  itemMeta: { color: '#4c8c4a', fontSize: 12, lineHeight: 17 },
  secondaryButton: { minHeight: 38, borderRadius: 8, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryButtonText: { color: '#2e7d32', fontSize: 13, fontWeight: '800' },
  ticketCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10 },
  sosPanel: { backgroundColor: '#c62828', borderRadius: 8, padding: 18, alignItems: 'center', marginBottom: 14 },
  sosTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  sosText: { color: 'rgba(255,255,255,0.86)', textAlign: 'center', fontSize: 13, lineHeight: 18, marginTop: 4 },
  input: { minHeight: 46, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, color: '#1b5e20', fontWeight: '700', marginBottom: 12 },
  sosButton: { minHeight: 50, borderRadius: 8, backgroundColor: '#c62828', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  sosButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
