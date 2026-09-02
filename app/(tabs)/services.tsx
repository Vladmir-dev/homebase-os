import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ServiceCard from "../../components/ServiceCard";
import { useApp } from "../../context/AppContext";
import { ServiceItemResponse, api } from "../../services/api";
import { ServiceItem } from "../../types";

const { width } = Dimensions.get("window");

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600";

interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string;
}

function toServiceItem(s: ServiceItemResponse): ServiceItem {
  const images =
    s.images && s.images.length
      ? s.images.map((img) => img.url)
      : [FALLBACK_BANNER];
  return {
    id: String(s.id),
    subCategoryId: String(s.category),
    name: s.name,
    rating: Number(s.rating ?? 0),
    reviewsCount: String(s.reviews_count ?? 0),
    price: Number(s.price),
    durationMinutes: s.duration_minutes,
    descriptionPoints: s.description ? [s.description] : [],
    image: images[0],
    images,
  };
}

export default function ServicesScreen() {
  const router = useRouter();
  const { userProfile, cart, addToCart, removeFromCart } = useApp();
  const providerEmail = userProfile?.email;

  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [displayedServices, setDisplayedServices] = useState<ServiceItem[]>([]);
  const [providedServices, setProvidedServices] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, services] = await Promise.all([
        api.getCategories(),
        api.getServices(),
      ]);
      setCategories(
        Array.isArray(cats)
          ? cats.map((c: any) => ({
              id: Number(c.id),
              slug: c.slug || String(c.id),
              name: c.name,
              icon: c.icon,
            }))
          : []
      );
      const mapped = (Array.isArray(services) ? services : []).map(
        toServiceItem
      );
      setAllServices(mapped);
      setDisplayedServices(mapped);
    } catch (e) {
      console.warn("Failed loading services:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!providerEmail) return;
    const loadProvidedServices = async () => {
      try {
        const data = await api.getServices({ provider: providerEmail });
        setProvidedServices(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : []
        );
      } catch (e) {
        console.warn("Provided services fetch failed:", e);
      }
    };
    loadProvidedServices();
  }, [providerEmail]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setDisplayedServices(allServices);
      return;
    }
    setDisplayedServices(
      allServices.filter(
        (s) => String(s.subCategoryId) === String(selectedCategoryId)
      )
    );
  }, [selectedCategoryId, allServices]);

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
          <Ionicons name="refresh" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedServices}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.serviceRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* My Services — services the user provides */}
            <View style={styles.myServicesSection}>
              <View style={styles.rowHeader}>
                <Text style={styles.sectionHeading}>My Services</Text>
                <TouchableOpacity
                  onPress={() => router.push("/my-services" as any)}
                >
                  <Text style={styles.seeAllText}>Manage All</Text>
                </TouchableOpacity>
              </View>
              {providedServices.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselScroll}
                >
                  {providedServices.map((service: any) => (
                    <ServiceCard
                      key={service.id}
                      imageUri={
                        service.images && service.images.length > 0
                          ? service.images[0].url
                          : FALLBACK_BANNER
                      }
                      title={service.name}
                      rating={Number(service.rating ?? 0).toFixed(1)}
                      subtitle={service.category_name || "Service"}
                      price={`${service.currency || "UGX"} ${Number(
                        service.price || 0
                      ).toLocaleString()}`}
                      onPress={() => router.push("/my-services" as any)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  style={styles.emptyServicesBox}
                  onPress={() => router.push("/my-services" as any)}
                >
                  <Ionicons name="briefcase-outline" size={22} color="#2563EB" />
                  <Text style={styles.emptyServicesText}>
                    You haven't created any services yet
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category filter chips */}
            {categories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    !selectedCategoryId && styles.chipActive,
                  ]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      !selectedCategoryId && styles.chipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => {
                  const active =
                    String(cat.id) === String(selectedCategoryId);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() =>
                        setSelectedCategoryId(
                          active ? null : String(cat.id)
                        )
                      }
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.sectionHeading}>
              {selectedCategoryId ? "Services" : "All Services"}
            </Text>
            <Text style={styles.countText}>
              {displayedServices.length} available
            </Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyText}>
                No services available yet
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const cartItem = cart.find((c) => c.service.id === item.id);
          const count = cartItem ? cartItem.quantity : 0;
          return (
            <View style={styles.cardWrap}>
              <ServiceCard
                imageUri={item.image}
                title={item.name}
                rating={item.rating}
                subtitle={`${item.reviewsCount} reviews`}
                price={`UGX ${item.price.toLocaleString()}`}
                onPress={() => {
                  setDetailImageIndex(0);
                  setDetailService(item);
                }}
              />
              {count > 0 ? (
                <View style={styles.counterBox}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Text style={styles.counterBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{count}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Service Detail Modal */}
      <Modal
        visible={detailService !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailService(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.modalContent}>
            {detailService && (
              <>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setDetailService(null)}
                >
                  <View style={styles.closeCircle}>
                    <Ionicons name="close" size={22} color="#1E293B" />
                  </View>
                </Pressable>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <Image
                    source={{ uri: detailService.image }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.modalTitle}>{detailService.name}</Text>

                  <View style={styles.modalRatingRow}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.modalRatingText}>
                      {detailService.rating}
                      <Text style={styles.modalReviews}>
                        {" "}
                        ({detailService.reviewsCount} reviews)
                      </Text>
                    </Text>
                  </View>

                  <Text style={styles.modalPrice}>
                    UGX {detailService.price.toLocaleString()}
                    <Text style={styles.modalDuration}>
                      {" "}
                      • {detailService.durationMinutes} mins
                    </Text>
                  </Text>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalSectionTitle}>What's included</Text>
                  {detailService.descriptionPoints.map((point, index) => (
                    <Text key={index} style={styles.modalBullet}>
                      • {point}
                    </Text>
                  ))}
                </ScrollView>

                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={styles.modalAddBtn}
                    onPress={() => {
                      addToCart(detailService);
                      setDetailService(null);
                    }}
                  >
                    <Text style={styles.modalAddBtnText}>
                      Add to Cart - UGX {detailService.price.toLocaleString()}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  masterWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 58,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  refreshBtn: { padding: 6 },

  listContent: { padding: 16, paddingBottom: 40 },
  serviceRow: { gap: 12, justifyContent: "space-between" },

  myServicesSection: { marginBottom: 20 },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 20,
  },
  seeAllText: { fontSize: 13, fontWeight: "700", color: "#2563EB" },
  carouselScroll: { paddingRight: 16, gap: 12 },
  emptyServicesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
  },
  emptyServicesText: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },

  chipsScroll: { marginTop: 8, marginBottom: 4 },
  chipsContainer: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#fff" },

  countText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    marginBottom: 16,
  },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "600", marginLeft: 1 },

  cardWrap: { width: (width - 16 * 2 - 12) / 2, marginBottom: 20, alignItems: "center" },
  addBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  addBtnText: { color: "#2563EB", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  counterBox: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 8,
  },
  counterBtn: { paddingHorizontal: 14 },
  counterBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  counterValue: { color: "#fff", fontWeight: "700", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    maxHeight: "88%",
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    ...Platform.select({ android: { elevation: 0 } }),
  },
  modalScrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  modalCloseBtn: { position: "absolute", top: 20, right: 20, zIndex: 10 },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    ...Platform.select({ android: { elevation: 3 } }),
  },
  modalImage: {
    width: width - 48,
    height: 220,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 28,
    marginBottom: 8,
  },
  modalRatingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  modalRatingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 6,
  },
  modalReviews: { fontWeight: "500", color: "#64748B", fontSize: 15 },
  modalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
  },
  modalDuration: { fontSize: 16, fontWeight: "500", color: "#64748B" },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    marginVertical: 20,
  },
  modalSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  modalBullet: {
    fontSize: 15,
    color: "#2563EB",
    lineHeight: 22,
    marginBottom: 10,
    paddingLeft: 4,
  },
  modalButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.8)",
  },
  modalAddBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...Platform.select({ android: { elevation: 6 } }),
  },
  modalAddBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
