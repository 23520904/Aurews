// app/onboarding/topics.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TOPICS } from "../../src/constants/topics";
import { usePreferenceStore } from "../../src/stores/preference.store";

export default function TopicsScreen() {
  const router = useRouter();
  const { selectedTopics, toggleTopic } = usePreferenceStore();

  const handleContinue = () => {
    router.push("/onboarding/sources");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Chọn chủ đề bạn quan tâm</Text>
        <Text style={styles.subtitle}>
          Chúng tôi sẽ tùy chỉnh bản tin dựa trên sở thích của bạn.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {TOPICS.map((topic) => {
          const isSelected = selectedTopics.includes(topic.id);
          return (
            <TouchableOpacity
              key={topic.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggleTopic(topic.id)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: topic.image }}
                style={styles.image}
                contentFit="cover"
              />
              <View
                style={[styles.overlay, isSelected && styles.overlaySelected]}
              />

              <Text style={styles.topicName}>{topic.name}</Text>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#b91c1c" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.btn,
            selectedTopics.length === 0 && styles.btnDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedTopics.length === 0}
        >
          <Text style={styles.btnText}>Tiếp tục ({selectedTopics.length})</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", lineHeight: 24 },

  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // 2 columns
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f3f4f6",
  },
  cardSelected: {
    borderColor: "#b91c1c",
    borderWidth: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  overlaySelected: {
    backgroundColor: "rgba(185, 28, 28, 0.6)",
  },
  topicName: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  btn: {
    backgroundColor: "#b91c1c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  btnDisabled: {
    backgroundColor: "#fca5a5",
    opacity: 0.8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
