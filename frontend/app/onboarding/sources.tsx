// app/onboarding/sources.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SOURCES } from "../../src/constants/sources";
import { usePreferenceStore } from "../../src/stores/preference.store";

export default function SourcesScreen() {
  const router = useRouter();
  const { selectedSources, toggleSource } = usePreferenceStore();

  const handleFinish = () => {
    router.replace("/(tabs)");
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedSources.includes(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: item.logo }}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity
          style={[styles.followBtn, isSelected && styles.followBtnActive]}
          onPress={() => toggleSource(item.id)}
        >
          <Text
            style={[styles.followText, isSelected && styles.followTextActive]}
          >
            {isSelected ? "Đang theo dõi" : "Theo dõi"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn nguồn tin</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={SOURCES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3} // Chia 3 cột
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Tìm kiếm nguồn tin..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Ionicons name="search" size={20} color="#6b7280" />
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish} style={styles.nextButton}>
          <Text style={styles.nextText}>Bắt đầu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#000" },
  list: { paddingHorizontal: 16 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24,
    backgroundColor: "#f9fafb",
  },
  input: { flex: 1, fontSize: 16, color: "#000" },

  card: { flex: 1, alignItems: "center", marginBottom: 20 },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: { width: 50, height: 50 },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },

  followBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#b91c1c",
    minWidth: 90,
    alignItems: "center",
  },
  followBtnActive: { backgroundColor: "#b91c1c" },
  followText: { color: "#b91c1c", fontWeight: "600", fontSize: 12 },
  followTextActive: { color: "#fff" },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#b91c1c",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  nextText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  skipButton: { padding: 14 },
  skipText: { color: "#6b7280", fontSize: 16, fontWeight: "500" },
});
