import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';           // ← Add this
import { MOCK_CATEGORIES, MOCK_RECOMMENDED } from '../../utils/mockData';
import ServiceCard from '../../components/ServiceCard';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Fixed Glass Search Bar */}
      <BlurView intensity={95} tint="light" style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#4a6b4e" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search services..."
            placeholderTextColor="#6b8c70"
            style={styles.searchInput}
          />
        </View>
      </BlurView>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>What service do you need?</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
          >
            {MOCK_CATEGORIES.map((category) => (
              <ServiceCard
                key={category.id}
                imageUri={category.bannerImage}
                title={category.name}
                rating={category.rating}
                subtitle={category.totalBookings}
                onPress={() => router.push({
                  pathname: '/category/[categoryId]',
                  params: { categoryId: category.id }
                })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Recommended Sections */}
        {MOCK_RECOMMENDED.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <View style={styles.rowHeader}>
              <Text style={styles.sectionHeading}>{section.title}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScroll}
            >
              {section.items.map((item) => (
                <ServiceCard
                  key={item.id}
                  imageUri={item.image}
                  title={item.title}
                  rating={item.rating}
                  discount={item.discount}
                  price={item.price}
                  onPress={() => router.push({
                    pathname: '/category/[categoryId]',
                    params: { categoryId: section.categoryId }
                  })}
                />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  masterWrapper: {
    flex: 1,
    backgroundColor: '#F0F9F0',
  },

  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 58,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',   // Slightly more transparent
    borderRadius: 24,
    paddingHorizontal: 18,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#0e2b12',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 0,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f3a24',
    fontWeight: '500',
  },

  scrollBody: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 110, // Space for the fixed search bar
  },

  sectionContainer: {
    marginTop: 28,
    paddingHorizontal: 16,
  },

  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3b1c',
    letterSpacing: -0.4,
  },

  seeAllText: {
    color: '#4a9e4d',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  carouselScroll: {
    paddingBottom: 12,
    paddingRight: 16,
  },
});