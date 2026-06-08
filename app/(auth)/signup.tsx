// app/(auth)/signup.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { login } = useApp(); // Using login registration to mutate auth state context
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    if (name.trim() && email.trim() && password.trim()) {
      login(email, password); // Step 8: Instantly updates global state -> triggers unmount of auth stack
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.glassCard}>
        <Text style={styles.titleHeading}>Create Account</Text>
        <Text style={styles.subtitleText}>Join the marketplace ecosystem today</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#4c8c4a"
          style={styles.glassInput}
          value={name}
          onChangeText={setName}
        />

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

        <TouchableOpacity style={styles.primaryGreenButton} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkWrapper}>
          <Text style={styles.footerLinkText}>
            Already have an account? <Text style={styles.boldGreenText}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Re-use style registry matching login layout configuration rules for fluid look
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