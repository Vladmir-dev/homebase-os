import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkspaceProps {
  role: string;
  assetId: string;
}

export default function GenesisWorkspace({ role, assetId }: WorkspaceProps) {
  return (
    <View style={styles.container}>
      {/* SITE EYE CAMERA LAYER MONITOR */}
      <Text style={styles.sectionHeading}>Site Eye Network</Text>
      <View style={styles.cameraFrame}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=500",
          }}
          style={styles.cameraStreamImage}
        />
        <View style={styles.cameraOverlayStrip}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.redDot} />
            <Text style={styles.cameraOverlayText}>
              Camera 01 (Gate view) • 10 Mins Ago
            </Text>
          </View>
        </View>
      </View>

      {/* RECONCILIATION FRAUD UTILITIES */}
      <View style={styles.fraudRowGrid}>
        <TouchableOpacity style={styles.fraudUtilityCard}>
          <Ionicons name="qr-code-outline" size={22} color="#2e7d32" />
          <Text style={styles.fraudCardLabel}>Scan Delivery QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fraudUtilityCard}>
          <Ionicons name="apps-outline" size={22} color="#2e7d32" />
          <Text style={styles.fraudCardLabel}>Count Empty Bags</Text>
        </TouchableOpacity>
      </View>

      {/* LOCKED CONSTRAINTS PROGRESS MATRIX */}
      <Text style={styles.sectionHeading}>Structural Milestones</Text>

      {/* Milestone 1: Passed */}
      <View style={styles.timelineNode}>
        <View style={styles.iconColumn}>
          <View
            style={[styles.statusNodeCircle, { backgroundColor: "#e8f5e9" }]}
          >
            <Ionicons name="checkmark" size={16} color="#2e7d32" />
          </View>
          <View style={styles.timelineTailLine} />
        </View>
        <View style={styles.timelineContentCard}>
          <Text style={styles.milestoneTitle}>Foundation Excavation</Text>
          <Text style={styles.milestoneStatusMeta}>Visual Chain Verified</Text>
        </View>
      </View>

      {/* Milestone 2: Hard Blocked */}
      <View style={styles.timelineNode}>
        <View style={styles.iconColumn}>
          <View
            style={[
              styles.statusNodeCircle,
              {
                backgroundColor: "#ffebee",
                borderColor: "#d32f2f",
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="lock-closed" size={14} color="#d32f2f" />
          </View>
        </View>
        <View style={[styles.timelineContentCard, styles.lockedContentCard]}>
          <Text style={styles.milestoneTitle}>Slab Structural Pour</Text>
          <Text style={[styles.milestoneStatusMeta, { color: "#c62828" }]}>
            ⚠️ Locked: Structural Dependency Gate
          </Text>
          <Text style={styles.lockedWarningBody}>
            This milestone is protected by strict parameters. Payout release
            requires verified site entry inspection logs uploaded by an
            accredited Engineer.
          </Text>

          <TouchableOpacity
            style={styles.gateButton}
            onPress={() =>
              alert(
                "Requesting nearest certified Homebase Verification Engineer...",
              )
            }
          >
            <Text style={styles.gateButtonText}>
              Request Engineer Verification
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 12 },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a3b1c",
    marginBottom: 12,
    marginTop: 8,
  },
  cameraFrame: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#000",
  },
  cameraStreamImage: { width: "100%", height: "100%", opacity: 0.85 },
  cameraOverlayStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
  },
  liveIndicatorRow: { flexDirection: "row", alignItems: "center" },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d32f2f",
    marginRight: 6,
  },
  cameraOverlayText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  fraudRowGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  fraudUtilityCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.1)",
  },
  fraudCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
    marginTop: 6,
  },

  // Timeline structural layouts
  timelineNode: { flexDirection: "row", minHeight: 80 },
  iconColumn: { alignItems: "center", marginRight: 12 },
  statusNodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  timelineTailLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(46,125,50,0.15)",
    marginVertical: 4,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.06)",
  },
  lockedContentCard: {
    borderColor: "rgba(211,47,47,0.2)",
    backgroundColor: "#fffbfb",
  },
  milestoneTitle: { fontSize: 15, fontWeight: "700", color: "#1a3b1c" },
  milestoneStatusMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
    marginTop: 2,
  },
  lockedWarningBody: {
    fontSize: 12,
    color: "#555",
    marginTop: 8,
    lineHeight: 16,
  },
  gateButton: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  gateButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
