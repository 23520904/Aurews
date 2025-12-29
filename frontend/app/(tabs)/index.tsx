import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import PagerView from "react-native-pager-view";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

import { useInfinitePosts } from "../../src/hooks/post.hook";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { PageContainer } from "../../src/components/PageContainer";
import { Skeleton } from "../../src/components/Skeleton";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.55;
const CAROUSEL_DURATION = 5000;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle } = useAnimatedTheme();

  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const scrollY = useSharedValue(0);
  const progress = useSharedValue(0);

  // --- INFINITE SCROLL ---
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfinitePosts(15); // Load 15 bài mỗi lần

  // Flatten data từ các pages
  const allPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) || [];
  }, [data]);

  const heroPosts = useMemo(() => allPosts.slice(0, 5), [allPosts]);
  const masonryPosts = useMemo(() => allPosts.slice(5), [allPosts]);

  // Logic Carousel & Progress Bar
  useEffect(() => {
    if (heroPosts.length === 0) return;
    const startAnim = () => {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: CAROUSEL_DURATION,
        easing: Easing.linear,
      });
    };
    startAnim();

    const interval = setInterval(() => {
      const next = (currentPage + 1) % heroPosts.length;
      pagerRef.current?.setPage(next);
      setCurrentPage(next);
      startAnim();
    }, CAROUSEL_DURATION);

    return () => {
      clearInterval(interval);
      cancelAnimation(progress);
    };
  }, [currentPage, heroPosts.length]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Hiệu ứng Header Floating
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

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const renderHero = () => (
    <View style={styles.heroWrapper}>
      {heroPosts.length > 0 ? (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {heroPosts.map((post) => (
            <TouchableOpacity
              key={post._id}
              activeOpacity={1}
              onPress={() => router.push(`/post/${post.slug}`)}
            >
              <Image
                source={{ uri: post.thumbnail }}
                style={styles.heroImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View
                  style={[styles.heroTag, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.heroTagText}>{post.category}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.heroMeta}>
                  {post.author?.name} • {getTimeAgo(post.publishTime)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </PagerView>
      ) : (
        <Skeleton width="100%" height="100%" />
      )}
      <View style={styles.progressBarWrapper}>
        <Animated.View
          style={[
            styles.progressBar,
            progressBarStyle,
            { backgroundColor: theme.primary },
          ]}
        />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  };

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <PageContainer backgroundColor="transparent">
        <StatusBar
          barStyle={mode === "dark" ? "light-content" : "dark-content"}
        />

        <View
          style={[styles.floatingHeader, { backgroundColor: theme.background }]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              headerLogoStyle,
              styles.headerCenter,
            ]}
          >
            <Text style={[styles.logo, { color: theme.text }]}>
              Aurews<Text style={{ color: theme.primary }}>.</Text>
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              contextTitleStyle,
              styles.headerCenter,
            ]}
          >
            <Text style={[styles.contextTitle, { color: theme.text }]}>
              Mới nhất
            </Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="search" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          data={masonryPosts}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={renderHero}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100)}>
              <TouchableOpacity
                style={styles.postCard}
                onPress={() => router.push(`/post/${item.slug}`)}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.postThumb}
                />
                <View style={styles.postInfo}>
                  <Text style={[styles.postCat, { color: theme.primary }]}>
                    {item.category}
                  </Text>
                  <Text
                    style={[styles.postTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.postMeta}>
                    {getTimeAgo(item.publishTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </PageContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  headerRight: { marginLeft: "auto" },
  heroWrapper: { height: HERO_HEIGHT, width: "100%", position: "relative" },
  pager: { flex: 1 },
  heroImage: { width: "100%", height: "100%" },
  heroContent: { position: "absolute", bottom: 40, left: 20, right: 20 },
  heroTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  heroTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 36 },
  heroMeta: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 10 },
  progressBarWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  progressBar: { height: "100%" },
  postCard: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 25,
    gap: 15,
  },
  postThumb: { width: 100, height: 100, borderRadius: 12 },
  postInfo: { flex: 1, justifyContent: "center" },
  postCat: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 6,
  },
  postMeta: { fontSize: 12, color: "#6b7280" },
});
