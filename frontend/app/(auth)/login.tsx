import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { KeyboardAware } from "../../src/components/KeyboardAware";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { SocialButton } from "../../src/components/SocialButton";
import { Link, router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAware style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.svg")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Aurews logo"
        />

        <Text style={styles.title}>Welcome back to Aurews</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
          />

          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock"
          />

          <Button
            title={isLoading ? "Signing in..." : "Sign in"}
            onPress={handleLogin}
            style={styles.signIn}
            disabled={isLoading}
          />

          <View style={styles.linkRow}>
            <Link href="/(auth)/forgot-password" style={styles.link}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Link>

            <Link href="/(auth)/register" style={styles.link}>
              <Text style={[styles.linkText, styles.register]}>Create account</Text>
            </Link>
          </View>

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton type="google" onPress={() => {}} style={{ marginRight: 12 }} />
            <SocialButton type="facebook" onPress={() => {}} />
          </View>
        </View>
      </View>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
    
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 18,

  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  form: {
    width: "100%",
    marginTop: 8,
  },
  signIn: {
    marginTop: 8,
  },
  link:{paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",},
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  linkText: {
    color: "#7E000B",
    fontWeight: "600",
  },
  register: {
    textDecorationLine: "underline",
  },
  orRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
    borderRadius: 1,
  },
  orText: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  socialRow: {
    marginTop: 16,
    flexDirection: "row",
  },
});