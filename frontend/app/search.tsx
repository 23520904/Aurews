import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/hooks/theme.hook";
import { usePosts } from "../src/hooks/post.hook";
import { useSearchUsers } from "../src/hooks/user.hook";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Post, User } from "../src/types/type";
import { track } from "../src/lib/analytics";
import { Image } from "expo-image";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Các từ khóa xu hướng giả lập
const TRENDING_TAGS = ["AI", "Startup", "Review xe", "Chứng khoán", "Sức khỏe", "Du lịch"];

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");

  // 1. Query Tìm kiếm
  const postsQuery = usePosts(
    debounced && activeTab === "posts"
      ? { searchTerm: debounced, status: "published", limit: 50 }
      : undefined
  );

  const usersQuery = useSearchUsers(
    debounced && activeTab === "users" ? debounced : ""
  );

  useEffect(() => {
    if (!debounced) return;
    track("search_started", { query: debounced, type: activeTab });
  }, [debounced, activeTab]);

  const postResults = useMemo(
    () => postsQuery.data?.posts || [],
    [postsQuery.data]
  );

  const userResults = useMemo(
    () => usersQuery.data?.data || [],
    [usersQuery.data]
  );

  // --- RENDER ITEMS ---
  const renderPostItem = ({ item, index }: { item: Post; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.postItem, { backgroundColor: theme.card, shadowColor: "#000" }]}
        onPress={() => {
          track("search_result_selected", { postId: item._id, slug: item.slug });
          router.push(`/post/${item.slug}` as any);
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.postThumb}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.postInfo}>
          <View>
            <Text style={[styles.postCategory, { color: theme.primary }]} numberOfLines={1}>
              {item.category}
            </Text>
            <Text style={[styles.postTitle, { color: theme.text }]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={styles.postFooter}>
            <Image
              source={{ uri: (item.authorUser as any)?.avatar || "https://avatar.iran.liara.run/public" }}
              style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }}
            />
            <Text style={[styles.postMeta, { color: theme.textSecondary }]}>
              {(item.authorUser as any)?.fullName || "Tác giả"}
            </Text>
            <Text style={[styles.postMeta, { color: theme.textSecondary }]}>
              {" • "}
              {new Date(item.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderUserItem = ({ item, index }: { item: User; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.card, shadowColor: "#000" }]}
        onPress={() => router.push(`/user/${item._id}` as any)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatar || "https://avatar.iran.liara.run/public" }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.fullName}</Text>
          <Text style={[styles.userHandle, { color: theme.textSecondary }]}>@{item.username}</Text>
        </View>
        <View style={[styles.miniBtn, { backgroundColor: theme.background }]}>
          <Ionicons name="arrow-forward" size={16} color={theme.text} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // --- COMPONENT: TRENDING + EMPTY STATE ---
  const TrendingAndEmptyState = () => (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardDismissMode="on-drag"
    >
      {/* 1. Từ khóa nổi bật (Ở trên cùng) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Từ khóa nổi bật</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {TRENDING_TAGS.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.tagPill, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setQuery(tag)}
            >
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '500' }}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Logo & Text (Ở giữa phần còn lại) */}
      <View style={[styles.centerState, { justifyContent: 'flex-start', paddingTop: 60, marginTop: 0 }]}>
        <View style={{ marginBottom: 20, alignItems: "center", opacity: 0.5 }}>
          <Text style={{ fontSize: 48, fontWeight: "900", color: theme.text, letterSpacing: -2 }}>
            Aurews<Text style={{ color: theme.primary }}>.</Text>
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.text, fontWeight: "bold" }]}>
          Tìm kiếm cảm hứng
        </Text>
        <Text style={[styles.subEmptyText, { color: theme.textSecondary }]}>
          Nhập từ khóa để khám phá hàng ngàn bài viết thú vị trên Aurews.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          {/* HEADER CÓ NÚT BACK */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: theme.card }]}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Tìm kiếm
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: theme.card, shadowColor: "#000" }]}>
              <Ionicons name="search" size={20} color={theme.primary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={activeTab === "posts" ? "Tìm bài viết, chủ đề..." : "Tìm thành viên..."}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* PILL TABS */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === "posts" ? { backgroundColor: theme.primary } : { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
              ]}
              onPress={() => setActiveTab("posts")}
            >
              <Ionicons name={activeTab === "posts" ? "document-text" : "document-text-outline"} size={16} color={activeTab === "posts" ? "#fff" : theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.pillText, { color: activeTab === "posts" ? "#fff" : theme.textSecondary, fontWeight: activeTab === "posts" ? "700" : "500" }]}>Bài viết</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === "users" ? { backgroundColor: theme.primary } : { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
              ]}
              onPress={() => setActiveTab("users")}
            >
              <Ionicons name={activeTab === "users" ? "people" : "people-outline"} size={16} color={activeTab === "users" ? "#fff" : theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.pillText, { color: activeTab === "users" ? "#fff" : theme.textSecondary, fontWeight: activeTab === "users" ? "700" : "500" }]}>Mọi người</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* CONTENT AREA */}
      <View style={{ flex: 1 }}>
        {!debounced ? (
          // [UPDATED] HIỂN THỊ TRENDING + EMPTY STATE (Không hiện bài đề xuất)
          activeTab === "posts" ? <TrendingAndEmptyState /> : null
        ) : (
          // HIỂN THỊ KẾT QUẢ TÌM KIẾM (Giữ nguyên logic)
          activeTab === "posts" ? (
            <FlatList
              data={postResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={renderPostItem}
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={[styles.centerState, { marginTop: 0 }]}>
                  <Ionicons name="sad-outline" size={60} color={theme.border} />
                  <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Không tìm thấy bài viết nào.</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={renderUserItem}
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={[styles.centerState, { marginTop: 0 }]}>
                  <Ionicons name="sad-outline" size={60} color={theme.border} />
                  <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Không tìm thấy người dùng nào.</Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },

  // Search Bar
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 52, borderRadius: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  input: { flex: 1, fontSize: 16, marginLeft: 10, height: "100%", fontWeight: "500" },
  clearBtn: { padding: 4 },

  // Pill Tabs
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 10, gap: 12 },
  pillTab: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30 },
  pillText: { fontSize: 14 },

  // List Styles
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },

  // Trending Section
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  tagPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    alignSelf: 'flex-start', marginBottom: 6
  },

  // Post Card
  postItem: {
    flexDirection: "row", marginBottom: 16, borderRadius: 16, padding: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  postThumb: { width: 90, height: 90, borderRadius: 12, backgroundColor: "#f0f0f0" },
  postInfo: { flex: 1, paddingLeft: 12, justifyContent: "space-between", paddingVertical: 2 },
  postCategory: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 4, opacity: 0.8 },
  postTitle: { fontSize: 15, fontWeight: "700", lineHeight: 22, letterSpacing: -0.3 },
  postFooter: { flexDirection: "row", alignItems: "center" },
  postMeta: { fontSize: 11, fontWeight: "500" },

  // User Card & States
  userItem: {
    flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 14, borderRadius: 16,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14, backgroundColor: "#f0f0f0" },
  userName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  userHandle: { fontSize: 13 },
  miniBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // Center State (Empty)
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 18, marginBottom: 8 },
  subEmptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});