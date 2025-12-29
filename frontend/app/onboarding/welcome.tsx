// app/onboarding/welcome.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/onboarding1.jpg")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Chào mừng đến với Aurews</Text>
        <Text style={styles.subtitle}>
          Tham gia cộng đồng để nhận tin tức cá nhân hóa hoặc tiếp tục trải
          nghiệm với tư cách khách.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.primaryText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/onboarding/topics")}
          >
            <Text style={styles.secondaryText}>Tiếp tục với tư cách Khách</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: 200, height: 200, marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: { width: "100%", gap: 16, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: "#b91c1c",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  secondaryText: { color: "#000", fontSize: 16, fontWeight: "600" },
  loginRow: { flexDirection: "row", alignItems: "center" },
  loginLabel: { color: "#666", fontSize: 14 },
  loginLink: { color: "#b91c1c", fontWeight: "bold", fontSize: 14 },
});
