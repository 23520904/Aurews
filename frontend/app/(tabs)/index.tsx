import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
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

import { useInfinitePosts, usePosts } from "../../src/hooks/post.hook";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { PageContainer } from "../../src/components/PageContainer";
import { Skeleton } from "../../src/components/Skeleton";
import { usePreferenceStore, DEFAULT_CATEGORIES } from "../../src/stores/preference.store";
import { PostCategory } from "../../src/types/type";
import { CategorySortModal } from "../../src/components/CategorySortModal";
import { useAudio } from '../../src/contexts/AudioContext';


const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.55;
const CAROUSEL_DURATION = 5000;
const { playRadio, isPlaying, currentTrack, playlist } = useAudio();


const CategoryTabs = memo(({ categories, activeCategory, onSelect, theme, onEditPress }: any) => {
  const dataToRender = categories || DEFAULT_CATEGORIES;
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>

        {/* Nút Edit (Sort) */}
        <TouchableOpacity
          style={[styles.editBtn, { borderColor: theme.border }]}
          onPress={onEditPress}
        >
          <Ionicons name="filter" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* ScrollView Danh mục */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20, paddingVertical: 15 }}
        >
          {dataToRender.map((cat: any) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelect(cat.id)}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? theme.text : theme.textSecondary,
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle } = useAnimatedTheme();
  const { favoriteCategories, sortedCategoryIds, setSortedCategories } = usePreferenceStore();
  const [isSortModalVisible, setSortModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [activeCategory, setActiveCategory] = useState("for_you");
  const { playRadio, isPlaying, currentTrack } = useAudio();
  const shouldHideFab = isPlaying;
  const pagerRef = useRef<PagerView>(null);

  const pageIndexRef = useRef(0);

  const scrollY = useSharedValue(0);
  const progress = useSharedValue(0);


  const { data: heroData } = usePosts({ limit: 5 });
  const heroPosts = heroData?.posts || [];

  const queryParams = useMemo(() => {
    if (activeCategory === "for_you") {
      if (!favoriteCategories || favoriteCategories.length === 0) return {};
      return { category: favoriteCategories.join(",") };
    }
    if (activeCategory === "all") return {};
    return { category: activeCategory };
  }, [activeCategory, favoriteCategories]);

  const displayCategories = useMemo(() => {

    if (!sortedCategoryIds || sortedCategoryIds.length === 0) {
      return DEFAULT_CATEGORIES;
    }


    const sorted = sortedCategoryIds
      .map(id => DEFAULT_CATEGORIES.find(c => c.id === id))
      .filter(Boolean);


    const missing = DEFAULT_CATEGORIES.filter(c => !sortedCategoryIds.includes(c.id));

    return [...sorted, ...missing] as typeof DEFAULT_CATEGORIES;
  }, [sortedCategoryIds]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfinitePosts(10, queryParams);

  const masonryPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) || [];
  }, [data]);


  useEffect(() => {
    if (heroPosts.length === 0) return;


    const runAnimation = () => {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: CAROUSEL_DURATION,
        easing: Easing.linear,
      });
    };

    runAnimation();

    const interval = setInterval(() => {

      const next = (pageIndexRef.current + 1) % heroPosts.length;


      pagerRef.current?.setPage(next);


      pageIndexRef.current = next;
      setCurrentPage(next);


      runAnimation();
    }, CAROUSEL_DURATION);

    return () => {
      clearInterval(interval);
      cancelAnimation(progress);
    };
  }, [heroPosts.length]);


  const onPageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setCurrentPage(position);
    pageIndexRef.current = position;

    progress.value = 0;
    progress.value = withTiming(1, { duration: CAROUSEL_DURATION, easing: Easing.linear });
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });


  const headerLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scrollY.value, [0, 80], [1, 0.75], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [60, 100], [1, 0], Extrapolation.CLAMP),
  }));

  const contextTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [90, 130], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [90, 130], [10, 0], Extrapolation.CLAMP) }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));


  const ListHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.heroWrapper}>
          {heroPosts.length > 0 ? (
            <PagerView
              ref={pagerRef}
              style={styles.pager}
              initialPage={0}
              onPageSelected={onPageSelected}
            >
              {heroPosts.map((post) => (
                <TouchableOpacity
                  key={post._id}
                  activeOpacity={1}
                  onPress={() => router.push(`/post/${post.slug}`)}
                >
                  <Image source={{ uri: post.thumbnail }} style={styles.heroImage} contentFit="cover" />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={StyleSheet.absoluteFill} />
                  <View style={styles.heroContent}>
                    <View style={[styles.heroTag, { backgroundColor: theme.primary }]}>
                      <Text style={styles.heroTagText}>{post.category}</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>{post.title}</Text>
                    <Text style={styles.heroMeta}>{post.author?.name} • {getTimeAgo(post.publishTime)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </PagerView>
          ) : (
            <Skeleton width="100%" height="100%" />
          )}

          <View style={styles.paginationContainer}>
            {heroPosts.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentPage ? theme.primary : "rgba(255,255,255,0.5)",
                    width: i === currentPage ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.progressBarWrapper}>
            <Animated.View style={[styles.progressBar, progressBarStyle, { backgroundColor: theme.primary }]} />
          </View>
        </View>


        <CategoryTabs
          categories={displayCategories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          theme={theme}
          onEditPress={() => setSortModalVisible(true)}
        />
      </View>
    );
  }, [heroPosts, currentPage, activeCategory, theme, progressBarStyle]);


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
      <PageContainer backgroundColor="transparent" edges={['top', 'left', 'right']}>
        <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

        <View style={[styles.floatingHeader, { backgroundColor: theme.background }]}>
          <Animated.View style={[StyleSheet.absoluteFill, headerLogoStyle, styles.headerCenter]}>
            <Text style={[styles.logo, { color: theme.text }]}>
              Aurews<Text style={{ color: theme.primary }}>.</Text>
            </Text>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, contextTitleStyle, styles.headerCenter]}>
            <Text style={[styles.contextTitle, { color: theme.text }]}>
              {activeCategory === "for_you" ? "Dành cho bạn" : "Tin tức"}
            </Text>
          </Animated.View>
          <TouchableOpacity style={styles.headerRight} onPress={() => router.push("/search")}>
            <Ionicons name="search" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          data={masonryPosts}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 100)}>
              <TouchableOpacity style={styles.postCard} onPress={() => router.push(`/post/${item.slug}`)}>
                <Image source={{ uri: item.thumbnail }} style={styles.postThumb} />
                <View style={styles.postInfo}>
                  <Text style={[styles.postCat, { color: theme.primary }]}>{item.category}</Text>
                  <Text style={[styles.postTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.postMeta}>{getTimeAgo(item.publishTime)}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primary} />}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
        {masonryPosts.length > 0 && !shouldHideFab && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.primary }]}
            onPress={() => playRadio(masonryPosts)}
            activeOpacity={0.8}
          >
            <Ionicons name="radio" size={22} color="white" />
            <Text style={styles.fabText}>
              Nghe tin nhanh
            </Text>
          </TouchableOpacity>
        )}
      </PageContainer>
      <CategorySortModal
        visible={isSortModalVisible}
        onClose={() => setSortModalVisible(false)}
        currentOrderIds={sortedCategoryIds && sortedCategoryIds.length > 0 ? sortedCategoryIds : DEFAULT_CATEGORIES.map(c => c.id)}
        onSave={setSortedCategories}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    height: 60, width: "100%", flexDirection: "row", alignItems: "center", paddingHorizontal: 20, zIndex: 10,
  },
  headerCenter: { justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 26, fontWeight: "900", letterSpacing: -1.5 },
  contextTitle: { fontSize: 18, fontWeight: "800" },
  headerRight: { marginLeft: "auto" },

  heroWrapper: { height: HERO_HEIGHT, width: "100%", position: "relative" },
  pager: { flex: 1 },
  heroImage: { width: "100%", height: "100%" },
  heroContent: { position: "absolute", bottom: 50, left: 20, right: 20 },
  heroTag: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 12 },
  heroTagText: { color: "#fff", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 36 },
  heroMeta: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 10 },

  paginationContainer: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: 3 },

  progressBarWrapper: { position: "absolute", bottom: 0, width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  progressBar: { height: "100%" },

  tabContainer: {},
  tabItem: { marginRight: 24, paddingBottom: 8, borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabText: { fontSize: 16, letterSpacing: 0.5 },
  divider: { height: 1, width: "100%", opacity: 0.1 },

  postCard: { flexDirection: "row", paddingHorizontal: 20, marginTop: 25, gap: 15 },
  postThumb: { width: 100, height: 100, borderRadius: 12 },
  postInfo: { flex: 1, justifyContent: "center" },
  postCat: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 4 },
  postTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22, marginBottom: 6 },
  postMeta: { fontSize: 12, color: "#6b7280" },
  editBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 5,
    borderRightWidth: 1,
    borderColor: '#eee'
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  fabText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  }
});