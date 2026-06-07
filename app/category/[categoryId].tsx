import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CATEGORIES, MOCK_SUBCATEGORIES, MOCK_SERVICES } from '../../utils/mockData';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartTotal, cartCount } = useApp();

  const currentCategory = MOCK_CATEGORIES.find(c => c.id === categoryId);
  const subCategories = MOCK_SUBCATEGORIES.filter(s => s.categoryId === categoryId);
  const [selectedSubCatId, setSelectedSubCatId] = useState(subCategories[0]?.id || '');

  const displayedServices = MOCK_SERVICES.filter(srv => srv.subCategoryId === selectedSubCatId);

  if (!currentCategory) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Category Not Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 1. FIXED GLASS NAVIGATION BAR */}
      <View style={styles.fixedNavBarRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleButton}>
          <Ionicons name="arrow-back" size={22} color="#1b5e20" />
        </TouchableOpacity>
        <Text style={styles.navBarTitle} numberOfLines={1}>{currentCategory.name}</Text>
        <View style={styles.rightNavIcons}>
          <TouchableOpacity style={styles.iconCircleButton}>
            <Ionicons name="search" size={20} color="#1b5e20" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircleButton}>
            <Ionicons name="share-social-outline" size={20} color="#1b5e20" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body Scrolling Layout */}
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 2. FULL WIDTH HERO BANNER IMAGE FRAME */}
        <View style={styles.fullWidthBannerContainer}>
          <Image 
            source={{ uri: currentCategory.bannerImage || 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=600' }} 
            style={styles.fullWidthBannerImage} 
          />
        </View>

        {/* Rating Metrics Layer */}
        <View style={styles.ratingSummaryRow}>
          <Ionicons name="star" size={14} color="#2e7d32" />
          <Text style={styles.ratingTextMain}>
            {currentCategory.rating} <Text style={styles.bookingCountText}>({currentCategory.totalBookings})</Text>
          </Text>
        </View>

        {/* 3. Offer Badging Glass Micro Sliders */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRowContainer}>
          <View style={styles.offerTagCard}>
            <Ionicons name="pricetag" size={14} color="#2e7d32" style={{ marginRight: 6 }} />
            <Text style={styles.offerTagText}>Get visitation fee off <Text style={styles.mutedText}>on orders above ₹499</Text></Text>
          </View>
          <View style={styles.offerTagCard}>
            <Ionicons name="pricetag" size={14} color="#2e7d32" style={{ marginRight: 6 }} />
            <Text style={styles.offerTagText}>Get ₹50 coupon <Text style={styles.mutedText}>After first service</Text></Text>
          </View>
        </ScrollView>

        {/* 4. Subcategory Fluid Glass Grid Layout */}
        <View style={styles.subCatGridSection}>
          {subCategories.map((sub) => {
            const isSelected = sub.id === selectedSubCatId;
            return (
              <TouchableOpacity
                key={sub.id}
                style={styles.subCatGridCard}
                onPress={() => setSelectedSubCatId(sub.id)}
              >
                <View style={[styles.subCatCardImageContainer, isSelected && styles.selectedSubCatCardImageContainer]}>
                  <Ionicons name={sub.icon as any || "construct-outline"} size={26} color={isSelected ? '#fff' : '#2e7d32'} />
                </View>
                <Text style={[styles.subCatCardLabel, isSelected && styles.selectedSubCatCardLabel]}>{sub.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Segment Context Label Header */}
        <View style={styles.listSectionHeader}>
          <Text style={styles.listSectionTitle}>Available Services</Text>
        </View>

        {/* 5. Clean Glass Service Cards Wrapper Container */}
        <View style={styles.servicesContainer}>
          {displayedServices.map((service) => {
            const cartItem = cart.find(item => item.service.id === service.id);
            const count = cartItem ? cartItem.quantity : 0;

            return (
              <View key={service.id} style={styles.serviceRow}>
                <View style={styles.serviceRowLeft}>
                  <Text style={styles.serviceTitleText}>{service.name}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Ionicons name="star" size={12} color="#2e7d32" />
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
                  
                  {/* Micro Glass Action Controls Wrapper Layout */}
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

      {/* Persistent Translucent Bottom Footer Strip */}
      <View style={styles.bottomOfferStrip}>
        <Ionicons name="tag" size={14} color="#1b5e20" style={{ marginRight: 6 }} />
        <Text style={styles.bottomOfferStripText}>Get visitation fee off on orders above ₹499</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#e8f5e9' },
  scrollBody: { flex: 0, backgroundColor: 'transparent' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f5e9' },
  errorText: { color: '#2e7d32', fontWeight: '600' },
  
  // FIXED COMPONENT ALIGNMENT PROPERTIES
  fixedNavBarRow: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 54, 
    paddingHorizontal: 16, 
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  navBarTitle: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginLeft: 8, flex: 1 },
  rightNavIcons: { flexDirection: 'row', gap: 12 },
  iconCircleButton: { padding: 4 },

  scrollContent: { 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 86 : 120 
  },

  // FULL WIDTH HEADER COVER COVER IMAGE
  fullWidthBannerContainer: { 
    width: width, 
    height: 190, 
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  fullWidthBannerImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },

  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 20 },
  ratingTextMain: { fontSize: 14, fontWeight: '700', color: '#2e7d32', marginLeft: 4 },
  bookingCountText: { fontWeight: '400', color: '#4c8c4a' },

  offersRowContainer: { paddingLeft: 16, marginTop: 14, paddingBottom: 4, gap: 10 },
  offerTagCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.6)', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  offerTagText: { fontSize: 12, fontWeight: '600', color: '#1b5e20' },
  mutedText: { fontWeight: '400', color: '#4c8c4a' },

  subCatGridSection: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  subCatGridCard: { width: (width - 52) / 4, alignItems: 'center', marginBottom: 12 },
  subCatCardImageContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0
  },
  selectedSubCatCardImageContainer: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  subCatCardLabel: { fontSize: 11, fontWeight: '600', color: '#4c8c4a', marginTop: 6, textAlign: 'center' },
  selectedSubCatCardLabel: { color: '#1b5e20', fontWeight: '700' },

  listSectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  listSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1b5e20' },

  servicesContainer: { paddingBottom: 120, paddingHorizontal: 16, gap: 12 },
  serviceRow: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 0
  },
  serviceRowLeft: { flex: 1, paddingRight: 12 },
  serviceTitleText: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 4 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  serviceRatingValue: { fontSize: 12, fontWeight: '700', color: '#2e7d32', marginLeft: 4 },
  serviceReviewsCount: { fontWeight: '400', color: '#4c8c4a' },
  servicePriceValue: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 8 },
  dotSeparator: { color: '#4c8c4a' },
  bulletItemText: { fontSize: 12, color: '#388e3c', marginBottom: 2, lineHeight: 16 },
  viewDetailsActionText: { color: '#2e7d32', fontSize: 13, fontWeight: '700', marginTop: 6 },

  serviceRowRight: { width: 100, height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  serviceRowImage: { width: 100, height: 100, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)' },
  
  absoluteButtonFrame: { 
    position: 'absolute', 
    bottom: -6, 
    width: 80, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0
  },
  cleanAddButton: { 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 1)', 
    borderRadius: 8, 
    paddingVertical: 6, 
    alignItems: 'center', 
  },
  cleanAddButtonText: { color: '#2e7d32', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },

  interactiveCounterBox: { 
    flexDirection: 'row', 
    backgroundColor: '#2e7d32', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 5 
  },
  counterActionNode: { paddingHorizontal: 10 },
  counterActionNodeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  counterValueDisplay: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bottomOfferStrip: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 36, 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderTopWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.5)' 
  },
  bottomOfferStripText: { fontSize: 11, color: '#1b5e20', fontWeight: '600' }
});