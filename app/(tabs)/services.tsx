import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import ServiceCard from "../../components/ServiceCard";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600";

interface Category {
  id: number;
  slug: string;
  name: string;
  image_url?: string | null;
  professionals_count?: number;
  icon?: string;
}

export default function ServicesScreen() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [providedServices, setProvidedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const providerEmail = userProfile?.email;

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(
        Array.isArray(data)
          ? data.map((c: any) => ({
              id: Number(c.id),
              slug: c.slug || String(c.id),
              name: c.name,
              image_url: c.image_url || null,
              professionals_count: c.professionals_count,
              icon: c.icon,
            }))
          : []
      );
    } catch (e) {
      console.warn("Failed fetching categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!providerEmail) return;
    const loadProvidedServices = async () => {
      try {
        const data = await api.getServices({ provider: providerEmail });
        setProvidedServices(
          Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
        );
      } catch (e) {
        console.warn("Provided services fetch failed:", e);
      }
    };
    loadProvidedServices();
  }, [providerEmail]);

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadCategories}>
          <Ionicons name="refresh" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionIntro}>
          Browse services by category and book what you need for your household.
        </Text>

        {/* My Services — services the user provides */}
        <View style={styles.sectionContainer}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionHeading}>My Services</Text>
            <TouchableOpacity onPress={() => router.push("/my-services" as any)}>
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
                No services yet — create one
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.browseTitle}>Browse by Category</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : categories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="grid-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No categories available yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/category/[categoryId]",
                    params: { categoryId: String(cat.id) },
                  })
                }
              >
                <Image
                  source={{ uri: cat.image_url || FALLBACK_BANNER }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIconBadge}>
                    <Ionicons
                      name={(cat.icon as any) || "briefcase-outline"}
                      size={16}
                      color="#2563EB"
                    />
                  </View>
                  <View style={styles.categoryTextWrap}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Text style={styles.categoryMeta}>
                      {cat.professionals_count || 0} Pros available
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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

  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionIntro: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 20,
  },

  sectionContainer: { marginBottom: 8 },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionHeading: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
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
  browseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 24,
    marginBottom: 4,
  },

  grid: { gap: 14 },

  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  categoryImage: { width: "100%", height: 120 },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  categoryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTextWrap: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  categoryMeta: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "600" },
});
