import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CATEGORIES, MOCK_SUBCATEGORIES, MOCK_SERVICES } from '../../utils/mockData';
import { useApp } from '../../context/AppContext';

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useApp();

  // Find targeted parent metadata
  const currentCategory = MOCK_CATEGORIES.find(c => c.id === categoryId);
  
  // Filter downstream relational items
  const subCategories = MOCK_SUBCATEGORIES.filter(s => s.categoryId === categoryId);
  const [selectedSubCatId, setSelectedSubCatId] = useState(subCategories[0]?.id || '');
  
  const displayedServices = MOCK_SERVICES.filter(
    srv => srv.subCategoryId === selectedSubCatId
  );

  if (!currentCategory) {
    return (
      <View style={styles.centered}><Text>Category not found</Text></View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* 1. Hero Image Background Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: currentCategory.bannerImage }} style={styles.heroImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.heroOverlayContent}>
            <Text style={styles.heroTitle}>{currentCategory.name}</Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="star" size={14} color="#ffb300" />
              <Text style={styles.heroRatingText}>{currentCategory.rating}</Text>
              <Text style={styles.heroBookingText}>• {currentCategory.totalBookings}</Text>
            </View>
          </View>
        </View>

        {/* 2. Horizontal Sub-Category Selector Chips Layout */}
        <View style={styles.subCatSection}>
          <Text style={styles.subCatSectionTitle}>Select Subcategory</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {subCategories.map((sub) => {
              const isActive = sub.id === selectedSubCatId;
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.chip, isActive && styles.activeChip]}
                  onPress={() => setSelectedSubCatId(sub.id)}
                >
                  <Ionicons 
                    name={sub.icon as any || "construct"} 
                    size={16} 
                    color={isActive ? '#fff' : '#444'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Service Listing Cards Column */}
        <View style={styles.servicesListContainer}>
          {displayedServices.map((service) => {
            const currentCartItem = cart.find(item => item.service.id === service.id);
            const countInCart = currentCartItem ? currentCartItem.quantity : 0;

            return (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.cardLeft}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.cardRatingRow}>
                    <Ionicons name="star" size={12} color="#4caf50" />
                    <Text style={styles.cardRatingText}>{service.rating}</Text>
                    <Text style={styles.reviewsText}>{service.reviewsCount}</Text>
                  </View>
                  <Text style={styles.priceText}>₹{service.price} • {service.durationMinutes} mins</Text>
                  
                  {/* Bullet points checklist features description */}
                  {service.descriptionPoints.map((point, index) => (
                    <Text key={index} style={styles.bulletPoint}>• {point}</Text>
                  ))}
                  
                  <TouchableOpacity 
                    onPress={() => router.push({ pathname: '/modal', params: { serviceId: service.id } })}
                  >
                    <Text style={styles.detailLink}>View details</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardRight}>
                  <Image source={{ uri: service.image }} style={styles.serviceImage} />
                  
                  {/* Dynamic Increment Counter State Button */}
                  <View style={styles.actionButtonWrapper}>
                    {countInCart > 0 ? (
                      <View style={styles.counterContainer}>
                        <TouchableOpacity style={styles.counterNode} onPress={() => removeFromCart(service.id)}>
                          <Text style={styles.counterNodeText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterValueText}>{countInCart}</Text>
                        <TouchableOpacity style={styles.counterNode} onPress={() => addToCart(service)}>
                          <Text style={styles.counterNodeText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addButton} onPress={() => addToCart(service)}>
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 4. Global Sticky Bottom Floating Cart Presentation Banner */}
      {cartCount > 0 && (
        <SafeAreaView style={styles.cartBannerContainer}>
          <View style={styles.cartBannerInner}>
            <View>
              <Text style={styles.cartCountText}>{cartCount} {cartCount === 1 ? 'service' : 'services'} added</Text>
              <Text style={styles.cartTotalPrice}>₹{cartTotal}</Text>
            </View>
            <TouchableOpacity style={styles.viewCartBtn} activeOpacity={0.8}>
              <Text style={styles.viewCartBtnText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  scrollBody: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  heroContainer: { width: '100%', height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 16, 
    backgroundColor: '#fff', 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4
  },
  heroOverlayContent: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    backgroundColor: 'rgba(0,0,0,0.45)' 
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center' },
  heroRatingText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 4, marginRight: 6 },
  heroBookingText: { color: '#ddd', fontSize: 13 },

  subCatSection: { paddingTop: 16, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  subCatSectionTitle: { fontSize: 15, fontWeight: '700', color: '#000', paddingHorizontal: 16, marginBottom: 10 },
  chipsScroll: { paddingLeft: 16, paddingBottom: 16, gap: 10 },
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f7', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e9'
  },
  activeChip: { backgroundColor: '#673ab7', borderColor: '#673ab7' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#444' },
  activeChipText: { color: '#fff' },

  servicesListContainer: { paddingBottom: 100 },
  serviceCard: { 
    flexDirection: 'row', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#f0f0f5',
    backgroundColor: '#fff' 
  },
  cardLeft: { flex: 1, paddingRight: 16 },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardRatingText: { fontSize: 12, fontWeight: '700', color: '#4caf50', marginLeft: 3, marginRight: 4 },
  reviewsText: { fontSize: 12, color: '#777' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 8 },
  bulletPoint: { fontSize: 12, color: '#555', marginBottom: 3, lineHeight: 17 },
  detailLink: { color: '#673ab7', fontSize: 13, fontWeight: '700', marginTop: 8 },

  cardRight: { width: 110, alignItems: 'center', position: 'relative', justifyContent: 'center' },
  serviceImage: { width: 105, height: 105, borderRadius: 12, backgroundColor: '#f9f9f9' },
  actionButtonWrapper: { position: 'absolute', bottom: -8, width: 85 },
  addButton: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#673ab7', 
    borderRadius: 8, 
    paddingVertical: 6, 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
  },
  addButtonText: { color: '#673ab7', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  
  counterContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#673ab7', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
    elevation: 3
  },
  counterNode: { paddingHorizontal: 8, paddingVertical: 2 },
  counterNodeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counterValueText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  cartBannerContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eaeaea'
  },
  cartBannerInner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    margin: 16, 
    backgroundColor: '#471f8a', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  cartCountText: { color: '#ddd', fontSize: 12, fontWeight: '600' },
  cartTotalPrice: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  viewCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewCartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});