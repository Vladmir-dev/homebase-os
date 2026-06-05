import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Built into Expo templates
import { MOCK_CATEGORIES } from '../../utils/mockData';
import { ServiceCategory } from '../../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const handleCategoryPress = (category: ServiceCategory) => {
    // Expo router safe parameter handling. This pushes to a deep page we'll build next.
    router.push({
      pathname: '/category/[categoryId]' as any,
      params: { categoryId: category.id }
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Location & Search Selection */}
      <View style={styles.headerContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color="#673ab7" />
          <Text style={styles.locationText}>Home • Kampala, Central Region</Text>
          <Ionicons name="chevron-down" size={16} color="#000" />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for services (e.g. Electrician)" 
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 2. Promotional Offers Banner Slider */}
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={styles.bannerSlider}
      >
        <View style={[styles.promoBanner, { backgroundColor: '#eedeff' }]}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTag}>17% OFF</Text>
            <Text style={styles.promoTitle}>Premium Grooming for Men</Text>
            <Text style={styles.promoSubtitle}>Top rated experts only</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=200' }} 
            style={styles.promoImage} 
          />
        </View>
        
        <View style={[styles.promoBanner, { backgroundColor: '#dff6ff' }]}>
          <View style={styles.promoTextContainer}>
            <Text style={[styles.promoTag, { backgroundColor: '#0288d1' }]}>NEW</Text>
            <Text style={styles.promoTitle}>Smart Home Inverter Setup</Text>
            <Text style={styles.promoSubtitle}>Free inspection included</Text>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200' }} 
            style={styles.promoImage} 
          />
        </View>
      </ScrollView>

      {/* 3. Main Services Category Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>What service do you need?</Text>
        
        <View style={styles.categoryGrid}>
          {MOCK_CATEGORIES.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: category.bannerImage }} style={styles.categoryImage} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#ffb300" />
                  <Text style={styles.ratingText}>{category.rating}</Text>
                  <Text style={styles.bookingCount}>• {category.totalBookings}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationText: { fontSize: 14, fontWeight: '600', marginHorizontal: 6, color: '#000' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f1f5', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 46 
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  
  bannerSlider: { marginVertical: 16, paddingLeft: 16 },
  promoBanner: { 
    width: width - 48, 
    height: 120, 
    borderRadius: 12, 
    marginRight: 16, 
    flexDirection: 'row', 
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  promoTextContainer: { flex: 1, justifyContent: 'center' },
  promoTag: { 
    backgroundColor: '#673ab7', 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: '700', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  promoTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 2 },
  promoSubtitle: { fontSize: 12, color: '#555' },
  promoImage: { width: 80, height: 80, borderRadius: 8 },

  sectionContainer: { paddingHorizontal: 16, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 16 },
  categoryGrid: { flexDirection: 'column', gap: 16 },
  categoryCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  categoryImage: { width: '100%', height: 150, backgroundColor: '#eee' },
  categoryInfo: { padding: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '600', marginLeft: 4, marginRight: 6 },
  bookingCount: { fontSize: 12, color: '#666' }
});