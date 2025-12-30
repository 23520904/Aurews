import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";

// Hooks
import { usePost, useToggleLike } from "../../src/hooks/post.hook";
import { useUserActivity } from "../../src/hooks/userActivity.hook";
import { useRequireAuth } from "../../src/hooks/useRequireAuth";
import { useAuthStore } from "../../src/stores/auth.store";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { useWindowDimensions, Platform } from "react-native";
import RenderHtml from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackArrow } from "../../src/components/BackArrow";

const BANNER_HEIGHT = 400;

export default function PostDetailScreen() {
  const { width: contentWidth } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle, textStyle } = useAnimatedTheme();
  const requireAuth = useRequireAuth();

  // [UPDATED] Lấy thêm object 'user' để so sánh ID
  const { user, isAuthenticated } = useAuthStore();

  const { data: postResponse, isLoading } = usePost(slug as string);
  const post = postResponse?.data;

  const { toggleBookmark, isBookmarked, isFollowing, toggleFollow } =
    useUserActivity();

  const { mutate: apiToggleLike } = useToggleLike(
    post?._id || "",
    slug as string
  );

  const htmlContent = React.useMemo(() => {
    let content =
      post?.text || post?.content || "<p>Nội dung đang được cập nhật...</p>";

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    if (!hasHtmlTags) {
      content = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      content = `<p>${content}</p>`;
    }

    return content;
  }, [post]);

  const scrollY = useSharedValue(0);

  const authorData =
    post?.authorUser ||
    ((typeof post?.author === "object" ? post.author : null) as any);

  // [NEW] Logic kiểm tra: Nếu ID người đang đăng nhập trùng với ID tác giả
  const isOwner = user?._id && authorData?._id && user._id === authorData._id;

  const lastLikePress = React.useRef(0);

  // --- HÀM ĐIỀU HƯỚNG SANG PUBLIC PROFILE ---
  const handleAuthorPress = () => {
    if (authorData?._id) {
      router.push(`/user/${authorData._id}`);
    }
  };
  // ------------------------------------------

  const handleLike = requireAuth(() => {
    if (!post?._id) return;
    const now = Date.now();
    if (now - lastLikePress.current < 500) return;
    lastLikePress.current = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    apiToggleLike();
  }, "Vui lòng đăng nhập để thích bài viết");

  const handleBookmark = requireAuth(() => {
    if (post?._id) {
      toggleBookmark(post._id);
    }
  }, "Vui lòng đăng nhập để lưu bài viết");

  const handleFollow = requireAuth(() => {
    if (authorData?._id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toggleFollow(authorData._id);
    }
  }, "Vui lòng đăng nhập để theo dõi tác giả");

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [BANNER_HEIGHT - 100, BANNER_HEIGHT - 50],
      [0, 1]
    ),
    backgroundColor: theme.background,
  }));

  if (isLoading || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const following =
    isAuthenticated && authorData?._id ? isFollowing(authorData._id) : false;

  const bookmarked =
    isAuthenticated && post?._id ? isBookmarked(post._id) : false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header Bar */}
      <Animated.View style={[styles.header, headerStyle]}>
        <BackArrow color={theme.text} style={{ marginLeft: 0 }} />
        <View style={styles.headerTitleContainer}>
          <Animated.Text
            style={[styles.headerTitle, textStyle]}
            numberOfLines={1}
          >
            {post.title}
          </Animated.Text>
        </View>
        <View style={styles.headerBtn} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: post.thumbnail }}
            style={styles.banner}
            contentFit="cover"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backFloating, { top: 50 }]}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.contentCard, { backgroundColor: theme.background }]}
        >
          <Text style={[styles.category, { color: theme.primary }]}>
            {post.category}
          </Text>
          <Animated.Text style={[styles.title, textStyle]}>
            {post.title}
          </Animated.Text>

          <View style={styles.authorRow}>
            <View style={styles.authorInfo}>
              <View>
                <TouchableOpacity onPress={handleAuthorPress}>
                  <Image
                    source={{ uri: authorData?.avatar }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>

                {/* [UPDATED] Thêm điều kiện !isOwner vào đây */}
                {!following && !isOwner && (
                  <TouchableOpacity
                    style={[
                      styles.plusButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleFollow}
                  >
                    <Ionicons name="add" size={14} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.authorTextContainer}>
                <TouchableOpacity onPress={handleAuthorPress}>
                  <Animated.Text
                    style={[styles.authorName, textStyle]}
                    numberOfLines={1}
                  >
                    {authorData?.fullName || authorData?.name}
                  </Animated.Text>
                </TouchableOpacity>

                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {getTimeAgo(post.publishTime)} • {post.readTime} phút đọc
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <RenderHtml
            contentWidth={contentWidth}
            source={{ html: htmlContent }}
            baseStyle={{
              fontSize: 17,
              lineHeight: 28,
              color: theme.text,
              textAlign: "justify",
            }}
            tagsStyles={{
              p: { marginBottom: 15 },
              h1: {
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 15,
                marginTop: 10,
              },
              h2: {
                fontSize: 22,
                fontWeight: "bold",
                marginBottom: 12,
                marginTop: 10,
              },
              h3: {
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 10,
                marginTop: 10,
              },
              li: { marginBottom: 5 },
              strong: { fontWeight: "bold" },
              img: { marginVertical: 10, borderRadius: 8 },
            }}
          />
        </View>
      </Animated.ScrollView>

      {/* Bottom Interaction Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: bottom > 0 ? bottom : 20,
            height: 60 + (bottom > 0 ? bottom : 20),
          },
        ]}
      >
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={26}
            color={post.isLiked ? theme.error : theme.text}
          />
          <Text
            style={[
              styles.actionText,
              { color: post.isLiked ? theme.error : theme.text },
            ]}
          >
            {post.likes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push({
              pathname: "./comments",
              params: { postId: post._id },
            })
          }
        >
          <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>
            {post.comments || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark}>
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={bookmarked ? theme.primary : theme.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Share.share({ message: post.title })}
        >
          <Ionicons name="share-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  bannerContainer: { height: BANNER_HEIGHT, width: "100%" },
  banner: { width: "100%", height: "100%" },
  backFloating: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  contentCard: {
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 800,
  },
  category: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32, marginBottom: 20 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  authorInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  plusButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  authorTextContainer: { marginLeft: 12, flex: 1 },
  authorName: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, width: "100%", marginVertical: 20 },
  body: { fontSize: 17, lineHeight: 28, textAlign: "justify" },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 8 },
  actionText: { marginLeft: 6, fontWeight: "600", fontSize: 14 },
});
