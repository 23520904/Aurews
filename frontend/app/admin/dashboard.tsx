// app/admin/dashboard.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LineChart } from "react-native-gifted-charts";

// Hooks & Theme
import { useAdminDashboardStats } from "../../src/hooks/user.hook";
import { useAdminApplications } from "../../src/hooks/application.hook";
import { useAdminReports } from "../../src/hooks/report.hook";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { FONTS, SHADOWS } from "../../src/constants/theme";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const router = useRouter();
  const { backgroundStyle, cardStyle, textStyle } = useAnimatedTheme();
  const theme = useTheme();
  const { mode } = useThemeMode();

  // 1. Fetch Data & Refetch Logic
  const {
    data: dashboardData,
    isLoading,
    refetch: refetchStats,
  } = useAdminDashboardStats();

  const { data: appsData, refetch: refetchApps } = useAdminApplications({
    status: "pending",
    limit: 1,
  });

  const { data: reportsData, refetch: refetchReports } = useAdminReports({
    status: "pending",
    limit: 1,
  });

  // 2. Refresh Control State
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Gọi lại tất cả các API để lấy số liệu mới nhất
      await Promise.all([refetchStats(), refetchApps(), refetchReports()]);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats, refetchApps, refetchReports]);

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
  };

  // Xử lý dữ liệu biểu đồ để phù hợp với theme hiện tại
  const rawChartData = dashboardData?.chartData || [];
  const chartData = rawChartData.map((item: any) => ({
    ...item,
    labelTextStyle: { color: theme.textSecondary, fontSize: 10 },
    dataPointColor: theme.primary,
  }));

  const pendingApps = appsData?.totalApplications ?? 0;
  const pendingReports = reportsData?.totalReports ?? 0;

  // Helper render thẻ thống kê
  const renderStatCard = (
    title: string,
    value: number | string,
    icon: any,
    color: string,
    onPress?: () => void,
    delay: number = 0
  ) => (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <Animated.View style={[styles.card, cardStyle, SHADOWS.medium]}>
          <View style={[styles.rowHeader]}>
            <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
          </View>
          <View>
            <Text style={[styles.cardStat, { color: theme.text }]}>
              {value}
            </Text>
            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>
              {title}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
      />

      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Animated.Text style={[styles.title, textStyle]}>
            Dashboard
          </Animated.Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]} // Android
            />
          }
        >
          {/* --- SECTION 1: GROWTH CHART --- */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              New Users (7 Days)
            </Text>
            <Animated.View
              style={[
                styles.chartContainer,
                cardStyle,
                SHADOWS.small,
                { overflow: "hidden" },
              ]}
            >
              {chartData.length > 0 ? (
                <LineChart
                  data={chartData}
                  color={theme.primary}
                  thickness={3}
                  dataPointsColor={theme.primary}
                  textColor={theme.textSecondary}
                  yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{
                    color: theme.textSecondary,
                    fontSize: 10,
                  }}
                  hideRules
                  hideYAxisText={false}
                  yAxisColor="transparent"
                  xAxisColor={theme.border}
                  width={width - 80}
                  height={180}
                  initialSpacing={20}
                  endSpacing={20}
                  curved
                  isAnimated
                  animateOnDataChange
                  animationDuration={1000}
                  startFillColor={theme.primary}
                  endFillColor={theme.primary + "10"}
                  startOpacity={0.2}
                  endOpacity={0.0}
                  areaChart
                />
              ) : (
                <View
                  style={{
                    height: 180,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: theme.textSecondary }}>
                    No data available
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* --- SECTION 2: STATS GRID --- */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Overview
          </Text>
          <View style={styles.grid}>
            {renderStatCard(
              "Users",
              stats.totalUsers,
              "people",
              "#3b82f6",
              () => router.push("/admin/users"),
              100
            )}
            {renderStatCard(
              "Posts",
              stats.totalPosts,
              "newspaper",
              "#8b5cf6",
              undefined,
              200
            )}
            {renderStatCard(
              "Likes",
              stats.totalLikes,
              "heart",
              "#ef4444",
              undefined,
              300
            )}
            {renderStatCard(
              "Comments",
              stats.totalComments,
              "chatbubble",
              "#10b981",
              undefined,
              400
            )}
          </View>

          {/* --- SECTION 3: PENDING ACTIONS --- */}
          <Text
            style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}
          >
            Pending Actions
          </Text>
          <View style={styles.grid}>
            {renderStatCard(
              "Applications",
              pendingApps + " Pending",
              "document-text",
              "#f59e0b",
              () => router.push("/admin/applications"),
              500
            )}
            {renderStatCard(
              "Reports",
              pendingReports + " Unresolved",
              "alert-circle",
              "#f43f5e",
              () => router.push("/admin/reports"),
              600
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, ...FONTS.heavy },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 16,
    ...FONTS.bold,
    marginBottom: 12,
  },
  chartContainer: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    minHeight: 110,
    justifyContent: "space-between",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardStat: { fontSize: 20, ...FONTS.heavy },
  cardTitle: { fontSize: 13, ...FONTS.medium },
});
