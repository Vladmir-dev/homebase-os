import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";

export default function AccountScreen() {
  const { logout, userProfile, assets } = useApp();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.getUnreadCount();
        if (res.unread_count !== undefined) setUnreadCount(res.unread_count);
      } catch (e) {
        console.warn("Failed fetching unread count:", e);
      }
    };
    fetchUnread();
  }, []);

  const ACCOUNT_MENU = [
    {
      icon: "business-outline" as const,
      label: "My Registered Assets",
      badge: `${assets.length}`,
      route: "/registered-assets",
    },
    {
      icon: "notifications-outline" as const,
      label: "Notifications",
      badge: unreadCount > 0 ? `${unreadCount}` : undefined,
    },
    {
      icon: "shield-checkmark-outline" as const,
      label: "NIRA Verification Status",
      value: userProfile?.is_verified === false ? "Pending" : "Verified",
    },
    {
      icon: "speedometer-outline" as const,
      label: "Reliability Score",
      value: `${userProfile?.reliability_score ?? 0}/100`,
    },
    { icon: "card-outline" as const, label: "Flutterwave Payment Methods" },
    {
      icon: "document-text-outline" as const,
      label: "Audit Log & Evidence Chain",
      route: "/evidence-audit",
    },
    { icon: "settings-outline" as const, label: "Settings" },
    { icon: "help-circle-outline" as const, label: "Help & Support" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerTitle}>Account</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.profileName}>
              {userProfile
                ? `${userProfile.first_name} ${userProfile.last_name || ""}`
                : "John Doe"}
            </Text>
            <Text style={styles.profileEmail}>
              {userProfile?.email || "test@homebase.com"}
            </Text>
          </View>
          <View style={styles.verifiedChip}>
            <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        <View style={styles.assetSection}>
          <View style={styles.assetHeaderRow}>
            <Text style={styles.sectionHeading}>My Registered Assets</Text>
            <TouchableOpacity
              style={styles.createAssetButton}
              onPress={() => router.push("/registered-assets" as any)}
            >
              <Text style={styles.createAssetButtonText}>
                Open asset dashboard
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.assetSummaryText}>
            View and manage all your registered assets on the dedicated assets
            screen.
          </Text>
        </View>

        <View style={styles.menuSection}>
          {ACCOUNT_MENU.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuRow}
              onPress={() => {
                if (item.action) item.action();
                else if (item.route) router.push(item.route as any);
              }}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color="#2e7d32" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                {item.value && (
                  <Text style={styles.valueText}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color="#a5d6a7" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={40} color="#d32f2f" />
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out of Homebase OS?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                  router.replace("/(auth)");
                }}
              >
                <Text style={styles.confirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: { fontSize: 17, fontWeight: "700", color: "#1b5e20" },
  profileEmail: { fontSize: 13, color: "#4c8c4a", marginTop: 4 },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: { color: "#2e7d32", fontSize: 11, fontWeight: "700" },
  menuSection: { gap: 4 },
  sectionHeading: { fontSize: 16, fontWeight: "800", color: "#1b5e20" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1b5e20" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  valueText: { fontSize: 13, fontWeight: "600", color: "#2e7d32" },
  badge: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(211,47,47,0.2)",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#d32f2f" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b5e20",
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4c8c4a",
    textAlign: "center",
    lineHeight: 20,
  },
  formGroup: { width: "100%", marginTop: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a6b4a",
    marginBottom: 8,
  },
  formInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#dce8d9",
    backgroundColor: "#f7fbf7",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#1b4d2b",
    fontSize: 15,
  },
  typeOptionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#c7dac9",
    borderRadius: 14,
    backgroundColor: "#f4faf4",
  },
  typeOptionActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  typeOptionText: { fontSize: 13, color: "#4a6b4a", fontWeight: "700" },
  typeOptionTextActive: { fontSize: 13, color: "#fff", fontWeight: "700" },
  assetSection: { marginBottom: 20 },
  assetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  createAssetButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createAssetButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  assetCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.12)",
  },
  assetCardLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  assetName: { fontSize: 16, fontWeight: "700", color: "#1b5e20" },
  assetMeta: { color: "#607d55", fontSize: 13 },
  emptyStateCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.12)",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#4a6b4a",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyStateAction: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyStateActionText: { color: "#2e7d32", fontWeight: "700" },
  assetModalContent: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  errorText: { color: "#b71c1c", fontSize: 13, marginTop: 10 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#2e7d32" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#2e7d32",
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
