// app/(auth)/index.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp(); // Assumes your context has a function that toggles isAuthenticated to true
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (email.trim() && password.trim()) {
      login( email, password ); // Step 8: Sets context isAuthenticated state to true
      // navigate to main app stack
      router.push('/(tabs)' as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.glassCard}>
        <Text style={styles.titleHeading}>Welcome Back</Text>
        <Text style={styles.subtitleText}>Log in to book your next premium service</Text>

        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#4c8c4a"
          style={styles.glassInput}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#4c8c4a"
          secureTextEntry
          style={styles.glassInput}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.primaryGreenButton} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')} style={styles.linkWrapper}>
          <Text style={styles.footerLinkText}>
            Don't have an account? <Text style={styles.boldGreenText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9', justifyContent: 'center', paddingHorizontal: 24 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#122615',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  titleHeading: { fontSize: 24, fontWeight: '800', color: '#1b5e20', marginBottom: 6, textAlign: 'center' },
  subtitleText: { fontSize: 13, color: '#4c8c4a', textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  glassInput: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1b5e20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
    fontWeight: '500',
  },
  primaryGreenButton: {
    backgroundColor: '#2e7d32',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkWrapper: { marginTop: 20, alignItems: 'center' },
  footerLinkText: { fontSize: 13, color: '#4c8c4a' },
  boldGreenText: { color: '#1b5e20', fontWeight: '700' },
});