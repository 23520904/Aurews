// app/author/manage.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

// Hooks & Store
import { useAuthStore } from "../../src/stores/auth.store";
// IMPORT HOOK MỚI: useInfiniteMyPosts
import {
  useInfiniteMyPosts, // <--- Dùng cái này
  useDeletePost,
  useRestorePost,
} from "../../src/hooks/post.hook";
import { useTheme, useThemeMode } from "../../src/hooks/theme.hook";
import { SHADOWS } from "../../src/constants/theme";
import { Post, PostStatus } from "../../src/types/type";

export default function ManagePostsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const theme = useTheme();
  const { mode } = useThemeMode();

  // --- STATE ---
  const [filter, setFilter] = useState<"ALL" | PostStatus>("ALL");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // State tìm kiếm
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // --- DATA FETCHING (INFINITE SCROLL) ---
  const {
    data, // Dữ liệu dạng Pages (Mảng của các mảng)
    isLoading,
    fetchNextPage, // Hàm gọi trang tiếp theo
    hasNextPage, // Kiểm tra còn trang không
    isFetchingNextPage, // Đang tải trang tiếp theo?
    refetch,
    isRefetching,
  } = useInfiniteMyPosts(10, {
    // Load 10 bài mỗi lần
    searchTerm: debouncedSearch,
    status: filter === "ALL" ? undefined : filter,
  });

  // GỘP DỮ LIỆU: Nối tất cả các trang lại thành 1 mảng duy nhất
  const allPosts = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.posts) || [];
  }, [data]);

  // Hooks Mutation
  const deleteMutation = useDeletePost();
  const restoreMutation = useRestorePost();

  // Load lại khi focus màn hình
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch, filter])
  );

  // --- ACTIONS ---
  const handleOpenMenu = (post: Post) => {
    setSelectedPost(post);
    setMenuVisible(true);
  };

  const handleAction = (action: "view" | "edit" | "delete" | "restore") => {
    // ... (Giữ nguyên logic handleAction của bạn - không thay đổi)
    setMenuVisible(false);
    if (!selectedPost) return;

    if (action === "view") {
      router.push(`/post/${selectedPost.slug}`);
    } else if (action === "edit") {
      router.push({
        pathname: "/author/editor/[id]",
        params: { id: selectedPost._id },
      });
    } else if (action === "restore") {
      Alert.alert("Khôi phục", "Khôi phục bài viết về nháp?", [
        { text: "Hủy", style: "cancel" },
        { text: "OK", onPress: () => restoreMutation.mutate(selectedPost._id) },
      ]);
    } else if (action === "delete") {
      Alert.alert("Xóa", "Bạn có chắc chắn muốn xóa?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(selectedPost._id),
        },
      ]);
    }
  };

  // --- RENDER FOOTER (Loading spinner khi cuộn xuống) ---
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  // --- HELPER RENDER ITEM (Giữ nguyên) ---
  const getStatusBadge = (status: PostStatus) => {
    let color = theme.textSecondary;
    let bg = theme.border;
    let label: string = status;
    switch (status) {
      case PostStatus.Published:
        color = "#15803d";
        bg = "#dcfce7";
        label = "Đã đăng";
        break;
      case PostStatus.Draft:
        color = "#a16207";
        bg = "#fef9c3";
        label = "Nháp";
        break;
      case PostStatus.Scheduled:
        color = "#2563eb";
        bg = "#dbeafe";
        label = "Đã lên lịch";
        break;
      case PostStatus.Archived:
        color = "#b91c1c";
        bg = "#fee2e2";
        label = "Lưu trữ";
        break;
      default:
        label = status;
    }
    if (mode === "dark") {
      if (status === PostStatus.Published) bg = "#14532d";
      if (status === PostStatus.Draft) bg = "#713f12";
      if (status === PostStatus.Archived) bg = "#7f1d1d";
      color = "#fff";
    }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }) => (
    <View style={[styles.card, { backgroundColor: theme.card }, SHADOWS.small]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() =>
          router.push({
            pathname: "/author/editor/[id]",
            params: { id: item._id },
          })
        }
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={[styles.category, { color: theme.primary }]}>
            {item.category?.toUpperCase() || "UNCATEGORIZED"}
          </Text>
          <Text
            style={[styles.postTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title || "Không có tiêu đề"}
          </Text>
          <View style={styles.metaRow}>
            {getStatusBadge(item.status)}
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {new Date(item.publishTime || item.createdAt).toLocaleDateString(
                "vi-VN"
              )}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => handleOpenMenu(item)}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* HEADER & SEARCH BAR GIỮ NGUYÊN */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Quản lý bài viết
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/author/editor/[id]",
              params: { id: "new" },
            })
          }
        >
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.searchContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Tìm kiếm..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TABS GIỮ NGUYÊN */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            "ALL",
            PostStatus.Published,
            PostStatus.Draft,
            PostStatus.Archived,
            PostStatus.Scheduled,
          ]}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isActive = filter === item;
            const labelMap: Record<string, string> = {
              ALL: "Tất cả",
              [PostStatus.Published]: "Đã đăng",
              [PostStatus.Draft]: "Nháp",
              [PostStatus.Archived]: "Lưu trữ",
              [PostStatus.Scheduled]: "Đã lên lịch",
            };
            return (
              <TouchableOpacity
                onPress={() => setFilter(item as any)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? theme.primary : theme.card,
                    borderWidth: 1,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? "#fff" : theme.textSecondary,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {labelMap[item] || item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* LIST BÀI VIẾT (INFINITE) */}
      <FlatList
        data={allPosts} // Dữ liệu đã gộp
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        // Logic Refresh (Kéo xuống để làm mới)
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        // Logic Load More (Kéo tới đáy để tải tiếp)
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5} // Tải khi còn 50% màn hình phía dưới
        ListFooterComponent={renderFooter} // Hiển thị spinner ở đáy
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Chưa có bài viết nào
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )
        }
      />

      {/* MODAL GIỮ NGUYÊN */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuSheet, { backgroundColor: theme.card }]}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>
                {selectedPost?.title}
              </Text>
              {filter !== PostStatus.Archived ? (
                <>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleAction("view")}
                  >
                    <Text style={{ color: theme.text }}>Xem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleAction("edit")}
                  >
                    <Text style={{ color: theme.text }}>Sửa</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => handleAction("restore")}
                >
                  <Text style={{ color: theme.success }}>Khôi phục</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleAction("delete")}
              >
                <Text style={{ color: theme.error }}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Copy lại styles cũ, không thay đổi)
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  backBtn: { padding: 4 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, height: "100%", fontSize: 15 },
  tabsContainer: { paddingVertical: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
  },
  cardContent: { flexDirection: "row", flex: 1, gap: 12 },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  info: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  category: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { fontSize: 11 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  menuBtn: { padding: 4, position: "absolute", top: 8, right: 8 },
  emptyContainer: { alignItems: "center", marginTop: 60, opacity: 0.7 },
  emptyText: { marginTop: 12, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  menuOption: { paddingVertical: 12 },
});
