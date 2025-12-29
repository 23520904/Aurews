import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useInfinitePosts } from "../../src/hooks/post.hook";
import {
  useUserPublicProfile,
  useFollowers,
  useFollowing,
  useToggleFollow,
} from "../../src/hooks/user.hook";
import {
  useTheme,
  useThemeMode,
  useAnimatedTheme,
} from "../../src/hooks/theme.hook";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  FadeInDown,
} from "react-native-reanimated";
import { Post, UserRole } from "../../src/types/type";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { backgroundStyle } = useAnimatedTheme();

  // Animation
  const scrollY = useSharedValue(0);

  const { data: userData, isLoading: isLoadingUser } = useUserPublicProfile(
    id as string
  );
  const user = userData?.data;

  const { data: postsData, isLoading: isLoadingPosts } = useInfinitePosts(10, {
    userId: id as string,
  });

  const posts = useMemo(() => {
    return postsData?.pages.flatMap((page: any) => page.posts) || [];
  }, [postsData]);

  const { mutate: toggleFollow } = useToggleFollow();

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

  const renderRoleBadge = () => {
    if (user?.role === UserRole.Admin) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: "#FFD700" }]}>
          <MaterialCommunityIcons name="shield-crown" size={12} color="#fff" />
          <Text style={styles.roleText}>ADMIN</Text>
        </View>
      );
    }
    if (user?.role === UserRole.Author) {
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

  if (isLoadingUser) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (!user)
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ textAlign: "center", marginTop: 50, color: theme.text }}>
          User not found
        </Text>
      </View>
    );

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* FLOATING HEADER */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Animated.View style={[styles.headerLogoContainer, headerLogoStyle]}>
            <Text style={[styles.logo, { color: theme.text }]}>
              Aurews<Text style={{ color: theme.primary }}>.</Text>
            </Text>
          </Animated.View>

          <Animated.View
            style={[styles.contextTitleContainer, contextTitleStyle]}
          >
            <Text style={[styles.contextTitle, { color: theme.text }]}>
              {user.fullName}
            </Text>
          </Animated.View>

          <View style={{ width: 40 }} />
        </View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* PROFILE HEADER */}
          <View style={styles.profileHeader}>
            <View style={styles.topRow}>
              <Image
                source={{ uri: user.avatar }}
                style={[styles.avatar, { borderColor: theme.border }]}
                contentFit="cover"
              />

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {posts.length}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Posts
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {user.followersCount || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Followers
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {user.followingCount || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Following
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bioSection}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={[styles.fullName, { color: theme.text }]}>
                  {user.fullName}
                </Text>
                {renderRoleBadge()}
              </View>
              <Text style={[styles.username, { color: theme.textSecondary }]}>
                @{user.username}
              </Text>
              <Text style={[styles.bio, { color: theme.text }]}>
                {user.bio || "Chưa có giới thiệu"}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followButton,
                user.isFollowing
                  ? {
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }
                  : { backgroundColor: theme.primary },
              ]}
              onPress={() => toggleFollow(user._id)}
            >
              <Text
                style={[
                  styles.followButtonText,
                  user.isFollowing ? { color: theme.text } : { color: "#fff" },
                ]}
              >
                {user.isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Bài viết
            </Text>
            {isLoadingPosts ? (
              <ActivityIndicator color={theme.primary} />
            ) : posts.length > 0 ? (
              posts.map((post: Post, index: number) =>
                renderPostItem(post, index)
              )
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: theme.textSecondary,
                  marginTop: 20,
                }}
              >
                Chưa có bài viết nào.
              </Text>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    zIndex: 20,
  },
  headerLogoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
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
    left: 60,
    right: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: "800",
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
  followButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
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
});
