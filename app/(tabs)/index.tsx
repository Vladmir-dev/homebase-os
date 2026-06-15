import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MOCK_CATEGORIES, MOCK_RECOMMENDED } from '../../utils/mockData';
import ServiceCard from '../../components/ServiceCard';
import { useApp } from '../../context/AppContext'; 
import PortfolioWorkspace from '../../components/workspace/PortfolioWorkspace';
import GenesisWorkspace from '../../components/workspace/GenesisWorkspace';

export default function HomeScreen() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Destructure context states
  const { activeAsset, assets, setActiveAssetById, isOffline } = useApp();

  return (
    <View style={styles.masterWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 1. FIXED GLASS ARCHITECTURE HEADER */}
      <BlurView intensity={95} tint="light" style={styles.searchHeader}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.switcherButton} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <View style={styles.assetTitleWrapper}>
              <Text style={styles.assetNameText}>{activeAsset?.name ?? 'Select Identity Asset'}</Text>
              <Ionicons name="chevron-down" size={16} color="#1b5e20" style={{ marginLeft: 4 }} />
            </View>
            <View style={styles.escrowBadge}>
              <Text style={styles.badgeText}>Bank Escrowed</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.rightHeaderActions}>
            <Ionicons name={isOffline ? "cloud-offline" : "cloud-done"} size={20} color={isOffline ? "#d32f2f" : "#2e7d32"} />
          </View>
        </View>

        {/* Dropdown Identity Selector Layer */}
        {dropdownOpen && (
          <View style={styles.glassDropdownPanel}>
            {assets.map((asset) => (
              <TouchableOpacity 
                key={asset.id} 
                style={[styles.dropdownRow, activeAsset?.id === asset.id && styles.activeDropdownRow]}
                onPress={() => {
                  setActiveAssetById(asset.id);
                  setDropdownOpen(false);
                }}
              >
                <Ionicons 
                  name={asset.type === 'HOUSEHOLD' ? 'home' : asset.type === 'RENTAL' ? 'business' : 'construct'} 
                  size={16} 
                  color="#2e7d32" 
                  style={{ marginRight: 8 }} 
                />
                <Text style={styles.dropdownRowText}>{asset.name} ({asset.role})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dynamic Context Search bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#4a6b4e" style={{ marginRight: 10 }} />
          <TextInput
            placeholder={
              activeAsset?.type === 'CONSTRUCTION' ? "Search building materials, BOQ..." :
              activeAsset?.type === 'RENTAL' ? "Search tenants, unit IDs or statements..." : "Search services..."
            }
            placeholderTextColor="#6b8c70"
            style={styles.searchInput}
          />
        </View>
      </BlurView>

      {/* Main Dynamic Scrolling Content Body */}
      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. THE ACCOUNTANT LEDGER STRIP COMPONENT */}
        {activeAsset && (
          <View style={styles.accountantCard}>
            <View style={styles.ledgerHeaderRow}>
              <Text style={styles.ledgerLabel}>
                {activeAsset.type === 'RENTAL' ? 'Portfolio A/R Ledger' : 'Global Asset Ledger'}
              </Text>
              <View style={styles.insuranceToggle}><Text style={styles.insuranceToggleText}>🛡️ Micro-Insured</Text></View>
            </View>
            <Text style={styles.ledgerBalance}>UGX {activeAsset.balance.toLocaleString()}</Text>
            <View style={styles.intelligenceBubble}>
              <Text style={styles.intelligenceText}>
                {activeAsset.type === 'RENTAL' && activeAsset.role === 'OWNER' 
                  ? "💡 Collection Notice: 2 Units are in arrears. Total outstanding exposure is UGX 2,400,000."
                  : "💡 Market Insight: Cement prices in Industrial Area dropped 4%. Buy now to optimize building logistics costs."}
              </Text>
            </View>
          </View>
        )}

        {/* 3. DYNAMIC WORKSPACE DISPATCH ENGINE */}
        {activeAsset?.type === 'HOUSEHOLD' && (
          <View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>What service do you need?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
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

            {MOCK_RECOMMENDED.map((section) => (
              <View key={section.title} style={styles.sectionContainer}>
                <View style={styles.rowHeader}>
                  <Text style={styles.sectionHeading}>{section.title}</Text>
                  <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
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
          </View>
        )}

        {/* REFACTOR EDGE: Pass the role property cleanly to isolate Landlord views */}
        {activeAsset?.type === 'RENTAL' && (
          <PortfolioWorkspace role={activeAsset.role} assetId={activeAsset.id} />
        )}

        {activeAsset?.type === 'CONSTRUCTION' && (
          <GenesisWorkspace role={activeAsset.role} assetId={activeAsset.id} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  masterWrapper: { flex: 1, backgroundColor: '#F0F9F0' },
  searchHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 58,
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switcherButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assetTitleWrapper: { flexDirection: 'row', alignItems: 'center' },
  assetNameText: { fontSize: 18, fontWeight: '700', color: '#1a3b1c' },
  escrowBadge: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#2e7d32', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
  rightHeaderActions: { padding: 4 },
  
  glassDropdownPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 14, padding: 8, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.15)',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 } }),
  },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
  activeDropdownRow: { backgroundColor: 'rgba(46, 125, 50, 0.08)' },
  dropdownRowText: { fontSize: 14, fontWeight: '600', color: '#1a3b1c' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24, paddingHorizontal: 18, height: 48, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1f3a24', fontWeight: '500' },
  
  scrollBody: { flex: 1 },
  // Increased top padding padding safety layer to account for dynamic search placeholder scaling 
  scrollContent: { paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 155 : 190, paddingBottom: 32 },
  
  accountantCard: {
    backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.1)', marginBottom: 16,
  },
  ledgerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ledgerLabel: { fontSize: 11, fontWeight: '700', color: '#6b8c70', textTransform: 'uppercase', letterSpacing: 0.5 },
  insuranceToggle: { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  insuranceToggleText: { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
  ledgerBalance: { fontSize: 26, fontWeight: '800', color: '#1b5e20', marginBottom: 8 },
  intelligenceBubble: { backgroundColor: '#f0f4f1', padding: 10, borderRadius: 10 },
  intelligenceText: { fontSize: 12, fontWeight: '500', color: '#2e7d32', lineHeight: 16 },

  sectionContainer: { marginTop: 16, paddingHorizontal: 16 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: '#1a3b1c', letterSpacing: -0.4 },
  seeAllText: { color: '#4a9e4d', fontWeight: '600', fontSize: 14 },
  carouselScroll: { paddingBottom: 12, paddingRight: 16 },
});