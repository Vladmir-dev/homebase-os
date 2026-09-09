import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../../context/AppContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState("test@homebase.com");
  const [password, setPassword] = useState("TestPass123!");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        router.push("/(tabs)" as any);
      } else {
        setErrorMessage(res.error || "Login failed. Please check credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.glassCard}>
        <Text style={styles.titleHeading}>Welcome Back</Text>
        <Text style={styles.subtitleText}>
          Log in to manage your home and services
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#64748B"
          style={styles.glassInput}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748B"
          secureTextEntry
          style={styles.glassInput}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.primaryGreenButton, loading && styles.disabledBtn]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.demoRow}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setEmail("test@homebase.com");
              setPassword("TestPass123!");
              setErrorMessage("");
            }}
          >
            <Text style={styles.demoButtonText}>Owner demo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setEmail("tenant@homebase.com");
              setPassword("TestPass123!");
              setErrorMessage("");
            }}
          >
            <Text style={styles.demoButtonText}>Tenant demo</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("./signup" as any)}
          style={styles.linkWrapper}
        >
          <Text style={styles.footerLinkText}>
            Don't have an account?{" "}
            <Text style={styles.boldGreenText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  titleHeading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ef9a9a",
  },
  errorText: {
    color: "#c62828",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  glassInput: {
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.12)",
    marginBottom: 16,
    fontWeight: "500",
  },
  primaryGreenButton: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledBtn: { opacity: 0.7 },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  linkWrapper: { marginTop: 20, alignItems: "center" },
  footerLinkText: { fontSize: 13, color: "#64748B" },
  boldGreenText: { color: "#1E293B", fontWeight: "700" },
  demoRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  demoButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.12)",
    alignItems: "center",
  },
  demoButtonText: { color: "#2563EB", fontSize: 13, fontWeight: "700" },
});
