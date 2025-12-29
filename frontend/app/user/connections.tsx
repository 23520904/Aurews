import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";

// Stores & Hooks
import { useAuthStore } from "../../src/stores/auth.store";
import {
  useFollowers,
  useFollowing,
  useToggleFollow,
} from "../../src/hooks/user.hook";
import { useTheme, useThemeMode } from "../../src/hooks/theme.hook"; // <--- Import Theme Hook
import { Skeleton } from "../../src/components/Skeleton";
import { User } from "../../src/types/type";

export default function ConnectionsScreen() {
  const { type, userId } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  // Lấy theme từ hook
  const theme = useTheme();
  const { mode } = useThemeMode();

  // Xác định đối tượng đang xem danh sách
  const targetUserId = (userId as string) || currentUser?._id;
  const isFollowersTab = type === "followers";
  const title = isFollowersTab ? "Người theo dõi" : "Đang theo dõi";

  // 1. Fetch danh sách
  const {
    data: followersRes,
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers,
  } = useFollowers(targetUserId!);
  const {
    data: followingRes,
    isLoading: isLoadingFollowing,
    refetch: refetchFollowing,
  } = useFollowing(targetUserId!);

  // 2. Fetch danh sách "Đang theo dõi" của CHÍNH NGƯỜI DÙNG
  const { data: myFollowingRes } = useFollowing(currentUser?._id || "");

  const toggleFollowMutation = useToggleFollow();

  // Dữ liệu hiển thị chính
  const userList = useMemo(() => {
    return isFollowersTab
      ? (followersRes as any)?.data || []
      : (followingRes as any)?.data || [];
  }, [isFollowersTab, followersRes, followingRes]);

  const isLoading = isFollowersTab ? isLoadingFollowers : isLoadingFollowing;

  // Kiểm tra xem "Tôi" có đang theo dõi user trong list không
  const checkIsFollowedByMe = (id: string) => {
    if (!currentUser || id === currentUser._id) return false;
    const myFollowing = (myFollowingRes as any)?.data || [];
    return myFollowing.some((u: User) => u._id === id);
  };

  const renderItem = ({ item }: { item: User }) => {
    const isMe = item._id === currentUser?._id;
    const isFollowedByMe = checkIsFollowedByMe(item._id);
    const isMutating =
      toggleFollowMutation.isPending &&
      toggleFollowMutation.variables === item._id;

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user/${item._id}`)}
        >
          <Image
            source={{
              uri: item.avatar || "https://avatar.iran.liara.run/public",
            }}
            style={[styles.avatar, { backgroundColor: theme.border }]} // Đổi màu nền placeholder
          />
          <View style={styles.info}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.fullName}
            </Text>
            <Text
              style={[styles.handle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              @{item.username}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Nút Follow/Unfollow nhanh */}
        {!isMe && currentUser && (
          <TouchableOpacity
            style={[
              styles.btn,
              // Style động dựa trên trạng thái và theme
              isFollowedByMe
                ? {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }
                : {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                    borderWidth: 1,
                  },
              isMutating && { opacity: 0.6 },
            ]}
            disabled={isMutating}
            onPress={() => toggleFollowMutation.mutate(item._id)}
          >
            {isMutating ? (
              <ActivityIndicator
                size="small"
                // Màu spinner: Đen/Trắng tùy nền nút
                color={isFollowedByMe ? theme.text : "#fff"}
              />
            ) : (
              <Text
                style={[
                  styles.btnText,
                  { color: isFollowedByMe ? theme.text : "#fff" },
                ]}
              >
                {isFollowedByMe ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* StatusBar tự động đổi màu icon trắng/đen */}
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((k) => (
            <View key={k} style={[styles.userItem, { marginBottom: 25 }]}>
              <Skeleton width={50} height={50} borderRadius={25} />
              <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={80} height={32} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={userList}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Danh sách trống
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={() =>
            isFollowersTab ? refetchFollowers() : refetchFollowing()
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  listContent: { padding: 20, paddingBottom: 40 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  info: { flex: 1, marginLeft: 12, marginRight: 10 },
  name: { fontWeight: "700", fontSize: 16 },
  handle: { fontSize: 14, marginTop: 2 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "700", fontSize: 13 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 12,
  },
});
