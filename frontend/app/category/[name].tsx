import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";

import { usePosts } from "../../src/hooks/post.hook";
import { useTheme, useAnimatedTheme } from "../../src/hooks/theme.hook";
import { useUpdatePreferences } from "../../src/hooks/user.hook";
import { usePreferenceStore } from "../../src/stores/preference.store";
import { TOPICS } from "../../src/constants/topics";
import { getTimeAgo } from "../../src/utils/dateHelpers";
import { PageContainer } from "../../src/components/PageContainer";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = 300;

export default function CategoryDetailScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { backgroundStyle, textStyle } = useAnimatedTheme();
  const scrollY = useSharedValue(0);

  const { selectedTopics, toggleTopic } = usePreferenceStore();
  const isFollowing = selectedTopics.includes(name as string);
  const updatePrefs = useUpdatePreferences();

  const topicInfo = TOPICS.find(
    (t) => t.name.toLowerCase() === (name as string).toLowerCase()
  );
  const { data, isLoading } = usePosts({ category: name, limit: 20 });
  const posts = data?.posts || [];

  useEffect(() => {
    if (selectedTopics.length >= 0) {
      updatePrefs.mutate({ favoriteCategories: selectedTopics });
    }
  }, [selectedTopics]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.2, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [BANNER_HEIGHT - 120, BANNER_HEIGHT - 70],
      [0, 1]
    ),
    backgroundColor: theme.background,
  }));

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.bannerContainer}>
        <Animated.View style={[styles.bannerWrapper, bannerStyle]}>
          <Image
            source={{ uri: topicInfo?.image }}
            style={styles.bannerImage}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.bannerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.bannerName} numberOfLines={1}>
              {name}
            </Text>
            <TouchableOpacity
              onPress={() => toggleTopic(name as string)}
              style={[
                styles.followBtn,
                {
                  backgroundColor: isFollowing
                    ? "rgba(255,255,255,0.2)"
                    : theme.primary,
                },
              ]}
            >
              <Text style={styles.followBtnText}>
                {isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerDesc} numberOfLines={2}>
            {topicInfo?.description}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Animated.Text style={[styles.statNumber, textStyle]}>
            {posts.length}
          </Animated.Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Bài viết
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Animated.Text style={[styles.statNumber, textStyle]}>
            12.5K
          </Animated.Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Theo dõi
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <PageContainer style={{ backgroundColor: "transparent" }}>
        <StatusBar barStyle="light-content" translucent />

        <Animated.View style={[styles.navbar, headerStyle]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Animated.Text style={[styles.navTitle, textStyle]}>
            {name}
          </Animated.Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <View style={styles.fixedBack}>
          <TouchableOpacity
            style={styles.glassBack}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={posts}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100)}
              style={styles.postCard}
            >
              <TouchableOpacity
                onPress={() => router.push(`/post/${item.slug}`)}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.postThumb}
                />
                <View style={styles.postInfo}>
                  <Text
                    style={[styles.postTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.postTime, { color: theme.textSecondary }]}
                  >
                    {getTimeAgo(item.publishTime)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </PageContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 15,
    zIndex: 20,
  },
  navTitle: { fontSize: 18, fontWeight: "800", textTransform: "capitalize" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  fixedBack: { position: "absolute", left: 15, top: 50, zIndex: 30 },
  glassBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: { width: "100%" },
  bannerContainer: { height: BANNER_HEIGHT, width: "100%", overflow: "hidden" },
  bannerWrapper: { ...StyleSheet.absoluteFillObject },
  bannerImage: { ...StyleSheet.absoluteFillObject },
  bannerInfo: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bannerName: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textTransform: "capitalize",
    flex: 1,
    marginRight: 10,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  followBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  bannerDesc: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 25 },
  gridRow: { justifyContent: "space-between", paddingHorizontal: 20 },
  postCard: { width: (width - 55) / 2, marginBottom: 20, marginTop: 20 },
  postThumb: { width: "100%", height: 130, borderRadius: 16 },
  postInfo: { marginTop: 10, paddingHorizontal: 4 },
  postTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  postTime: { fontSize: 11, marginTop: 4 },
});
