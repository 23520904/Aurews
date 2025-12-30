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

// Hook debounce giữ nguyên
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
        style={[
          styles.postItem,
          {
            backgroundColor: theme.card,
            shadowColor: "#000", // Fix lỗi theme.shadow
          },
        ]}
        onPress={() => {
          track("search_result_selected", {
            postId: item._id,
            slug: item.slug,
          });
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
            <Text
              style={[styles.postCategory, { color: theme.primary }]}
              numberOfLines={1}
            >
              {item.category}
            </Text>
            <Text
              style={[styles.postTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>

          <View style={styles.postFooter}>
            <Image
              source={{
                uri:
                  (item.authorUser as any)?.avatar ||
                  "https://avatar.iran.liara.run/public",
              }}
              style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }}
            />
            <Text style={[styles.postMeta, { color: theme.textSecondary }]}>
              {(item.authorUser as any)?.fullName || "Tác giả"}
            </Text>
            <Text style={[styles.postMeta, { color: theme.textSecondary }]}>
              {" • "}
              {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderUserItem = ({ item, index }: { item: User; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: theme.card,
            shadowColor: "#000",
          },
        ]}
        onPress={() => {
          router.push(`/user/${item._id}` as any);
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.avatar || "https://avatar.iran.liara.run/public",
          }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.userHandle, { color: theme.textSecondary }]}>
            @{item.username}
          </Text>
        </View>

        <View style={[styles.miniBtn, { backgroundColor: theme.background }]}>
          <Ionicons name="arrow-forward" size={16} color={theme.text} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Tìm kiếm
            </Text>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.card,
                  shadowColor: "#000",
                },
              ]}
            >
              <Ionicons name="search" size={20} color={theme.primary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  activeTab === "posts"
                    ? "Tìm bài viết hay..."
                    : "Tìm kiếm thành viên..."
                }
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {!!query && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  style={styles.clearBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* PILL TABS */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === "posts"
                  ? { backgroundColor: theme.primary }
                  : {
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.border,
                    },
              ]}
              onPress={() => setActiveTab("posts")}
            >
              <Ionicons
                name={
                  activeTab === "posts"
                    ? "document-text"
                    : "document-text-outline"
                }
                size={16}
                color={activeTab === "posts" ? "#fff" : theme.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.pillText,
                  {
                    color: activeTab === "posts" ? "#fff" : theme.textSecondary,
                    fontWeight: activeTab === "posts" ? "700" : "500",
                  },
                ]}
              >
                Bài viết
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                activeTab === "users"
                  ? { backgroundColor: theme.primary }
                  : {
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.border,
                    },
              ]}
              onPress={() => setActiveTab("users")}
            >
              <Ionicons
                name={activeTab === "users" ? "people" : "people-outline"}
                size={16}
                color={activeTab === "users" ? "#fff" : theme.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.pillText,
                  {
                    color: activeTab === "users" ? "#fff" : theme.textSecondary,
                    fontWeight: activeTab === "users" ? "700" : "500",
                  },
                ]}
              >
                Mọi người
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* CONTENT LIST */}
      <View style={{ flex: 1 }}>
        {activeTab === "posts" ? (
          <>
            {postsQuery.isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}

            {!postsQuery.isLoading && !debounced && (
              <View style={styles.centerState}>
                {/* --- [THAY ĐỔI] Logo TEXT thay vì IMAGE --- */}
                <View
                  style={{
                    marginBottom: 20,
                    alignItems: "center",
                    opacity: 0.5,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 48,
                      fontWeight: "900",
                      color: theme.text,
                      letterSpacing: -2,
                    }}
                  >
                    Aurews<Text style={{ color: theme.primary }}>.</Text>
                  </Text>
                </View>
                {/* ----------------------------------------- */}

                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.text, fontWeight: "bold" },
                  ]}
                >
                  Tìm kiếm cảm hứng
                </Text>
                <Text
                  style={[styles.subEmptyText, { color: theme.textSecondary }]}
                >
                  Nhập từ khóa để khám phá hàng ngàn bài viết thú vị trên
                  Aurews.
                </Text>
              </View>
            )}

            {!postsQuery.isLoading && debounced && (
              <FlatList
                data={postResults}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={renderPostItem}
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.centerState}>
                    <Ionicons
                      name="sad-outline"
                      size={60}
                      color={theme.border}
                    />
                    <Text style={{ color: theme.textSecondary, marginTop: 10 }}>
                      Không tìm thấy bài viết nào.
                    </Text>
                  </View>
                }
              />
            )}
          </>
        ) : (
          <>
            {usersQuery.isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}

            {!usersQuery.isLoading && !debounced && (
              <View style={styles.centerState}>
                <View
                  style={[styles.iconCircle, { backgroundColor: theme.card }]}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={40}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.text, fontWeight: "bold" },
                  ]}
                >
                  Kết nối cộng đồng
                </Text>
                <Text
                  style={[styles.subEmptyText, { color: theme.textSecondary }]}
                >
                  Tìm kiếm bạn bè, tác giả nổi tiếng để theo dõi ngay hôm nay.
                </Text>
              </View>
            )}

            {!usersQuery.isLoading && debounced && (
              <FlatList
                data={userResults}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={renderUserItem}
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.centerState}>
                    <Ionicons
                      name="sad-outline"
                      size={60}
                      color={theme.border}
                    />
                    <Text style={{ color: theme.textSecondary, marginTop: 10 }}>
                      Không tìm thấy người dùng nào.
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    // Shadow cho iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Shadow cho Android
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    height: "100%",
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },

  // Pill Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  pillTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
  },
  pillText: {
    fontSize: 14,
  },

  // State Styles
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: -40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  subEmptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // List Styles
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Padding cho bottom tab bar
    paddingTop: 10,
  },

  // Post Card (Magazine Style)
  postItem: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 16,
    padding: 10,
    // Shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  postInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  postCategory: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
    opacity: 0.8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  postMeta: {
    fontSize: 11,
    fontWeight: "500",
  },

  // User Card
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: "#f0f0f0",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 13,
  },
  miniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
