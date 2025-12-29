import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// Hooks & Store
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { useTopAuthors } from "../../src/hooks/user.hook";
import { useUserActivityStore } from "../../src/stores/userActivity.store";
import { useUserActivity } from "../../src/hooks/userActivity.hook";
import { useAuthStore } from "../../src/stores/auth.store"; // <--- IMPORT THÊM ĐỂ LẤY CURRENT USER
import { TOPICS } from "../../src/constants/topics";
import { PageContainer } from "../../src/components/PageContainer";
import { Skeleton } from "../../src/components/Skeleton";

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle, textStyle } = useAnimatedTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Lấy user hiện tại để so sánh (không hiện nút follow trên chính mình)
  const { user: currentUser } = useAuthStore();

  const scrollY = useSharedValue(0);

  const {
    data: authors,
    isLoading: authorsLoading,
    refetch: refetchAuthors,
  } = useTopAuthors(10);

  const { isFollowing } = useUserActivityStore();
  const { toggleFollow } = useUserActivity();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAuthors();
    setRefreshing(false);
  }, [refetchAuthors]);

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

  const renderAuthorItem = ({ item }: { item: any }) => {
    const isMe = currentUser?._id === item._id;
    const following = isFollowing(item._id);

    return (
      <View style={styles.authorCard}>
        {/* Container bọc Avatar để căn chỉnh Badge tương đối theo Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => router.push(`/user/${item._id}`)}>
            <Image source={{ uri: item.avatar }} style={styles.authorAvatar} />
          </TouchableOpacity>

          {/* Badge Verified (Góc dưới phải, nằm trong avatar một chút) */}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
          {/* Badge Follow/Unfollow (Nằm dưới đáy Avatar) */}
          {!isMe && (
            <TouchableOpacity
              style={[
                styles.followBadge,
                following
                  ? { backgroundColor: theme.card, borderColor: theme.border } // Đã follow: Nền trắng/card, viền xám
                  : {
                      backgroundColor: theme.primary,
                      borderColor: theme.background,
                    }, // Chưa follow: Nền màu chủ đạo
              ]}
              onPress={() => toggleFollow(item._id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={following ? "checkmark" : "add"}
                size={14}
                color={following ? theme.text : "#fff"}
              />
            </TouchableOpacity>
          )}
        </View>

        <Animated.Text style={[styles.authorName, textStyle]} numberOfLines={1}>
          {item.fullName}
        </Animated.Text>

        {/* Đã xóa nút "Theo dõi" to ở đây */}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerPadding}>
      <View style={styles.section}>
        <Animated.Text style={[styles.sectionTitle, textStyle]}>
          Tác giả nổi bật
        </Animated.Text>
        {authorsLoading ? (
          <View style={{ flexDirection: "row", gap: 15 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={100} height={120} borderRadius={16} />
            ))}
          </View>
        ) : (
          <FlatList
            data={authors?.data}
            renderItem={renderAuthorItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ gap: 15, paddingRight: 20 }}
          />
        )}
      </View>
      <Animated.Text
        style={[styles.sectionTitle, textStyle, { marginTop: 10 }]}
      >
        Tất cả danh mục
      </Animated.Text>
    </View>
  );

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <PageContainer style={{ backgroundColor: "transparent" }}>
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
              Khám phá
            </Animated.Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="search" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Animated.FlatList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={TOPICS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() =>
                  router.push(`../category/${item.name.toLowerCase()}`)
                }
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryImage}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.categoryName}>{item.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
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
  headerPadding: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 15 },

  // --- STYLES MỚI CHO AUTHOR ITEM ---
  authorCard: {
    width: 80, // Giảm width một chút vì bỏ nút to
    alignItems: "center",
  },
  avatarContainer: {
    width: 70,
    height: 70,
    marginBottom: 6,
    position: "relative", // Quan trọng để căn chỉnh badge
  },
  authorAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  // Badge Verified (Dấu tích xanh xác thực) - Căn góc trên phải hoặc dưới phải lệch
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,
    backgroundColor: "#7e000B",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 2,
  },
  // Badge Follow (Dấu cộng/Tick) - Căn giữa đáy
  followBadge: {
    position: "absolute",
    bottom: -8, // Thò ra ngoài avatar một chút
    alignSelf: "center", // Căn giữa theo chiều ngang
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2, // Viền trắng/nền để tách khỏi avatar
    zIndex: 3,
  },
  // -----------------------------------

  authorName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  listContainer: { paddingBottom: 40 },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  gridItem: { width: "48%" },
  categoryCard: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryImage: { ...StyleSheet.absoluteFillObject },
  categoryName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
