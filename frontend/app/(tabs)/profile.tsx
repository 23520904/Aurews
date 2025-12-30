import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Stores & Hooks
import { useAuthStore } from "../../src/stores/auth.store";
import {
  useLikedPosts,
  useReadingHistory,
  useMyProfile,
} from "../../src/hooks/user.hook";
import { Post, UserRole } from "../../src/types/type";
import {
  useTheme,
  useThemeMode,
  useAnimatedTheme,
} from "../../src/hooks/theme.hook";

// Components
import GuestView from "../../src/components/GuestView";
import { Skeleton } from "../../src/components/Skeleton";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"liked" | "recent">("liked");

  // Theme
  const theme = useTheme();
  const { backgroundStyle } = useAnimatedTheme();

  // Animation
  const scrollY = useSharedValue(0);

  // 1. Fetch Data
  const {
    data: profileResponse,
    refetch: refetchProfile,
    isLoading: isLoadingProfile,
  } = useMyProfile();

  const {
    data: likedPostsData,
    isLoading: isLoadingLiked,
    refetch: refetchLiked,
  } = useLikedPosts();

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useReadingHistory();

  // 2. Compute Data
  const displayUser = useMemo(() => {
    return (profileResponse as any)?.data || authUser;
  }, [profileResponse, authUser]);

  const likedPosts = useMemo(
    () => likedPostsData?.data || [],
    [likedPostsData]
  );

  const recentPosts = useMemo(
    () =>
      historyData?.data?.map((item: any) => item.post).filter(Boolean) || [],
    [historyData]
  );

  const displayPosts = activeTab === "liked" ? likedPosts : recentPosts;
  const isLoadingList =
    activeTab === "liked" ? isLoadingLiked : isLoadingHistory;

  // 3. Handlers
  const onRefresh = useCallback(async () => {
    if (isAuthenticated) {
      await Promise.all([refetchProfile(), refetchLiked(), refetchHistory()]);
    }
  }, [isAuthenticated, refetchProfile, refetchLiked, refetchHistory]);

  const handleStatPress = (type: "likes" | "following" | "followers") => {
    if (type === "likes") {
      setActiveTab("liked");
    } else {
      router.push({
        pathname: "/user/connections",
        params: { type, userId: displayUser?._id },
      });
    }
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerLogoStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [60, 100],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0.75],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const contextTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [90, 130],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [90, 130],
      [10, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // 4. Render Components
  const renderRoleBadge = () => {
    if (displayUser?.role === UserRole.Admin) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: "#FFD700" }]}>
          <MaterialCommunityIcons name="shield-crown" size={12} color="#fff" />
          <Text style={styles.roleText}>ADMIN</Text>
        </View>
      );
    }
    if (displayUser?.role === UserRole.Author) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: "#3b82f6" }]}>
          <MaterialCommunityIcons
            name="fountain-pen-tip"
            size={12}
            color="#fff"
          />
          <Text style={styles.roleText}>AUTHOR</Text>
        </View>
      );
    }
    return null;
  };

  const renderPostItem = (post: Post, index: number) => (
    // ... (Giữ nguyên logic render Post) ...
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      key={post._id}
    >
      <TouchableOpacity
        style={[
          styles.postItem,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={() => router.push(`/post/${post.slug}` as any)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: post.thumbnail }}
          style={styles.postImage}
          contentFit="cover"
        />
        <View style={styles.postContent}>
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={[styles.postCategory, { color: theme.primary }]}>
                {post.category}
              </Text>
              <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[styles.postTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {post.title}
            </Text>
          </View>
          <View style={styles.postMeta}>
            <Image
              source={{
                uri: (post.authorUser as any)?.avatar || post.author?.avatar,
              }}
              style={styles.miniAvatar}
            />
            <Text
              style={[styles.authorName, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {(post.authorUser as any)?.fullName || post.author?.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!isAuthenticated) {
    return (
      <GuestView
        title="Hồ sơ cá nhân"
        description="Đăng nhập để xem thông tin của bạn."
      />
    );
  }

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* FLOATING HEADER */}
        <View style={styles.floatingHeader}>
          <Animated.View style={[styles.headerLogoContainer, headerLogoStyle]}>
            <Text style={[styles.logo, { color: theme.text }]}>
              Aurews<Text style={{ color: theme.primary }}>.</Text>
            </Text>
          </Animated.View>

          <Animated.View
            style={[styles.contextTitleContainer, contextTitleStyle]}
          >
            <Text style={[styles.contextTitle, { color: theme.text }]}>
              Hồ sơ
            </Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingProfile}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {/* PROFILE HEADER SECTION */}
          <View style={styles.profileHeader}>
            <View style={styles.topRow}>
              {/* AVATAR */}
              <View>
                <Image
                  source={{
                    uri:
                      displayUser?.avatar ||
                      "https://avatar.iran.liara.run/public",
                  }}
                  style={[styles.avatar, { borderColor: theme.border }]}
                  contentFit="cover"
                />
              </View>

              {/* STATS */}
              <View style={styles.statsContainer}>
                <TouchableOpacity
                  onPress={() => handleStatPress("likes")}
                  style={styles.statItem}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {likedPosts.length}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Likes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatPress("followers")}
                  style={styles.statItem}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {displayUser?.followersCount || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Followers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatPress("following")}
                  style={styles.statItem}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {displayUser?.followingCount || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Following
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BIO SECTION */}
            <View style={styles.bioSection}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={[styles.fullName, { color: theme.text }]}>
                  {displayUser?.fullName}
                </Text>
                {renderRoleBadge()}
              </View>
              <Text style={[styles.username, { color: theme.textSecondary }]}>
                @{displayUser?.username}
              </Text>
              <Text style={[styles.bio, { color: theme.text }]}>
                {displayUser?.bio || "Chưa có tiểu sử."}
              </Text>
            </View>

            {/* ACTIONS REMOVED - MOVED TO SETTINGS */}
          </View>

          {/* TABS */}
          <View
            style={[styles.tabsContainer, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "liked" && { borderBottomColor: theme.text },
              ]}
              onPress={() => setActiveTab("liked")}
            >
              <Ionicons
                name={activeTab === "liked" ? "heart" : "heart-outline"}
                size={24}
                color={activeTab === "liked" ? theme.text : theme.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "recent" && { borderBottomColor: theme.text },
              ]}
              onPress={() => setActiveTab("recent")}
            >
              <Ionicons
                name={activeTab === "recent" ? "time" : "time-outline"}
                size={24}
                color={
                  activeTab === "recent" ? theme.text : theme.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          {/* LIST */}
          <View style={styles.listContainer}>
            {isLoadingList ? (
              <View style={{ marginTop: 20 }}>
                <Skeleton
                  height={100}
                  borderRadius={12}
                  style={{ marginBottom: 16 }}
                />
                <Skeleton
                  height={100}
                  borderRadius={12}
                  style={{ marginBottom: 16 }}
                />
              </View>
            ) : displayPosts.length > 0 ? (
              displayPosts.map((post: Post, index: number) =>
                renderPostItem(post, index)
              )
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={
                    activeTab === "liked"
                      ? "heart-dislike-outline"
                      : "timer-outline"
                  }
                  size={64}
                  color={theme.border}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  {activeTab === "liked"
                    ? "No liked posts yet."
                    : "Reading history is empty."}
                </Text>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingHeader: {
    height: 60,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
    position: "relative",
  },
  headerLogoContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  contextTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  searchButton: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  profileHeader: {
    padding: 16,
    paddingTop: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },
  bioSection: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  listContainer: {
    padding: 16,
  },
  postItem: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  postImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  postContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },
  postCategory: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  authorName: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.7,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
