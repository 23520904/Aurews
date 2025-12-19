import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { KeyboardAware } from "../../src/components/KeyboardAware";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { Link } from "expo-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    // UI-only: show confirmation modal (backend wiring is next)
    setIsSent(true);
  };

  return (
    <KeyboardAware style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.svg")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Aurews logo"
        />

        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send a password reset link.
        </Text>

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

          <Button
            title="Send reset link"
            onPress={handleSend}
            style={styles.sendButton}
          />

          <View style={styles.linkRow}>
            <Link href="/(auth)/login" style={styles.link}>
              <Text style={[styles.linkText, styles.login]}>Back to sign in</Text>
            </Link>
          </View>
        </View>
      </View>

      {/* Success modal */}
      <Modal visible={isSent} transparent animationType="slide" onRequestClose={() => setIsSent(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check your email</Text>
            <Text style={styles.modalBody}>
              If the email is registered, we'll send a password reset link. Please check your inbox.
            </Text>

            <View style={styles.modalActions}>
              <Button title="Close" variant="outline" onPress={() => setIsSent(false)} style={{ marginRight: 12, flex: 1 }} />
              <Link href="/(auth)/login" style={{ flex: 1 }}>
                <Button title="Sign in" onPress={() => {}} />
              </Link>
            </View>
          </View>
        </View>
      </Modal>
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
    textAlign: "center",
  },
  form: {
    width: "100%",
    marginTop: 8,
  },
  sendButton: {
    marginTop: 8,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 12,
  },
  linkText: {
    color: "#64748b",
    fontWeight: "600",
  },
  login: {
    color: "#7E000B",
    textDecorationLine: "underline",
  },

  /* Modal styles (consistent with other screens) */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  modalBody: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  modalActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});