import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/hooks/theme.hook";
import { FONTS } from "../src/constants/theme";
import { usePosts } from "../src/hooks/post.hook";
import { useSearchUsers } from "../src/hooks/user.hook";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Post, User } from "../src/types/type";
import { track } from "../src/lib/analytics";
import { Image } from "expo-image";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const colors = useTheme();
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

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
      onPress={() => {
        track("search_result_selected", { postId: item._id, slug: item.slug });
        router.push(`/post/${item.slug}` as any);
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: 80, height: 60, borderRadius: 8 }}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.itemTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
            {item.category} • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        router.push(`/user/${item._id}` as any);
      }}
    >
      <Image
        source={{ uri: item.avatar || "https://avatar.iran.liara.run/public" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.fullName}
        </Text>
        <Text style={[styles.userHandle, { color: colors.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Tìm kiếm</Text>
      </View>

      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            activeTab === "posts" ? "Tìm bài viết..." : "Tìm mọi người..."
          }
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
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
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "posts" && { borderBottomColor: colors.text },
          ]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "posts" ? colors.text : colors.textSecondary,
              },
            ]}
          >
            Bài viết
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "users" && { borderBottomColor: colors.text },
          ]}
          onPress={() => setActiveTab("users")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "users" ? colors.text : colors.textSecondary,
              },
            ]}
          >
            Mọi người
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "posts" ? (
        <>
          {postsQuery.isLoading && (
            <View style={styles.state}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {!postsQuery.isLoading && !debounced && (
            <View style={styles.state}>
              <Ionicons
                name="newspaper-outline"
                size={48}
                color={colors.border}
              />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Nhập từ khóa để tìm bài viết
              </Text>
            </View>
          )}
          {!postsQuery.isLoading && debounced && (
            <FlatList
              data={postResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              renderItem={renderPostItem}
              ListEmptyComponent={
                <View style={styles.state}>
                  <Text style={{ color: colors.textSecondary }}>
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
            <View style={styles.state}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {!usersQuery.isLoading && !debounced && (
            <View style={styles.state}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                Tìm kiếm tác giả và thành viên
              </Text>
            </View>
          )}
          {!usersQuery.isLoading && debounced && (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              renderItem={renderUserItem}
              ListEmptyComponent={
                <View style={styles.state}>
                  <Text style={{ color: colors.textSecondary }}>
                    Không tìm thấy người dùng nào.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  title: { fontSize: 26, fontWeight: "900" },
  searchRow: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, fontSize: 16 },
  clearBtn: { padding: 4 },
  state: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    opacity: 0.7,
  },
  list: { padding: 16, paddingTop: 8 },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  itemMeta: { fontSize: 12 },

  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userName: { fontSize: 16, fontWeight: "bold" },
  userHandle: { fontSize: 14 },

  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
