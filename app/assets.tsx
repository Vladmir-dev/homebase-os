import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useApp } from "../context/AppContext";

export default function AssetsScreen() {
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

  const assetCount = useMemo(() => assets.length, [assets.length]);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Registered Assets</Text>
          <Text style={styles.subtitle}>
            {assetCount} item{assetCount === 1 ? "" : "s"}
          </Text>
        </View>

        {assetCount > 0 ? (
          assets.map((asset) => (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.assetCardHeader}>
                <Text style={styles.assetName}>{asset.name}</Text>
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

        <View style={styles.createSection}>
          <Text style={styles.sectionHeading}>Create New Asset</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f5e9" },
  scrollContent: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#1b5e20" },
  subtitle: { fontSize: 13, color: "#4c8c4a", marginTop: 8 },
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
  assetName: { fontSize: 16, fontWeight: "800", color: "#1b5e20" },
  assetRole: { fontSize: 12, fontWeight: "700", color: "#4caf50" },
  assetMeta: { fontSize: 13, color: "#4c8c4a", marginBottom: 8 },
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
    color: "#1b5e20",
    marginBottom: 8,
  },
  emptyStateText: { fontSize: 13, color: "#4c8c4a" },
  createSection: { marginTop: 10 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 14,
  },
  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 13,
    color: "#4c8c4a",
    marginBottom: 8,
    fontWeight: "700",
  },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    color: "#1b5e20",
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.2)",
  },
  typeOptionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.2)",
    backgroundColor: "rgba(255,255,255,0.9)",
    marginRight: 10,
    marginBottom: 10,
  },
  typeOptionActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  typeOptionText: { color: "#4c8c4a", fontSize: 13 },
  typeOptionTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  errorText: { color: "#c62828", fontSize: 13, marginBottom: 12 },
  submitButton: {
    backgroundColor: "#2e7d32",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabledBtn: { opacity: 0.7 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
