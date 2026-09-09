import { Button, Card, Spacing } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, cartTotal } = useApp();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.containerPaddingH,
        paddingBottom: Spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.5)',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {cart.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1586882829491-b81178aa622e?q=80&w=600',
            }}
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#E2E8F0',
            }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: Spacing.lg }}>
            Your cart is empty
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: Spacing.sm }}>
            Add services to get started
          </Text>
          <Button
            title="Browse Services"
            onPress={() => router.replace('/')}
            size="md"
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      ) : (
        <>
          <ScrollView style={{ flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md }} showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <Card key={item.service.id} variant="default">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Image 
                    source={{ uri: item.service.image }} 
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      backgroundColor: '#E2E8F0',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B' }}>
                      {item.service.name}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#000', marginTop: Spacing.sm }}>
                      UGX {item.service.price}
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#2563EB',
                    borderRadius: 8,
                    paddingVertical: Spacing.sm,
                  }}>
                    <TouchableOpacity onPress={() => removeFromCart(item.service.id)} style={{ paddingHorizontal: Spacing.md }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>-</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                      {item.quantity}
                    </Text>
                    <TouchableOpacity onPress={() => addToCart(item.service)} style={{ paddingHorizontal: Spacing.md }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={{
            paddingHorizontal: Spacing.containerPaddingH,
            paddingTop: Spacing.lg,
            paddingBottom: 36,
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B' }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>UGX {cartTotal}</Text>
            </View>
            <Button
              title="Proceed to Checkout"
              onPress={() => router.push('/checkout')}
              size="lg"
            />
          </View>
        </>
      )}
    </View>
  );
}
