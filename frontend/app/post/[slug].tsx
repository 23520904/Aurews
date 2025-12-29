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
  Extrapolation,
} from "react-native-reanimated";

// Hooks
import { usePost, useToggleLike } from "../../src/hooks/post.hook";
import { useUserActivity } from "../../src/hooks/userActivity.hook";
import { useRequireAuth } from "../../src/hooks/useRequireAuth";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { useWindowDimensions, Platform } from "react-native";
import RenderHtml from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
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

  // 1. Lấy dữ liệu bài viết (React Query tự động cập nhật UI khi cache thay đổi)
  const { data: postResponse, isLoading } = usePost(slug as string);
  const post = postResponse?.data;

  // 2. Các hoạt động người dùng (Bookmark, Follow)
  const { toggleBookmark, isBookmarked, isFollowing, toggleFollow } =
    useUserActivity();

  // 3. Mutation Like
  const { mutate: apiToggleLike } = useToggleLike(
    post?._id || "",
    slug as string
  );

  const htmlContent = React.useMemo(() => {
    let content =
      post?.text || post?.content || "<p>Nội dung đang được cập nhật...</p>";

    // Nếu nội dung là plain text (không chứa thẻ HTML phổ biến), ta convert \n thành <br/>
    // và bọc trong thẻ p để nhận style
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    if (!hasHtmlTags) {
      // Escape HTML characters to prevent injection if it was meant to be plain text
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

  // Ép kiểu author an toàn
  const authorData =
    post?.authorUser ||
    ((typeof post?.author === "object" ? post.author : null) as any);

  // --- LOGIC LIKE: ĐẢM BẢO TĂNG/GIẢM VÀ ĐỔI MÀU (THROTTLED) ---
  const lastLikePress = React.useRef(0);
  const handleLike = requireAuth(() => {
    if (!post?._id) return;

    // Throttle 500ms
    const now = Date.now();
    if (now - lastLikePress.current < 500) return;
    lastLikePress.current = now;

    // Phản hồi rung
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Gọi API trực tiếp, UI tự update qua React Query Polling/Invalidation
    apiToggleLike();
  }, "Vui lòng đăng nhập để thích bài viết");

  // --- LOGIC FOLLOW TIKTOK STYLE ---
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

  // Lấy trạng thái từ Store/Hook
  const following = authorData?._id ? isFollowing(authorData._id) : false;
  const bookmarked = isBookmarked(post._id);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent />

      {/* Header Bar */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
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
                <Image
                  source={{ uri: authorData?.avatar }}
                  style={styles.avatar}
                />
                {!following && (
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
                <Animated.Text
                  style={[styles.authorName, textStyle]}
                  numberOfLines={1}
                >
                  {authorData?.fullName || authorData?.name}
                </Animated.Text>
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
        {/* NÚT LIKE: Đổi màu và nhảy số ngay lập tức dựa trên post.isLiked từ cache */}
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

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => toggleBookmark(post._id)}
        >
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
