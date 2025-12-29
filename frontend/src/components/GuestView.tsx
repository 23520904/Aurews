// src/components/GuestView.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Image } from "expo-image";
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
        <Image
          source={require("../../assets/images/logo.svg")} // Đảm bảo đường dẫn đúng
          style={{ width: 100, height: 100, marginBottom: 24 }}
          contentFit="contain"
        />
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
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
