import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CATEGORIES } from '../../utils/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.masterWrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Search Input Box */}
        <View style={styles.searchHeader}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#757575" style={{ marginRight: 8 }} />
            <TextInput 
              placeholder="Search for 'Fan'" 
              placeholderTextColor="#757575"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Dynamic Category Slotted Segment Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>What service do you need?</Text>
          <View style={styles.gridContainer}>
            {MOCK_CATEGORIES.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.gridCard}
                onPress={() => router.push({
                  pathname: '/category/[categoryId]',
                  params: { categoryId: category.id }
                })}
              >
                <Image source={{ uri: category.bannerImage }} style={styles.gridImage} />
                <Text style={styles.gridLabel}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended Slider Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionHeading}>Massage for Men</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            <View style={styles.productSliderCard}>
              <View style={styles.imageBadgeWrapper}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=300' }} style={styles.productSliderImage} />
                <Text style={styles.discountTag}>17% OFF</Text>
              </View>
              <Text style={styles.productSliderTitle} numberOfLines={2}>Quick Comfort Therapy</Text>
              <View style={styles.ratingInline}>
                <Ionicons name="star" size={12} color="#444" />
                <Text style={styles.ratingTextInline}>4.82</Text>
              </View>
              <Text style={styles.priceLine}>₹999 <Text style={styles.strikePrice}>₹1,199</Text></Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Matching Platform Bottom Tab View Simulation */}
    </View>
  );
}

const styles = StyleSheet.create({
  masterWrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  searchHeader: { paddingHorizontal: 16, paddingTop: 55, paddingBottom: 12, backgroundColor: '#fff' },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  searchInput: { flex: 1, fontSize: 15, color: '#000', fontWeight: '500' },
  
  sectionContainer: { marginTop: 24, paddingHorizontal: 16 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 12 },
  seeAllText: { color: '#673ab7', fontWeight: '700', fontSize: 14 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: (width - 44) / 3, alignItems: 'center', marginBottom: 8 },
  gridImage: { width: '100%', height: 95, borderRadius: 12, backgroundColor: '#f5f5f5' },
  gridLabel: { fontSize: 13, fontWeight: '500', color: '#212121', marginTop: 6, textAlign: 'center' },

  horizontalScroll: { paddingBottom: 16 },
  productSliderCard: { width: 150, marginRight: 14 },
  imageBadgeWrapper: { position: 'relative' },
  productSliderImage: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#f5f5f5' },
  discountTag: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    backgroundColor: '#00796b', 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: '700', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  productSliderTitle: { fontSize: 14, fontWeight: '500', color: '#212121', marginTop: 8, lineHeight: 18 },
  ratingInline: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingTextInline: { fontSize: 12, color: '#616161', marginLeft: 4 },
  priceLine: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 4 },
  strikePrice: { fontSize: 12, fontWeight: '400', color: '#757575', textDecorationLine: 'line-through', marginLeft: 4 },

  bottomTabContainer: { 
    flexDirection: 'row', 
    height: 64, 
    borderTopWidth: 1, 
    borderColor: '#f5f5f5', 
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8
  },
  tabNode: { alignItems: 'center', justifyContent: 'center' },
  tabIconCircle: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  activeTabCircle: { backgroundColor: '#000', borderRadius: 6 },
  tabIconText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tabLabel: { fontSize: 11, color: '#757575', marginTop: 4, fontWeight: '500' },
  activeTabLabel: { color: '#000', fontWeight: '700' }
});