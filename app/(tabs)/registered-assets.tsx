import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useApp } from "../../context/AppContext";

export default function RegisteredAssetsScreen() {
  const { assets, createAsset } = useApp();
  const router = useRouter();
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("household");
  const [assetLocation, setAssetLocation] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [gpsCoordinates, setGpsCoordinates] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [budgetPlanned, setBudgetPlanned] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const assetCount = useMemo(() => assets.length, [assets.length]);

  const scrollToCreateForm = () => {
    scrollViewRef.current?.scrollTo({ y: 9999, animated: true });
  };

  const handleCreateAsset = async () => {
    if (!assetName.trim()) {
      setAssetError("Please enter an asset name");
      return;
    }
    if (!assetLocation.trim()) {
      setAssetError("Please enter an asset location");
      return;
    }
    if (assetType === "rental_unit" && !rentAmount.trim()) {
      setAssetError("Monthly rent is required for rental units");
      return;
    }
    if (assetType === "construction_site" && !budgetPlanned.trim()) {
      setAssetError("Budget planned is required for construction sites");
      return;
    }

    setCreatingAsset(true);
    setAssetError("");

    try {
      const payload: Record<string, unknown> = {
        description: assetDescription.trim(),
        gps_coordinates: gpsCoordinates.trim(),
      };

      if (assetType === "rental_unit") {
        payload.rent_amount = parseFloat(rentAmount);
        payload.currency = "UGX";
      }
      if (assetType === "construction_site") {
        payload.budget_planned = parseFloat(budgetPlanned);
      }
      if (assetType === "estate") {
        payload.total_units = totalUnits.trim() ? parseInt(totalUnits, 10) : 0;
      }

      await createAsset(
        assetName.trim(),
        assetType,
        assetLocation.trim(),
        payload,
      );
      setAssetName("");
      setAssetType("household");
      setAssetLocation("");
      setAssetDescription("");
      setGpsCoordinates("");
      setRentAmount("");
      setBudgetPlanned("");
      setTotalUnits("");
      router.push("/(tabs)" as any);
    } catch (error: any) {
      setAssetError(error?.message || "Failed to create asset");
    } finally {
      setCreatingAsset(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Registered Assets</Text>
            <Text style={styles.subtitle}>
              {assetCount} item{assetCount === 1 ? "" : "s"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createAssetButtonHeader}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.createAssetButtonHeaderText}>Create asset</Text>
          </TouchableOpacity>
        </View>

        {assetCount > 0 ? (
          assets.map((asset) => (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.assetCardHeader}>
                <View style={styles.assetTitleRow}>
                  <Ionicons
                    name={
                      asset.type === "HOUSEHOLD"
                        ? "home"
                        : asset.type === "RENTAL"
                          ? "business"
                          : asset.type === "CONSTRUCTION"
                            ? "construct"
                            : "shapes"
                    }
                    size={18}
                    color="#2563EB"
                    style={styles.assetIcon}
                  />
                  <Text style={styles.assetName}>{asset.name}</Text>
                </View>
                <Text style={styles.assetRole}>{asset.role}</Text>
              </View>
              <Text style={styles.assetMeta}>
                {asset.location || "No location set"}
              </Text>
              <Text style={styles.assetDescription}>
                {asset.description || "No description provided."}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No registered assets yet</Text>
            <Text style={styles.emptyStateText}>
              Create assets here and manage your properties, rentals, and
              maintenance in one place.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create New Asset</Text>
                <Text style={styles.modalDescription}>
                  Add a new asset to manage services, rentals, and bookings.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Asset name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter asset name"
                placeholderTextColor="#8a9f88"
                value={assetName}
                onChangeText={setAssetName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Asset type</Text>
              <View style={styles.typeOptionsRow}>
                {[
                  { label: "Household", value: "household" },
                  { label: "Rental", value: "rental_unit" },
                  { label: "Construction", value: "construction_site" },
                  { label: "Estate", value: "estate" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.typeOption,
                      assetType === option.value && styles.typeOptionActive,
                    ]}
                    onPress={() => setAssetType(option.value)}
                  >
                    <Text
                      style={
                        assetType === option.value
                          ? styles.typeOptionTextActive
                          : styles.typeOptionText
                      }
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter location"
                placeholderTextColor="#8a9f88"
                value={assetLocation}
                onChangeText={setAssetLocation}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter asset description"
                placeholderTextColor="#8a9f88"
                value={assetDescription}
                onChangeText={setAssetDescription}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>GPS coordinates</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter GPS coordinates"
                placeholderTextColor="#8a9f88"
                value={gpsCoordinates}
                onChangeText={setGpsCoordinates}
              />
            </View>

            {assetType === "rental_unit" && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Monthly rent</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter monthly rent"
                  placeholderTextColor="#8a9f88"
                  keyboardType="numeric"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                />
              </View>
            )}

            {assetType === "construction_site" && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Budget planned</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter planned budget"
                  placeholderTextColor="#8a9f88"
                  keyboardType="numeric"
                  value={budgetPlanned}
                  onChangeText={setBudgetPlanned}
                />
              </View>
            )}

            {assetType === "estate" && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Total units</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter total units"
                  placeholderTextColor="#8a9f88"
                  keyboardType="numeric"
                  value={totalUnits}
                  onChangeText={setTotalUnits}
                />
              </View>
            )}

            {assetError ? (
              <Text style={styles.errorText}>{assetError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, creatingAsset && styles.disabledBtn]}
              onPress={handleCreateAsset}
              disabled={creatingAsset}
            >
              {creatingAsset ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Asset</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 4 },
  assetCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
  },
  assetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  assetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetIcon: {
    marginRight: 10,
  },
  createAssetButtonHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  createAssetButtonHeaderText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 13,
  },
  assetName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  assetRole: { fontSize: 12, fontWeight: "700", color: "#4caf50" },
  assetMeta: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  assetDescription: { fontSize: 13, color: "#6b8f6c" },
  emptyStateCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptyStateText: { fontSize: 13, color: "#64748B" },
  createSection: { marginTop: 10 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 14,
  },
  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "700",
  },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.1)",
  },
  typeOptionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.1)",
    backgroundColor: "rgba(255,255,255,0.9)",
    marginRight: 10,
    marginBottom: 10,
  },
  typeOptionActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  typeOptionText: { color: "#64748B", fontSize: 13 },
  typeOptionTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  createModalContent: {
    width: "100%",
    maxWidth: 540,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    maxWidth: "80%",
  },
  closeModalButton: {
    padding: 8,
  },
  errorText: { color: "#c62828", fontSize: 13, marginBottom: 12 },
  submitButton: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabledBtn: { opacity: 0.7 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
