import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
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
  withTiming,
  Extrapolation,
} from "react-native-reanimated";
import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { usePost, useToggleLike } from "../../src/hooks/post.hook";
import { useUserActivity } from "../../src/hooks/userActivity.hook";
import { useRequireAuth } from "../../src/hooks/useRequireAuth";
import { useAuthStore } from "../../src/stores/auth.store";
import { usePreferenceStore } from "../../src/stores/preference.store";
import { useTheme, useAnimatedTheme, useThemeMode } from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { BackArrow } from "../../src/components/BackArrow";


import { useAudio } from "../../src/contexts/AudioContext";
import { RelatedPosts } from "../../src/components/RelatedPosts";
import { AIChatModal } from "../../src/components/AIChatModal";

const BANNER_HEIGHT = 400;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function PostDetailScreen() {
  const { width: contentWidth } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { textStyle } = useAnimatedTheme();
  const requireAuth = useRequireAuth();

  const { user, isAuthenticated } = useAuthStore();
  const { fontSize, setFontSize } = usePreferenceStore();


  const { data: postResponse, isLoading } = usePost(slug as string);
  const post = postResponse?.data;


  const { toggleBookmark, isBookmarked, isFollowing, toggleFollow } = useUserActivity();
  const { mutate: apiToggleLike } = useToggleLike(post?._id || "", slug as string);


  const { playPost, pauseAudio, resumeAudio, currentTrack, isPlaying, isLoadingAudio } = useAudio();


  const isCurrentArticle = currentTrack?._id === post?._id;


  const [contentHeight, setContentHeight] = useState(1);
  const scrollY = useSharedValue(0);
  const isScrollingDown = useSharedValue(false);
  const previousScrollY = useSharedValue(0);

  const [showAI, setShowAI] = useState(false);

  const [isReaderMode, setIsReaderMode] = useState(false);


  const handleToggleAudio = async () => {
    if (!post) return;

    try {
      if (isCurrentArticle) {

        if (isPlaying) {
          await pauseAudio();
        } else {
          await resumeAudio();
        }
      } else {

        await playPost(post);
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể phát bản tin này.");
    }
  };



  const htmlContent = useMemo(() => {
    let content = post?.text || post?.content || "<p>Nội dung đang được cập nhật...</p>";
    if (!/<[a-z][\s\S]*>/i.test(content)) {
      content = content.replace(/\n/g, "<br/>");
      content = `<p>${content}</p>`;
    }
    return content;
  }, [post]);

  const source = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  const baseStyle = useMemo(() => ({
    fontSize: isReaderMode ? fontSize + 4 : fontSize,
    lineHeight: (isReaderMode ? fontSize + 4 : fontSize) * 1.8,
    color: isReaderMode && mode === 'light' ? '#2c3e50' : theme.text,
    textAlign: "justify" as const,
    fontFamily: isReaderMode ? Platform.OS === 'ios' ? 'Georgia' : 'serif' : undefined,
  }), [fontSize, theme.text, isReaderMode, mode]);

  const tagsStyles = useMemo(() => ({
    p: { marginBottom: 15 },
    h1: { fontSize: fontSize * 1.4, fontWeight: "bold", marginVertical: 10 },
    h2: { fontSize: fontSize * 1.3, fontWeight: "bold", marginVertical: 10 },
    img: { marginVertical: 10, borderRadius: 8 },
    a: { color: theme.primary, textDecorationLine: "underline" },
  }), [fontSize, theme.primary]);


  const scrollHandler = useAnimatedScrollHandler((event) => {
    const currentY = event.contentOffset.y;
    scrollY.value = currentY;
    const diff = currentY - previousScrollY.value;
    if (diff > 5 && currentY > 150) {
      isScrollingDown.value = true;
    } else if (diff < -5) {
      isScrollingDown.value = false;
    }
    previousScrollY.value = currentY;
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [BANNER_HEIGHT - 100, BANNER_HEIGHT - 50], [0, 1]),
    backgroundColor: theme.background,
  }));

  const bottomBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(isScrollingDown.value ? 100 : 0, { duration: 300 }) }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(scrollY.value, [0, Math.max(contentHeight - SCREEN_HEIGHT, 1)], [0, 100], Extrapolation.CLAMP)}%`,
    height: 3,
    backgroundColor: theme.primary,
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 101,
  }));


  const authorData = post?.authorUser || ((typeof post?.author === "object" ? post.author : null) as any);
  const isOwner = user?._id && authorData?._id && user._id === authorData._id;

  const handleToggleFontSize = () => {
    if (fontSize === 17) setFontSize(20);
    else if (fontSize === 20) setFontSize(24);
    else setFontSize(17);
    Haptics.selectionAsync();
  };

  const handleLike = requireAuth(() => {
    if (!post?._id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    apiToggleLike();
  }, "Vui lòng đăng nhập để thích bài viết");

  if (isLoading || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const following = isAuthenticated && authorData?._id ? isFollowing(authorData._id) : false;
  const bookmarked = isAuthenticated && post?._id ? isBookmarked(post._id) : false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isReaderMode && mode === 'light' ? "dark-content" : "light-content"} />

      {/* --- HEADER --- */}
      <Animated.View style={[
        styles.header,
        headerStyle,

        isReaderMode && { opacity: 1, backgroundColor: mode === 'light' ? '#fdf6e3' : '#000' }
      ]}>
        <BackArrow color={isReaderMode && mode === 'light' ? '#000' : theme.text} style={{ marginLeft: 0 }} />

        <View style={styles.headerTitleContainer}>
          {/* Ẩn Title trên header khi ở Reader Mode cho đỡ rối, hoặc giữ lại tuỳ bạn */}
          {!isReaderMode && (
            <Animated.Text style={[styles.headerTitle, textStyle]} numberOfLines={1}>
              {post.title}
            </Animated.Text>
          )}
        </View>

        {/* [NEW] NÚT READER MODE */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            Haptics.selectionAsync();
            setIsReaderMode(!isReaderMode);
          }}
        >
          <Ionicons
            name={isReaderMode ? "book" : "book-outline"}
            size={24}
            color={isReaderMode ? theme.primary : (isReaderMode && mode === 'light' ? '#000' : theme.text)}
          />
        </TouchableOpacity>

        {/* Các nút khác: Ẩn bớt khi đang tập trung đọc */}
        {!isReaderMode && (
          <>
            <TouchableOpacity style={styles.headerBtn} onPress={handleToggleAudio} disabled={isLoadingAudio}>
              {/* ... Icon Audio cũ ... */}
              {isLoadingAudio && !isCurrentArticle ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons
                  name={isCurrentArticle && isPlaying ? "pause" : "volume-high-outline"}
                  size={24}
                  color={isCurrentArticle && isPlaying ? theme.primary : theme.text}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerBtn} onPress={handleToggleFontSize}>
              <Ionicons name="text-outline" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAI(true)}>
              <Ionicons name="sparkles" size={24} color={theme.primary} />
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* --- CONTENT SCROLLVIEW --- */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{
          backgroundColor: isReaderMode
            ? (mode === 'light' ? '#fdf6e3' : '#000000')
            : theme.background
        }}
      >
        {/* 1. ẢNH BÌA (ẨN KHI READER MODE) */}
        {!isReaderMode && (
          <View style={styles.bannerContainer}>
            <Image source={{ uri: post.thumbnail }} style={styles.banner} contentFit="cover" />
            <TouchableOpacity onPress={() => router.back()} style={[styles.backFloating, { top: 50 }]}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* 2. KHUNG NỘI DUNG */}
        <View style={[
          styles.contentCard,
          {

            backgroundColor: isReaderMode
              ? 'transparent'
              : theme.background,
            marginTop: isReaderMode ? 80 : -30,
            borderTopLeftRadius: isReaderMode ? 0 : 32,
            borderTopRightRadius: isReaderMode ? 0 : 32,
            paddingHorizontal: isReaderMode ? 20 : 24,
          }
        ]}>

          {/* Category & Title */}
          {!isReaderMode && <Text style={[styles.category, { color: theme.primary }]}>{post.category}</Text>}

          <Animated.Text style={[
            styles.title,
            textStyle,

            isReaderMode && {
              color: mode === 'light' ? '#2c3e50' : theme.text,
              fontSize: 30,
              lineHeight: 40,
              marginBottom: 30
            }
          ]}>
            {post.title}
          </Animated.Text>

          {/* 3. CÁC THÀNH PHẦN RƯỜM RÀ (ẨN KHI READER MODE) */}
          {!isReaderMode && (
            <>
              {/* Nút Nghe Báo To */}
              <TouchableOpacity
                style={[styles.bigAudioBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
                onPress={handleToggleAudio}
                disabled={isLoadingAudio}
              >
                {/* ... nội dung nút nghe ... */}
                {isLoadingAudio && !isCurrentArticle ? (
                  <ActivityIndicator color={theme.primary} style={{ marginRight: 10 }} />
                ) : (
                  <Ionicons
                    name={isCurrentArticle && isPlaying ? "pause-circle" : "play-circle"}
                    size={40}
                    color={theme.primary}
                    style={{ marginRight: 10 }}
                  />
                )}
                <View>
                  <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>
                    {isCurrentArticle && isPlaying ? "Đang phát bản tin" : "Nghe tin tức này"}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Báo nói AI • Giọng chuẩn Google</Text>
                </View>
              </TouchableOpacity>

              {/* Author Info */}
              <View style={styles.authorRow}>
                <View style={styles.authorInfo}>
                  <TouchableOpacity onPress={() => authorData?._id && router.push(`/user/${authorData._id}`)}>
                    <Image source={{ uri: authorData?.avatar }} style={styles.avatar} />
                  </TouchableOpacity>
                  {!following && !isOwner && (
                    <TouchableOpacity style={[styles.plusButton, { backgroundColor: theme.primary }]} onPress={() => toggleFollow(authorData?._id)}>
                      <Ionicons name="add" size={14} color="white" />
                    </TouchableOpacity>
                  )}
                  <View style={styles.authorTextContainer}>
                    <Animated.Text style={[styles.authorName, textStyle]}>
                      {authorData?.fullName || authorData?.name}
                    </Animated.Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {getTimeAgo(post.publishTime)} • {post.readTime} phút đọc
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </>
          )}

          {/* 4. NỘI DUNG CHÍNH (RENDER HTML) */}
          <RenderHtml
            contentWidth={contentWidth}
            source={source}
            baseStyle={baseStyle as any}
            tagsStyles={tagsStyles as any}
          />

          {/* 5. BÀI LIÊN QUAN (ẨN KHI READER MODE) */}
          {!isReaderMode && post && (
            <RelatedPosts
              currentPostId={post._id}
              category={post.category}
            />
          )}

        </View>
      </Animated.ScrollView>

      {/* --- BOTTOM BAR (ẨN KHI READER MODE) --- */}
      {!isReaderMode && (
        <Animated.View style={[
          styles.bottomBar,
          bottomBarStyle,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: bottom > 0 ? bottom : 20,
            height: 60 + (bottom > 0 ? bottom : 20),
            position: 'absolute', bottom: 0, left: 0, right: 0
          },
        ]}
        >
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons name={post.isLiked ? "heart" : "heart-outline"} size={26} color={post.isLiked ? theme.error : theme.text} />
            <Text style={[styles.actionText, { color: post.isLiked ? theme.error : theme.text }]}>{post.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: "./comments", params: { postId: post._id } })}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>{post.comments || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => post?._id && toggleBookmark(post._id)}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={24} color={bookmarked ? theme.primary : theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Share.share({ message: post.title })}>
            <Ionicons name="share-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* AI Modal giữ nguyên */}
      <AIChatModal
        visible={showAI}
        onClose={() => setShowAI(false)}
        articleContent={post?.text || post?.content || ""}
        currentPostId={post?._id || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    position: "absolute", top: 0, left: 0, right: 0, height: 100,
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 10, zIndex: 100,
  },
  headerBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginLeft: 8 },
  headerTitleContainer: { flex: 1, height: 40, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  bannerContainer: { height: BANNER_HEIGHT, width: "100%" },
  banner: { width: "100%", height: "100%" },
  backFloating: {
    position: "absolute", left: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  contentCard: {
    marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 100, minHeight: 800,
  },


  bigAudioBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 1, marginBottom: 20,
  },

  category: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32, marginBottom: 20 },
  authorRow: { flexDirection: "row", alignItems: "center" },
  authorInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  plusButton: {
    position: "absolute", bottom: -2, right: -2, width: 18, height: 18,
    borderRadius: 9, borderWidth: 2, borderColor: "white", justifyContent: "center", alignItems: "center",
  },
  authorTextContainer: { marginLeft: 12, flex: 1 },
  authorName: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, width: "100%", marginVertical: 20 },
  bottomBar: { flexDirection: "row", paddingHorizontal: 20, alignItems: "center", justifyContent: "space-between", borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 8 },
  actionText: { marginLeft: 6, fontWeight: "600", fontSize: 14 },
});