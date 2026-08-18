import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";

interface WorkspaceProps {
  role: string;
  assetId: string;
}

export default function GenesisWorkspace({ role, assetId }: WorkspaceProps) {
  const { activeAsset } = useApp();
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Diary modal state
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [diaryNotes, setDiaryNotes] = useState("");
  const [weather, setWeather] = useState("Sunny / Dry");
  const [workersCount, setWorkersCount] = useState("14");
  const [submittingDiary, setSubmittingDiary] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    item: "Cement",
    quantity: "20",
    unit: "bags",
    supplier: "Kampala Hardware",
    unit_cost: "36000",
    qr_code: "",
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const siteBackendId = activeAsset?.backendId;
      const [phasesData, diaryData, camerasData, deliveryData, attendanceData, budgetData] = await Promise.all([
        api.getProjectPhases(siteBackendId).catch(() => []),
        api.getSiteDiary(siteBackendId).catch(() => []),
        api.getSiteCameras(siteBackendId).catch(() => []),
        api.getMaterialDeliveries().catch(() => []),
        api.getLaborAttendance(siteBackendId).catch(() => []),
        siteBackendId
          ? api.getConstructionBudget(siteBackendId).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (Array.isArray(phasesData)) setPhases(phasesData);
      if (Array.isArray(diaryData)) setDiaryEntries(diaryData);
      if (Array.isArray(camerasData)) setCameras(camerasData);
      if (Array.isArray(deliveryData)) setDeliveries(deliveryData);
      if (Array.isArray(attendanceData)) setAttendance(attendanceData);
      if (budgetData) setBudget(budgetData);
    } catch (e) {
      console.warn("Failed loading construction workspace data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assetId]);

  const handleAddDiaryEntry = async () => {
    if (!diaryNotes.trim()) {
      Alert.alert("Missing Notes", "Please write diary entry notes.");
      return;
    }
    if (!activeAsset?.backendId) {
      Alert.alert("Error", "No active construction site selected.");
      return;
    }
    setSubmittingDiary(true);
    try {
      await api.createSiteDiary({
        site: activeAsset.backendId,
        entry_date: new Date().toISOString().split("T")[0],
        notes: diaryNotes.trim(),
        weather: weather.trim(),
        workers_count: parseInt(workersCount) || 10,
      });
      Alert.alert("Success", "Site diary entry logged successfully!");
      setShowDiaryModal(false);
      setDiaryNotes("");
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed creating site diary entry.");
    } finally {
      setSubmittingDiary(false);
    }
  };

  const handlePhaseAction = async (phase: any) => {
    const nextAction = phase.status === "pending"
      ? "start"
      : phase.status === "in_progress"
      ? "review"
      : phase.status === "review"
      ? "complete"
      : null;

    if (!nextAction) {
      Alert.alert("Phase Locked", "This phase cannot move to another status from here.");
      return;
    }

    setBusyAction(`phase-${phase.id}`);
    try {
      if (nextAction === "start") await api.startProjectPhase(phase.id);
      if (nextAction === "review") await api.reviewProjectPhase(phase.id);
      if (nextAction === "complete") await api.completeProjectPhase(phase.id);
      loadData();
    } catch (error: any) {
      Alert.alert("Phase Update Failed", error.message || "Could not update phase status.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddDelivery = async () => {
    const firstPhase = phases[0];
    if (!firstPhase?.id) {
      Alert.alert("No Phase", "Create or sync a construction phase before logging deliveries.");
      return;
    }
    setSubmittingDelivery(true);
    try {
      await api.createMaterialDelivery({
        phase: firstPhase.id,
        item: deliveryForm.item.trim(),
        quantity: Number(deliveryForm.quantity) || 0,
        unit: deliveryForm.unit.trim() || "units",
        supplier: deliveryForm.supplier.trim(),
        unit_cost: Number(deliveryForm.unit_cost) || 0,
        qr_code: deliveryForm.qr_code.trim(),
        boq_match: true,
      });
      setShowDeliveryModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Delivery Failed", error.message || "Could not log material delivery.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleAttendanceCheckIn = async () => {
    if (!activeAsset?.backendId) {
      Alert.alert("Select Site", "Choose a construction site before check-in.");
      return;
    }
    setBusyAction("attendance");
    try {
      await api.createLaborAttendance({
        site: activeAsset.backendId,
        check_in_time: new Date().toISOString(),
        status: "present",
        hours_worked: 8,
        daily_wage: 35000,
      });
      loadData();
    } catch (error: any) {
      Alert.alert("Check-in Failed", error.message || "Could not create attendance record.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleHandoverReport = async () => {
    setBusyAction("handover");
    try {
      await api.createReport({
        asset_id: activeAsset?.backendId,
        report_type: "handover",
        title: "Digital Construction Handover Package",
        parameters: { site: activeAsset?.name, source: "genesis_workspace" },
      });
      Alert.alert("Handover Ready", "Digital handover package has been generated.");
    } catch (error: any) {
      Alert.alert("Handover Failed", error.message || "Could not generate handover package.");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Syncing Site Data & Cameras...</Text>
      </View>
    );
  }

  const cameraObj = cameras[0];

  return (
    <View style={styles.container}>
      {/* SITE EYE CAMERA LAYER MONITOR */}
      <Text style={styles.sectionHeading}>Site Eye Network</Text>
      <View style={styles.cameraFrame}>
        <Image
          source={{
            uri:
              cameraObj?.snapshot ||
              "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=500",
          }}
          style={styles.cameraStreamImage}
        />
        <View style={styles.cameraOverlayStrip}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.redDot} />
            <Text style={styles.cameraOverlayText}>
              {cameraObj?.camera_name || "Gate Camera 01"} • Active Stream
            </Text>
          </View>
        </View>
      </View>

      {/* RECONCILIATION FRAUD UTILITIES */}
      <View style={styles.fraudRowGrid}>
        <TouchableOpacity style={styles.fraudUtilityCard} onPress={() => setShowDiaryModal(true)}>
          <Ionicons name="journal-outline" size={22} color="#2563EB" />
          <Text style={styles.fraudCardLabel}>Log Site Diary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fraudUtilityCard} onPress={() => setShowDeliveryModal(true)}>
          <Ionicons name="qr-code-outline" size={22} color="#2563EB" />
          <Text style={styles.fraudCardLabel}>Log Delivery QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fraudRowGrid}>
        <TouchableOpacity style={styles.fraudUtilityCard} onPress={handleAttendanceCheckIn}>
          {busyAction === "attendance" ? <ActivityIndicator color="#2563EB" /> : <Ionicons name="finger-print-outline" size={22} color="#2563EB" />}
          <Text style={styles.fraudCardLabel}>Worker Check-in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fraudUtilityCard} onPress={handleHandoverReport}>
          {busyAction === "handover" ? <ActivityIndicator color="#2563EB" /> : <Ionicons name="folder-open-outline" size={22} color="#2563EB" />}
          <Text style={styles.fraudCardLabel}>Handover Pack</Text>
        </TouchableOpacity>
      </View>

      {/* SITE DIARY LOG RECENT */}
      {diaryEntries.length > 0 && (
        <View style={styles.diaryBox}>
          <Text style={styles.diaryHeading}>Latest Site Diary Entry ({diaryEntries[0].entry_date})</Text>
          <Text style={styles.diaryText}>Weather: {diaryEntries[0].weather || "—"} | Workers: {diaryEntries[0].workers_count ?? 0}</Text>
          <Text style={styles.diaryNotes}>"{diaryEntries[0].notes}"</Text>
        </View>
      )}

      <View style={styles.siteOpsGrid}>
        <View style={styles.siteOpsCard}>
          <Text style={styles.siteOpsValue}>{deliveries.length}</Text>
          <Text style={styles.siteOpsLabel}>Deliveries</Text>
        </View>
        <View style={styles.siteOpsCard}>
          <Text style={styles.siteOpsValue}>{attendance.length}</Text>
          <Text style={styles.siteOpsLabel}>Check-ins</Text>
        </View>
      </View>

      {/* BUDGET VS ACTUAL */}
      {budget && (
        <View style={styles.diaryBox}>
          <View style={styles.budgetHeaderRow}>
            <Text style={styles.diaryHeading}>Budget vs Actual Spend</Text>
            <View
              style={[
                styles.budgetBadge,
                budget.on_track
                  ? styles.budgetBadgeOnTrack
                  : styles.budgetBadgeOver,
              ]}
            >
              <Ionicons
                name={budget.on_track ? "checkmark-circle" : "warning"}
                size={12}
                color={budget.on_track ? "#2563EB" : "#c62828"}
              />
              <Text
                style={[
                  styles.budgetBadgeText,
                  { color: budget.on_track ? "#2563EB" : "#c62828" },
                ]}
              >
                {budget.on_track ? "ON TRACK" : "OVER BUDGET"}
              </Text>
            </View>
          </View>
          <Text style={styles.budgetLine}>
            Planned: UGX {Number(budget.budget_planned || 0).toLocaleString()}
          </Text>
          <Text style={styles.budgetLine}>
            Actual (deliveries): UGX {Number(budget.delivery_spend || 0).toLocaleString()}
          </Text>
          <Text style={styles.budgetLine}>
            Remaining: UGX {Number(budget.remaining || 0).toLocaleString()} • {budget.percent_spent}% spent
          </Text>
          <View style={styles.budgetBarTrack}>
            <View
              style={[
                styles.budgetBarFill,
                { width: `${Math.min(Number(budget.percent_spent) || 0, 100)}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* LOCKED CONSTRAINTS PROGRESS MATRIX */}
      <Text style={styles.sectionHeading}>Structural Milestones ({phases.length})</Text>

      {phases.length > 0 ? (
        phases.map((phase, idx) => {
          const isCompleted = phase.status === 'completed';
          const isLocked = phase.status === 'pending';
          const phaseBudget = (budget?.phases || []).find(
            (entry: any) => String(entry.id) === String(phase.id)
          );
          const deliverySpend = Number(phaseBudget?.delivery_spend || phase.actual_cost || 0);
          return (
            <View key={phase.id} style={styles.timelineNode}>
              <View style={styles.iconColumn}>
                <View
                  style={[
                    styles.statusNodeCircle,
                    isCompleted
                      ? { backgroundColor: "#F8FAFC" }
                      : isLocked
                      ? { backgroundColor: "#ffebee", borderColor: "#d32f2f", borderWidth: 1 }
                      : { backgroundColor: "#fff3e0", borderColor: "#ef6c00", borderWidth: 1 },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? "checkmark" : isLocked ? "lock-closed" : "construct"}
                    size={15}
                    color={isCompleted ? "#2563EB" : isLocked ? "#d32f2f" : "#ef6c00"}
                  />
                </View>
                {idx < phases.length - 1 && <View style={styles.timelineTailLine} />}
              </View>
              <View style={[styles.timelineContentCard, !isCompleted && styles.lockedContentCard]}>
                <Text style={styles.milestoneTitle}>{phase.name}</Text>
                <Text
                  style={[
                    styles.milestoneStatusMeta,
                    isCompleted ? { color: "#2563EB" } : isLocked ? { color: "#c62828" } : { color: "#ef6c00" },
                  ]}
                >
                  {isCompleted
                    ? "Verified and completed"
                    : isLocked
                    ? "Structural milestone pending"
                    : "In progress — awaiting engineer review"}
                </Text>
                <Text style={styles.metaSubtext}>
                  Planned: UGX {parseFloat(phase.planned_cost || 0).toLocaleString()} • Spent: UGX {deliverySpend.toLocaleString()}
                </Text>
                {!isCompleted && (
                  <TouchableOpacity style={styles.phaseActionButton} onPress={() => handlePhaseAction(phase)} disabled={busyAction === `phase-${phase.id}`}>
                    {busyAction === `phase-${phase.id}` ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.phaseActionText}>
                        {phase.status === "pending" ? "Start Phase" : phase.status === "in_progress" ? "Request Engineer Review" : "Approve Completion"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.diaryBox}>
          <Text style={styles.emptyStateTitle}>No Structural Milestones Synced</Text>
          <Text style={styles.emptyStateText}>
            No construction phases have been created for this site yet. Create a phase to
            unlock milestone tracking, engineer review, and budget tracking.
          </Text>
        </View>
      )}

      {/* Diary Entry Modal */}
      <Modal visible={showDiaryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Daily Site Diary</Text>

            <TextInput
              placeholder="Weather (e.g. Sunny / Dry)"
              style={styles.modalInput}
              value={weather}
              onChangeText={setWeather}
            />

            <TextInput
              placeholder="Worker Count"
              style={styles.modalInput}
              keyboardType="numeric"
              value={workersCount}
              onChangeText={setWorkersCount}
            />

            <TextInput
              placeholder="Enter site notes, progress updates..."
              style={[styles.modalInput, { height: 90, textAlignVertical: "top" }]}
              multiline
              value={diaryNotes}
              onChangeText={setDiaryNotes}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDiaryModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddDiaryEntry} disabled={submittingDiary}>
                {submittingDiary ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Log</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeliveryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Material Delivery</Text>
            {(["item", "quantity", "unit", "supplier", "unit_cost", "qr_code"] as const).map((field) => (
              <TextInput
                key={field}
                placeholder={field.replace(/_/g, " ")}
                style={styles.modalInput}
                value={deliveryForm[field]}
                onChangeText={(value) => setDeliveryForm((current) => ({ ...current, [field]: value }))}
                keyboardType={field === "quantity" || field === "unit_cost" ? "numeric" : "default"}
              />
            ))}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDeliveryModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddDelivery} disabled={submittingDelivery}>
                {submittingDelivery ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Delivery</Text>
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
  container: { paddingHorizontal: 16, marginTop: 12 },
  loadingContainer: { padding: 32, alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#2563EB', fontWeight: '600' },
  sectionHeading: { fontSize: 20, fontWeight: "700", color: "#1a3b1c", marginBottom: 12, marginTop: 12 },
  
  cameraFrame: { width: "100%", height: 160, borderRadius: 16, overflow: "hidden", marginBottom: 16, backgroundColor: "#000" },
  cameraStreamImage: { width: "100%", height: "100%", opacity: 0.85 },
  cameraOverlayStrip: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", padding: 8 },
  liveIndicatorRow: { flexDirection: "row", alignItems: "center" },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d32f2f", marginRight: 6 },
  cameraOverlayText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  fraudRowGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  fraudUtilityCard: {
    flex: 1, backgroundColor: "#fff", padding: 14, borderRadius: 14,
    alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(37, 99, 235, 0.15)",
  },
  fraudCardLabel: { fontSize: 12, fontWeight: "700", color: "#1E293B" },

  diaryBox: { backgroundColor: "#fff", padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(37, 99, 235, 0.2)" },
  diaryHeading: { fontSize: 13, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  diaryText: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 4 },
  diaryNotes: { fontSize: 12, color: "#333", italic: true } as any,

  budgetHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  budgetBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  budgetBadgeOnTrack: { backgroundColor: "#F8FAFC" },
  budgetBadgeOver: { backgroundColor: "#ffebee" },
  budgetBadgeText: { fontSize: 10, fontWeight: "800" },
  budgetLine: { fontSize: 12, color: "#444", fontWeight: "600", marginTop: 4 },
  budgetBarTrack: { height: 8, borderRadius: 4, backgroundColor: "#e8e8e8", marginTop: 10, overflow: "hidden" },
  budgetBarFill: { height: "100%", borderRadius: 4, backgroundColor: "#2563EB" },

  emptyStateTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  emptyStateText: { fontSize: 12, color: "#666", lineHeight: 18 },

  siteOpsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  siteOpsCard: { flex: 1, backgroundColor: "#1E293B", borderRadius: 8, padding: 14, alignItems: "center" },
  siteOpsValue: { color: "#fff", fontSize: 21, fontWeight: "800" },
  siteOpsLabel: { color: "#c8e6c9", fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginTop: 3 },

  timelineNode: { flexDirection: "row", marginBottom: 16 },
  iconColumn: { alignItems: "center", marginRight: 12 },
  statusNodeCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  timelineTailLine: { width: 2, flex: 1, backgroundColor: "#c8e6c9", marginVertical: 4 },
  timelineContentCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(37, 99, 235, 0.15)" },
  lockedContentCard: { backgroundColor: "#fafafa" },
  milestoneTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  milestoneStatusMeta: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  metaSubtext: { fontSize: 12, color: "#666", marginTop: 4 },
  phaseActionButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", marginTop: 12 },
  phaseActionText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  modalInput: { backgroundColor: '#f0f4f1', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14 },
  modalActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#f5f5f5' },
  modalCancelText: { color: '#666', fontWeight: '700' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#2563EB' },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
});
