// src/components/GuestView.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface GuestViewProps {
  title?: string;
  description?: string;
}

export default function GuestView({
  title = "Chào mừng đến với Aurews",
  description = "Đăng nhập để trải nghiệm đầy đủ tính năng.",
}: GuestViewProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* LOGO TEXT THAY THẾ IMAGE */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            Aurews<Text style={styles.logoDot}>.</Text>
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Đăng nhập / Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center" },
  content: { alignItems: "center", padding: 32 },

  // Style cho Logo chữ
  logoContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  logoText: {
    fontSize: 48, // Kích thước lớn cho màn hình chào
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -2,
  },
  logoDot: {
    color: "#b91c1c", // Màu đỏ chủ đạo (giống màu nút bấm)
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#111827",
  },
  desc: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#b91c1c",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    // Thêm chút bóng đổ cho nút nổi bật hơn
    shadowColor: "#b91c1c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
