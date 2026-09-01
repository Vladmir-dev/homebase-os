import { Button, Card, Header, Input, Section, Spacing } from "@/components/ui";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    Text,
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
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 54, 
          paddingHorizontal: Spacing.containerPaddingH, 
          paddingBottom: 40 
        }}
      >
        <Header 
          title="Registered Assets" 
          subtitle={`${assetCount} item${assetCount === 1 ? "" : "s"}`}
        />

        {assetCount > 0 ? (
          assets.map((asset) => (
            <Card key={asset.id} variant="default">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B" }}>
                  {asset.name}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#4caf50", marginBottom: 8 }}>
                {asset.role}
              </Text>
              <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>
                {asset.location || "No location set"}
              </Text>
              <Text style={{ fontSize: 13, color: "#6b8f6c" }}>
                {asset.description || "No description provided."}
              </Text>
            </Card>
          ))
        ) : (
          <Card variant="default">
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 8 }}>
              No registered assets yet
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B" }}>
              Create assets here and manage your properties, rentals, and
              maintenance in one place.
            </Text>
          </Card>
        )}

        <Section title="Create New Asset">
          <Input
            label="Asset name"
            placeholder="Enter asset name"
            value={assetName}
            onChangeText={setAssetName}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 8, fontWeight: "700" }}>
              Asset type
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                { label: "Household", value: "household" },
                { label: "Rental", value: "rental_unit" },
                { label: "Construction", value: "construction_site" },
                { label: "Estate", value: "estate" },
              ].map((option) => (
                <Button
                  key={option.value}
                  title={option.label}
                  onPress={() => setAssetType(option.value)}
                  variant={assetType === option.value ? 'primary' : 'outline'}
                  size="sm"
                />
              ))}
            </View>
          </View>

          <Input
            label="Location"
            placeholder="Enter location"
            value={assetLocation}
            onChangeText={setAssetLocation}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <Input
            label="Description"
            placeholder="Enter asset description"
            value={assetDescription}
            onChangeText={setAssetDescription}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <Input
            label="GPS coordinates"
            placeholder="Enter GPS coordinates"
            value={gpsCoordinates}
            onChangeText={setGpsCoordinates}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {assetType === "rental_unit" && (
            <Input
              label="Monthly rent"
              placeholder="Enter monthly rent"
              keyboardType="numeric"
              value={rentAmount}
              onChangeText={setRentAmount}
              containerStyle={{ marginBottom: Spacing.md }}
            />
          )}

          {assetType === "construction_site" && (
            <Input
              label="Budget planned"
              placeholder="Enter planned budget"
              keyboardType="numeric"
              value={budgetPlanned}
              onChangeText={setBudgetPlanned}
              containerStyle={{ marginBottom: Spacing.md }}
            />
          )}

          {assetType === "estate" && (
            <Input
              label="Total units"
              placeholder="Enter total units"
              keyboardType="numeric"
              value={totalUnits}
              onChangeText={setTotalUnits}
              containerStyle={{ marginBottom: Spacing.md }}
            />
          )}

          {assetError && (
            <Text style={{ color: "#c62828", fontSize: 13, marginBottom: Spacing.md, fontWeight: "500" }}>
              {assetError}
            </Text>
          )}

          <Button
            title="Create Asset"
            onPress={handleCreateAsset}
            loading={creatingAsset}
            disabled={creatingAsset}
            size="lg"
          />
        </Section>
      </ScrollView>
    </View>
  );
}
