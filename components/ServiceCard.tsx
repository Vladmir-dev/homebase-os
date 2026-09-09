import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceCardProps {
  imageUri?: string;
  title: string;
  rating: number | string;
  subtitle?: string;
  price?: string;
  discount?: string;
  onPress?: () => void;
}

export default function ServiceCard({
  imageUri,
  title,
  rating,
  subtitle,
  price,
  discount,
  onPress,
}: ServiceCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.75}
    >
      <View style={styles.imageBadgeWrapper}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {discount && (
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{title}</Text>

      <View style={styles.ratingRow}>
        <Ionicons name="star" size={13} color="#F59E0B" />
        <Text style={styles.ratingText}>{rating}</Text>
      </View>

      {price ? (
        <Text style={styles.price}>{price}</Text>
      ) : subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 158,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    // elevation: 10,
    overflow: 'hidden',
  },

  imageBadgeWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },

  image: {
    width: '100%',
    height: 138,
    backgroundColor: '#F8FAFC',
  },

  discountTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#000000',           // Vibrant red for better pop
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  discountText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 19,
    marginBottom: 6,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  ratingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 4,
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },

  subtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
    
  },
});