import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "../context/AppContext";
import { ServiceImage, ServiceItemResponse } from "../services/api";
import { api } from "../services/api";

interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

interface ServiceFormState {
  name: string;
  category: number;
  subcategory: number;
  price: string;
  duration_minutes: string;
  description: string;
  currency: string;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  category: 0,
  subcategory: 0,
  price: "",
  duration_minutes: "",
  description: "",
  currency: "UGX",
};

export default function MyServicesScreen() {
  const router = useRouter();
  const { userProfile } = useApp();

  const [services, setServices] = useState<ServiceItemResponse[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItemResponse | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [pickedImages, setPickedImages] = useState<ImageFile[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const providerEmail = userProfile?.email;

  const loadServices = useCallback(async () => {
    if (!providerEmail) return;
    try {
      const data = await api.getServices({ provider: providerEmail });
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed fetching provider services:", e);
    } finally {
      setLoading(false);
    }
  }, [providerEmail]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((c: any) => ({
          id: Number(c.id),
          name: c.name || `Category ${c.id}`,
        }));
        setCategories(mapped);
      }
    } catch (e) {
      console.warn("Failed fetching categories:", e);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    setSubcategories([]);
    if (!categoryId) return;
    try {
      const data = await api.getSubcategories({ category: categoryId });
      if (Array.isArray(data) && data.length > 0) {
        setSubcategories(
          data.map((s: any) => ({
            id: Number(s.id),
            name: s.name || `Sub ${s.id}`,
          })),
        );
      }
    } catch (e) {
      console.warn("Failed fetching subcategories:", e);
    }
  };

  const selectCategory = async (categoryId: number) => {
    setForm((prev) => ({ ...prev, category: categoryId, subcategory: 0 }));
    await loadSubcategories(categoryId);
  };

  const openCreateModal = async () => {
    await loadCategories();
    setEditingService(null);
    setForm(EMPTY_FORM);
    setSubcategories([]);
    setPickedImages([]);
    setFormModalVisible(true);
  };

  const openEditModal = async (service: ServiceItemResponse) => {
    await loadCategories();
    setEditingService(service);
    setForm({
      name: service.name,
      category: service.category,
      subcategory: service.subcategory ?? 0,
      price: String(service.price),
      duration_minutes: String(service.duration_minutes ?? ""),
      description: service.description || "",
      currency: service.currency || "UGX",
    });
    if (service.category) {
      await loadSubcategories(service.category);
    }
    setPickedImages([]);
    setFormModalVisible(true);
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow access to your photo library to add service photos.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (result.canceled) return;
    const files: ImageFile[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name:
        asset.fileName ||
        (asset.uri.split("/").pop() || `photo_${Date.now()}.jpg`),
      type: asset.mimeType || "image/jpeg",
    }));
    setPickedImages((prev) => [...prev, ...files]);
  };

  const removePickedImage = (index: number) => {
    setPickedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (serviceId: number, image: ServiceImage) => {
    try {
      await api.deleteServiceImage(image.id);
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? { ...s, images: s.images.filter((img) => img.id !== image.id) }
            : s,
        ),
      );
    } catch (e: any) {
      Alert.alert("Delete failed", e.message || "Could not remove image.");
    }
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Please enter a service name.";
    if (!form.category) return "Please choose a category.";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "Please enter a valid price.";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert("Check your details", error);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        subcategory: form.subcategory || undefined,
        price: Number(form.price),
        currency: form.currency || "UGX",
        duration_minutes: form.duration_minutes
          ? Number(form.duration_minutes)
          : undefined,
        description: form.description.trim() || undefined,
      };
      if (editingService) {
        await api.updateService(editingService.id, payload, pickedImages);
      } else {
        await api.createService(payload, pickedImages);
      }
      setFormModalVisible(false);
      await loadServices();
    } catch (e: any) {
      Alert.alert("Save failed", e.message || "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (confirmDeleteId === null) return;
    try {
      await api.deleteService(confirmDeleteId);
      setServices((prev) => prev.filter((s) => s.id !== confirmDeleteId));
    } catch (e: any) {
      Alert.alert("Delete failed", e.message || "Could not delete the service.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const updateFormField = (field: keyof ServiceFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleButton}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          My Provided Services
        </Text>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={loadServices} style={styles.iconCircleButton}>
            <Ionicons name="refresh" size={20} color="#1b5e20" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color="#2e7d32" />
          <Text style={styles.emptyTitle}>No services yet</Text>
          <Text style={styles.emptyText}>
            Create a service like a cleaning service with photos to start
            accepting bookings.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              {service.images.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageStrip}
                >
                  {service.images.map((image) => (
                    <View key={image.id} style={styles.imageWrap}>
                      <Image source={{ uri: image.url }} style={styles.imageThumb} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeExistingImage(service.id, image)}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noImagesBox}>
                  <Ionicons name="images-outline" size={32} color="#a5d6a7" />
                  <Text style={styles.noImagesText}>No photos yet</Text>
                </View>
              )}

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceMeta}>
                  {service.category_name} · UGX{" "}
                  {Number(service.price).toLocaleString()}
                  {service.duration_minutes
                    ? ` · ${service.duration_minutes} min`
                    : ""}
                </Text>
                <View style={styles.serviceStatsRow}>
                  <Ionicons name="star" size={13} color="#f9a825" />
                  <Text style={styles.serviceStatsText}>
                    {service.rating?.toFixed(1) ?? "0.0"} (
                    {service.reviews_count ?? 0} reviews)
                  </Text>
                  <Text style={styles.serviceStatus}>
                    {service.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => openEditModal(service)}
                >
                  <Ionicons name="create-outline" size={18} color="#2e7d32" />
                  <Text style={styles.cardActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardActionBtn, styles.deleteBtn]}
                  onPress={() => setConfirmDeleteId(service.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#d32f2f" />
                  <Text style={[styles.cardActionText, styles.deleteText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>New Service</Text>
      </TouchableOpacity>

      {/* Service form modal */}
      <Modal
        visible={formModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !saving && setFormModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingService ? "Edit Service" : "New Service"}
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>Service name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => updateFormField("name", v)}
                placeholder="e.g. Cleaning Service"
                placeholderTextColor="#9bb99b"
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {categories.length === 0 ? (
                  <Text style={styles.mutedText}>No categories available</Text>
                ) : (
                  categories.map((cat) => {
                    const active = form.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => selectCategory(cat.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {form.category && subcategories.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>Sub category</Text>
                  <View style={styles.chipRow}>
                    {subcategories.map((sub) => {
                      const active = form.subcategory === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() =>
                            updateFormField("subcategory", sub.id)
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Text style={styles.fieldLabel}>Price (UGX)</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(v) => updateFormField("price", v)}
                keyboardType="numeric"
                placeholder="e.g. 65000"
                placeholderTextColor="#9bb99b"
              />

              <Text style={styles.fieldLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={form.duration_minutes}
                onChangeText={(v) => updateFormField("duration_minutes", v)}
                keyboardType="numeric"
                placeholder="e.g. 120"
                placeholderTextColor="#9bb99b"
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => updateFormField("description", v)}
                placeholder="What does this service include?"
                placeholderTextColor="#9bb99b"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Photos</Text>
              <TouchableOpacity style={styles.pickPhotosBtn} onPress={pickImages}>
                <Ionicons name="images-outline" size={20} color="#2e7d32" />
                <Text style={styles.pickPhotosText}>Pick photos from library</Text>
              </TouchableOpacity>

              {editingService && editingService.images.length > 0 ? (
                <>
                  <Text style={styles.smallLabel}>Current photos (tap X to remove)</Text>
                  <View style={styles.previewRow}>
                    {editingService.images.map((image) => (
                      <View key={image.id} style={styles.previewWrap}>
                        <Image source={{ uri: image.url }} style={styles.previewThumb} />
                        <TouchableOpacity
                          style={styles.removePreviewBtn}
                          onPress={() =>
                            removeExistingImage(editingService.id, image)
                          }
                        >
                          <Ionicons name="close" size={13} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {pickedImages.length > 0 ? (
                <>
                  <Text style={styles.smallLabel}>New photos</Text>
                  <View style={styles.previewRow}>
                    {pickedImages.map((file, index) => (
                      <View key={`${file.uri}-${index}`} style={styles.previewWrap}>
                        <Image source={{ uri: file.uri }} style={styles.previewThumb} />
                        <TouchableOpacity
                          style={styles.removePreviewBtn}
                          onPress={() => removePickedImage(index)}
                        >
                          <Ionicons name="close" size={13} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setFormModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.disabledBtn]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingService ? "Save Changes" : "Create Service"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        visible={confirmDeleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContent}>
            <Ionicons name="trash-outline" size={40} color="#d32f2f" />
            <Text style={styles.modalTitle}>Delete service?</Text>
            <Text style={styles.confirmText}>
              This permanently deletes the service and its photos. This cannot
              be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmDeleteId(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn]}
                onPress={handleDeleteService}
              >
                <Text style={styles.saveBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f5e9" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#1b5e20",
  },
  navRight: { flexDirection: "row", gap: 8 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1b5e20" },
  emptyText: {
    fontSize: 14,
    color: "#4a6b4a",
    textAlign: "center",
    lineHeight: 20,
  },
  serviceCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.12)",
  },
  imageStrip: { flexDirection: "row", marginBottom: 12 },
  imageWrap: { marginRight: 10 },
  imageThumb: { width: 92, height: 92, borderRadius: 12 },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(211,47,47,0.9)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  noImagesBox: {
    height: 92,
    borderRadius: 12,
    backgroundColor: "#f1f8f1",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  noImagesText: { fontSize: 12, color: "#4c8c4a", fontWeight: "600" },
  serviceInfo: { paddingHorizontal: 2 },
  serviceName: { fontSize: 16, fontWeight: "800", color: "#1b5e20" },
  serviceMeta: { fontSize: 13, color: "#4a6b4a", marginTop: 4 },
  serviceStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  serviceStatsText: { fontSize: 12, color: "#607d55", fontWeight: "600" },
  serviceStatus: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "800",
    color: "#2e7d32",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(46,125,50,0.1)",
    paddingTop: 12,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
  },
  cardActionText: { color: "#2e7d32", fontWeight: "700", fontSize: 13 },
  deleteBtn: { backgroundColor: "#ffebee" },
  deleteText: { color: "#d32f2f" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "92%",
    maxHeight: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
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
    textAlign: "center",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a6b4a",
    marginTop: 12,
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#607d55",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dce8d9",
    backgroundColor: "#f7fbf7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#1b4d2b",
    fontSize: 15,
  },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7dac9",
    backgroundColor: "#f4faf4",
  },
  chipActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#4a6b4a" },
  chipTextActive: { color: "#fff" },
  pickPhotosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#f4faf4",
  },
  pickPhotosText: { color: "#2e7d32", fontWeight: "700", fontSize: 13 },
  previewRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  previewWrap: { position: "relative" },
  previewThumb: { width: 76, height: 76, borderRadius: 10 },
  removePreviewBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(211,47,47,0.9)",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#2e7d32" },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#2e7d32",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn: { opacity: 0.7 },
  confirmContent: {
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
  confirmText: {
    fontSize: 14,
    color: "#4c8c4a",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  confirmDeleteBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#d32f2f",
    alignItems: "center",
  },
  mutedText: { fontSize: 13, color: "#9bb99b" },
});
