import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LineChart } from "react-native-gifted-charts";

// Hooks & Store
import { useAuthStore } from "../../src/stores/auth.store";
import { useAuthorStats } from "../../src/hooks/user.hook";
import { useTheme, useAnimatedTheme } from "../../src/hooks/theme.hook";
import { FONTS, SHADOWS } from "../../src/constants/theme";
import { BackArrow } from "../../src/components/BackArrow";

const { width } = Dimensions.get("window");

export default function AuthorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const theme = useTheme();
  const { backgroundStyle, cardStyle } = useAnimatedTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // GỌI API
  const { data, isLoading, refetch } = useAuthorStats();

  // --- [SỬA LỖI TẠI ĐÂY] ---
  // TypeScript báo lỗi vì 'data' đã là object chứa stats rồi.
  // Ta truy cập trực tiếp data?.stats thay vì data?.data?.stats
  const stats = data?.stats || {
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalPosts: 0,
    followerCount: 0,
  };

  const chartData = data?.chartData || [];
  // -------------------------

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Component: Thẻ thống kê nhỏ
  const StatCard = ({
    icon,
    color,
    value,
    label,
    index,
  }: {
    icon: any;
    color: string;
    value: number | string;
    label: string;
    index: number;
  }) => (
    <View style={styles.cardWrapper}>
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[styles.statCard, cardStyle, SHADOWS.small]}
      >
        <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <BackArrow />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Thống kê tác giả
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {/* --- WELCOME SECTION --- */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              Bạn quá đỉnh, {user?.fullName}
            </Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              Tổng quan hiệu quả nội dung của bạn.
            </Text>
          </View>

          {/* --- STATS GRID --- */}
          <View style={styles.grid}>
            <StatCard
              index={0}
              label="Lượt đọc"
              value={stats.totalViews}
              icon="eye"
              color="#2563eb" // Blue
            />
            <StatCard
              index={1}
              label="Yêu thích"
              value={stats.totalLikes}
              icon="heart"
              color="#ef4444" // Red
            />
            <StatCard
              index={2}
              label="Bình luận"
              value={stats.totalComments}
              icon="chatbubble-ellipses"
              color="#f59e0b" // Amber
            />
            <StatCard
              index={3}
              label="Followers"
              value={stats.followerCount}
              icon="people"
              color="#9333ea" // Purple
            />
          </View>

          {/* --- GROWTH CHART --- */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Xu hướng đọc (7 ngày qua)
          </Text>

          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={[styles.chartCard, cardStyle, SHADOWS.small]}
          >
            {chartData.length > 0 ? (
              <LineChart
                data={chartData}
                // --- Cấu hình giao diện Chart ---
                height={220}
                width={width - 80} // Trừ padding
                spacing={55}
                initialSpacing={20}
                // Style đường kẻ
                color={theme.primary}
                thickness={3}
                curved
                // Style vùng màu (Gradient)
                areaChart
                startFillColor={theme.primary}
                endFillColor={theme.primary}
                startOpacity={0.15}
                endOpacity={0.01}
                // Điểm dữ liệu (Dots)
                hideDataPoints={false}
                dataPointsColor={theme.card} // Trắng/Đen theo theme
                dataPointsRadius={5}
                dataPointsShape="circular"
                textColor={theme.text} // Màu số trên đỉnh
                textFontSize={11}
                textShiftY={-10}
                // Trục & Lưới
                yAxisColor="transparent"
                xAxisColor="transparent"
                yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: theme.textSecondary,
                  fontSize: 10,
                  fontWeight: "500",
                }}
                rulesColor={theme.border}
                rulesType="dashed"
                hideRules={false}
                // Animation
                isAnimated
                animationDuration={1200}
                // Pointer (Khi chạm vào)
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: theme.border,
                  pointerStripWidth: 2,
                  pointerColor: theme.primary,
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: false,
                  pointerLabelComponent: (items: any) => {
                    return (
                      <View
                        style={{
                          height: 90,
                          width: 100,
                          justifyContent: "center",
                          marginTop: -30,
                          marginLeft: -40,
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                            borderRadius: 16,
                            backgroundColor: theme.card,
                            ...SHADOWS.medium,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              textAlign: "center",
                              color: theme.text,
                            }}
                          >
                            {items[0].value} views
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              textAlign: "center",
                              color: theme.textSecondary,
                            }}
                          >
                            {items[0].label}
                          </Text>
                        </View>
                      </View>
                    );
                  },
                }}
              />
            ) : (
              <View style={styles.emptyChart}>
                <View
                  style={[
                    styles.emptyIconBox,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Ionicons
                    name="bar-chart-outline"
                    size={32}
                    color={theme.textSecondary}
                  />
                </View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  Chưa có dữ liệu lượt đọc{"\n"}trong 7 ngày gần nhất.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* --- EXTRA INFO --- */}
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Tổng quan nội dung
            </Text>
            <View
              style={[
                styles.infoRow,
                { backgroundColor: theme.card },
                SHADOWS.small,
              ]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#10b981" + "20",
                    borderRadius: 10,
                  }}
                >
                  <Ionicons name="document-text" size={22} color="#10b981" />
                </View>
                <View>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "600",
                      fontSize: 15,
                    }}
                  >
                    Bài viết đã xuất bản
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Công khai trên hệ thống
                  </Text>
                </View>
              </View>
              <Text
                style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}
              >
                {stats.totalPosts}
              </Text>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    // Shadow nhẹ cho nút back
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  content: { padding: 20 },

  welcomeSection: { marginBottom: 28 },
  welcomeText: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subText: { marginTop: 6, fontSize: 15 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 28,
  },
  cardWrapper: { width: "48%" },
  statCard: {
    padding: 16,
    borderRadius: 20,
    minHeight: 120,
    justifyContent: "space-between",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
    paddingRight: 10, // Giảm padding phải để chart rộng hơn
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
});
