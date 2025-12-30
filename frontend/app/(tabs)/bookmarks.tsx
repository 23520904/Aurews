import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";

// Hooks
import { useUserActivity } from "../../src/hooks/userActivity.hook";
import { useCheckAuth } from "../../src/hooks/auth.hook";
import {
  useAnimatedTheme,
  useTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { PageContainer } from "../../src/components/PageContainer";
import { Post } from "../../src/types/type";
// IMPORT MỚI
import GuestView from "../../src/components/GuestView";

export default function BookmarksScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle, textStyle } = useAnimatedTheme();

  const { data: user } = useCheckAuth();
  const { bookmarks, isLoading, toggleBookmark } = useUserActivity();

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerLogoStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 80],
          [1, 0.75],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(scrollY.value, [60, 100], [1, 0], Extrapolation.CLAMP),
  }));

  const contextTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [90, 130], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [90, 130],
          [10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const handleClearAll = () => {
    if (!bookmarks || bookmarks.length === 0) return;
    Alert.alert("Xác nhận", "Xóa toàn bộ bài viết đã lưu?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa hết",
        style: "destructive",
        onPress: () =>
          bookmarks.forEach(
            (item: any) => item?.post?._id && toggleBookmark(item.post._id)
          ),
      },
    ]);
  };

  const renderRightActions = (postId: string) => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: theme.error }]}
      onPress={() => toggleBookmark(postId)}
    >
      <Ionicons name="trash-outline" size={28} color="white" />
      <Text style={styles.deleteText}>Xóa</Text>
    </TouchableOpacity>
  );

  // --- THAY ĐỔI TẠI ĐÂY ---
  if (!user) {
    return (
      <GuestView
        title="Lưu bài viết yêu thích"
        description="Đăng nhập để lưu và quản lý các bài viết bạn quan tâm."
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
        <PageContainer style={{ backgroundColor: "transparent" }}>
          <StatusBar
            barStyle={mode === "dark" ? "light-content" : "dark-content"}
          />

          <View
            style={[
              styles.floatingHeader,
              { backgroundColor: theme.background },
            ]}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                headerLogoStyle,
                styles.headerCenter,
              ]}
            >
              <Animated.Text style={[styles.logo, textStyle]}>
                Aurews<Text style={{ color: theme.primary }}>.</Text>
              </Animated.Text>
            </Animated.View>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                contextTitleStyle,
                styles.headerCenter,
              ]}
            >
              <Animated.Text style={[styles.contextTitle, textStyle]}>
                Đã lưu
              </Animated.Text>
            </Animated.View>
            <TouchableOpacity
              style={styles.headerRight}
              onPress={handleClearAll}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={bookmarks?.length > 0 ? theme.error : theme.textLight}
              />
            </TouchableOpacity>
          </View>

          <Animated.FlatList
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            data={bookmarks}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }: { item: any; index: number }) => {
              const post = item.post as Post;
              if (!post) return null;

              return (
                <Animated.View entering={FadeInDown.delay(index * 100)}>
                  <Swipeable
                    renderRightActions={() => renderRightActions(post._id)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => router.push(`/post/${post.slug}`)}
                    >
                      <Image
                        source={{ uri: post.thumbnail }}
                        style={styles.thumbnail}
                        contentFit="cover"
                      />
                      <View style={styles.info}>
                        <Text
                          style={[styles.category, { color: theme.primary }]}
                        >
                          {post.category}
                        </Text>
                        <Text
                          style={[styles.title, { color: theme.text }]}
                          numberOfLines={2}
                        >
                          {post.title}
                        </Text>
                        <Text
                          style={[styles.time, { color: theme.textSecondary }]}
                        >
                          {new Date(post.publishTime).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="bookmark-outline"
                    size={80}
                    color={theme.textLight}
                  />
                  <Text
                    style={[styles.message, { color: theme.textSecondary }]}
                  >
                    Chưa có bài viết nào.
                  </Text>
                </View>
              ) : (
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                  style={{ marginTop: 50 }}
                />
              )
            }
          />
        </PageContainer>
      </Animated.View>
    </GestureHandlerRootView>
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
  },
  headerCenter: { justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 26, fontWeight: "900", letterSpacing: -1.5 },
  contextTitle: { fontSize: 18, fontWeight: "800" },
  headerRight: { marginLeft: "auto", padding: 5 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  // Xóa các style không còn dùng (loginBtn, loginText) nếu muốn gọn code
  listContent: { padding: 20, paddingTop: 10, paddingBottom: 100, flexGrow: 1 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
  },
  thumbnail: { width: 100, height: 100 },
  info: { flex: 1, padding: 12, justifyContent: "center" },
  category: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  time: { fontSize: 11, marginTop: 6 },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 100 },
  deleteAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 10,
  },
  deleteText: { color: "white", fontSize: 12, fontWeight: "700", marginTop: 4 },
});
