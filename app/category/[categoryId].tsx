import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CATEGORIES, MOCK_SUBCATEGORIES, MOCK_SERVICES } from '../../utils/mockData';
import { useApp } from '../../context/AppContext';

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useApp();

  const currentCategory = MOCK_CATEGORIES.find(c => c.id === categoryId);
  const subCategories = MOCK_SUBCATEGORIES.filter(s => s.categoryId === categoryId);
  const [selectedSubCatId, setSelectedSubCatId] = useState(subCategories[0]?.id || '');
  
  const displayedServices = MOCK_SERVICES.filter(srv => srv.subCategoryId === selectedSubCatId);

  if (!currentCategory) {
    return <View style={styles.centered}><Text>Category Not Found</Text></View>;
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header Navigation Bar Component */}
        <View style={styles.navBarRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleButton}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.navBarTitle}>{currentCategory.name}</Text>
          <View style={styles.rightNavIcons}>
            <TouchableOpacity style={styles.iconCircleButton}><Ionicons name="search" size={20} color="#000" /></TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleButton}><Ionicons name="share-social-outline" size={20} color="#000" /></TouchableOpacity>
          </View>
        </View>

        {/* 2. Super Saver Split Promo Banner */}
        <View style={styles.superSaverBanner}>
          <View style={styles.bannerTextSide}>
            <View style={styles.superSaverTag}><Text style={styles.superSaverTagText}>Super saver</Text></View>
            <Text style={styles.bannerHeading}>Affordable repairs starting at just ₹49</Text>
          </View>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=200' }} style={styles.bannerImageSide} />
        </View>

        {/* Rating Metrics Block */}
        <View style={styles.ratingSummaryRow}>
          <Ionicons name="star" size={14} color="#000" />
          <Text style={styles.ratingTextMain}>{currentCategory.rating} <Text style={styles.bookingCountText}>({currentCategory.totalBookings})</Text></Text>
        </View>

        {/* 3. Offer Badging Bar Slider */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRowContainer}>
          <View style={styles.offerTagCard}>
            <Ionicons name="pricetag" size={14} color="#00897b" style={{ marginRight: 6 }} />
            <Text style={styles.offerTagText}>Get visitation fee off <Text style={styles.mutedText}>on orders above ₹499</Text></Text>
          </View>
          <View style={styles.offerTagCard}>
            <Ionicons name="pricetag" size={14} color="#00897b" style={{ marginRight: 6 }} />
            <Text style={styles.offerTagText}>Get ₹50 coupon <Text style={styles.mutedText}>After first service</Text></Text>
          </View>
        </ScrollView>

        <View style={styles.grayDivider} />

        {/* 4. Grid Implementation for Subcategories */}
        <View style={styles.subCatGridSection}>
          {subCategories.map((sub) => {
            const isSelected = sub.id === selectedSubCatId;
            return (
              <TouchableOpacity 
                key={sub.id} 
                style={[styles.subCatGridCard, isSelected && styles.selectedSubCatGridCard]}
                onPress={() => setSelectedSubCatId(sub.id)}
              >
                <View style={styles.subCatCardImageContainer}>
                  <Ionicons name={sub.icon as any || "construct-outline"} size={28} color="#424242" />
                </View>
                <Text style={styles.subCatCardLabel}>{sub.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.grayDivider} />

        {/* Heading Segment Title */}
        <View style={styles.listSectionHeader}>
          <Text style={styles.listSectionTitle}>Switch & socket</Text>
        </View>

        {/* 5. Clean Structured Service Item Rows */}
        <View style={styles.servicesContainer}>
          {displayedServices.map((service) => {
            const cartItem = cart.find(item => item.service.id === service.id);
            const count = cartItem ? cartItem.quantity : 0;

            return (
              <View key={service.id} style={styles.serviceRow}>
                <View style={styles.serviceRowLeft}>
                  <Text style={styles.serviceTitleText}>{service.name}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Ionicons name="star" size={12} color="#00897b" />
                    <Text style={styles.serviceRatingValue}>{service.rating} <Text style={styles.serviceReviewsCount}>{service.reviewsCount}</Text></Text>
                  </View>
                  <Text style={styles.servicePriceValue}>₹{service.price} <Text style={styles.dotSeparator}>•</Text> {service.durationMinutes} mins</Text>
                  
                  {service.descriptionPoints.map((point, index) => (
                    <Text key={index} style={styles.bulletItemText}>• {point}</Text>
                  ))}
                  
                  <TouchableOpacity><Text style={styles.viewDetailsActionText}>View details</Text></TouchableOpacity>
                </View>

                <View style={styles.serviceRowRight}>
                  <Image source={{ uri: service.image }} style={styles.serviceRowImage} />
                  
                  {/* Absolute Nested Add/Counter Button overlay widget */}
                  <View style={styles.absoluteButtonFrame}>
                    {count > 0 ? (
                      <View style={styles.interactiveCounterBox}>
                        <TouchableOpacity style={styles.counterActionNode} onPress={() => removeFromCart(service.id)}>
                          <Text style={styles.counterActionNodeText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterValueDisplay}>{count}</Text>
                        <TouchableOpacity style={styles.counterActionNode} onPress={() => addToCart(service)}>
                          <Text style={styles.counterActionNodeText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.cleanAddButton} onPress={() => addToCart(service)}>
                        <Text style={styles.cleanAddButtonText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Center Utility Menu Toggle Indicator */}
      <TouchableOpacity style={styles.floatingMenuButton}>
        <Ionicons name="menu" size={16} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.floatingMenuButtonText}>Menu</Text>
      </TouchableOpacity>

      {/* Persistent Bottom Offer Presentation Footer Strip */}
      <View style={styles.bottomOfferStrip}>
        <Ionicons name="tag" size={14} color="#00796b" style={{ marginRight: 6 }} />
        <Text style={styles.bottomOfferStripText}>Get visitation fee off on orders above ₹499</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  scrollBody: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  navBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 12, paddingBottom: 12 },
  navBarTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginLeft: 8, flex: 1 },
  rightNavIcons: { flexDirection: 'row', gap: 12 },
  iconCircleButton: { padding: 4 },

  superSaverBanner: { flexDirection: 'row', backgroundColor: '#fff8e1', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: '#ffe082' },
  bannerTextSide: { flex: 1, padding: 16, justifyContent: 'center' },
  superSaverTag: { backgroundColor: '#00b0ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  superSaverTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bannerHeading: { fontSize: 16, fontWeight: '700', color: '#000', lineHeight: 22 },
  bannerImageSide: { width: 110, height: 110, resizeMode: 'cover' },

  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 14 },
  ratingTextMain: { fontSize: 14, fontWeight: '700', color: '#000', marginLeft: 4 },
  bookingCountText: { fontWeight: '400', color: '#616161' },

  offersRowContainer: { paddingLeft: 16, marginTop: 14, paddingBottom: 4, gap: 10 },
  offerTagCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  offerTagText: { fontSize: 12, fontWeight: '600', color: '#212121' },
  mutedText: { fontWeight: '400', color: '#757575' },

  grayDivider: { height: 8, backgroundColor: '#f5f5f5', width: '100%', marginTop: 16 },

  subCatGridSection: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  subCatGridCard: { width: (Dimensions.get('window').width - 56) / 4, alignItems: 'center', marginBottom: 12 },
  selectedSubCatGridCard: { opacity: 0.9 },
  subCatCardImageContainer: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  subCatCardLabel: { fontSize: 11, fontWeight: '500', color: '#212121', marginTop: 6, textAlign: 'center' },

  listSectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listSectionTitle: { fontSize: 20, fontWeight: '700', color: '#000' },

  servicesContainer: { paddingBottom: 120 },
  serviceRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  serviceRowLeft: { flex: 1, paddingRight: 12 },
  serviceTitleText: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 4 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  serviceRatingValue: { fontSize: 12, fontWeight: '700', color: '#00796b', marginLeft: 4 },
  serviceReviewsCount: { fontWeight: '400', color: '#757575' },
  servicePriceValue: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 8 },
  dotSeparator: { color: '#757575' },
  bulletItemText: { fontSize: 12, color: '#616161', marginBottom: 2, lineHeight: 16 },
  viewDetailsActionText: { color: '#673ab7', fontSize: 13, fontWeight: '700', marginTop: 6 },

  serviceRowRight: { width: 110, height: 110, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  serviceRowImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#f5f5f5' },
  absoluteButtonFrame: { position: 'absolute', bottom: -4, width: 76, backgroundColor: '#fff', borderRadius: 6 },
  cleanAddButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, paddingVertical: 6, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  cleanAddButtonText: { color: '#673ab7', fontWeight: '800', fontSize: 12 },

  interactiveCounterBox: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#673ab7', borderRadius: 6, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  counterActionNode: { paddingHorizontal: 8 },
  counterActionNodeText: { color: '#673ab7', fontSize: 14, fontWeight: '700' },
  counterValueDisplay: { color: '#673ab7', fontWeight: '700', fontSize: 13 },

  floatingMenuButton: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#212121', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, elevation: 4 },
  floatingMenuButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  bottomOfferStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, backgroundColor: '#e8f5e9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderColor: '#c8e6c9' },
  bottomOfferStripText: { fontSize: 11, color: '#2e7d32', fontWeight: '500' }
});