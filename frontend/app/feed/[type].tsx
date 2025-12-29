// app/feed/[type].tsx
import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

import { Post } from "../../src/types/type";
import { usePosts } from "../../src/hooks/post.hook";
import ArticleCard from "../../src/components/ArticleCard";

export default function FeedListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  const listType = Array.isArray(type) ? type[0] : type;

  // Map params
  const queryParams = useMemo(() => {
    if (!listType) return {};
    const lower = listType.toLowerCase();
    if (lower === "trending") return { limit: 20 };
    if (lower === "latest") return { order: "desc", limit: 20 };
    return { category: lower, limit: 20 };
  }, [listType]);

  const {
    data: postsData,
    isLoading,
    refetch,
    isRefetching,
  } = usePosts(queryParams);
  const posts = postsData?.posts || [];

  const getTitle = () => {
    if (!listType) return "Danh sách";
    if (listType === "trending") return "Nổi bật";
    if (listType === "latest") return "Mới nhất";
    return listType.charAt(0).toUpperCase() + listType.slice(1);
  };

  const pageTitle = getTitle();

  const handlePressPost = useCallback(
    (slug: string) => {
      router.push(`/post/${slug}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <ArticleCard post={item} onPress={handlePressPost} />
    ),
    [handlePressPost]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#b91c1c" />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyText}>
                  Không tìm thấy bài viết nào.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { flex: 1, minHeight: 2 }, // minHeight fix for FlashList

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },

  listContent: { padding: 16, paddingBottom: 40 },

  emptyContainer: { alignItems: "center", marginTop: 100, gap: 12 },
  emptyText: { color: "#64748b", fontSize: 16, fontWeight: "500" },
});
