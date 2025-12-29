// app/author/dashboard.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/stores/auth.store";
import { useUserPublicProfile } from "../../src/hooks/user.hook";
import { usePosts } from "../../src/hooks/post.hook";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const theme = useTheme(); // Use theme hook for dynamic colors

  // Fetch fresh profile data for stats
  const { data: profileData, isLoading: isLoadingProfile } =
    useUserPublicProfile(user?._id || "");
  const profile = profileData?.data;

  // Fetch my posts
  const { data: postsData, isLoading: isLoadingPosts } = usePosts(
    user?._id
      ? {
          userId: user._id, // Revert to userId to match backend controller expectation
          limit: 100,
        }
      : { enabled: false }
  );
  const posts = useMemo(() => postsData?.posts || [], [postsData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!profile || !posts)
      return {
        followerCount: 0,
        totalViews: 0,
        totalLikes: 0,
        publishedPosts: 0,
        totalPosts: 0,
      };

    const published = posts.filter((p: any) => p.status === "published").length;
    const views = posts.reduce(
      (acc: number, p: any) => acc + (p.views || 0),
      0
    );
    // Note: Likes are not directly in post object unless populated or aggregated.
    // We'll skip likes for now or set to 0.

    return {
      followerCount: profile.followersCount || 0,
      totalViews: views,
      totalLikes: 0,
      publishedPosts: published,
      totalPosts: postsData?.totalPosts || posts.length,
    };
  }, [profile, posts, postsData]);

  const renderStatCard = (
    label: string,
    value: number | string,
    icon: any,
    color: string
  ) => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.card, shadowColor: "#000" },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );

  if (isLoadingProfile || isLoadingPosts) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Dashboard
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Hello, {user?.fullName}
          </Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Overview of your content performance.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            "Followers",
            stats.followerCount,
            "people",
            "#9333ea"
          )}
          {renderStatCard("Total views", stats.totalViews, "eye", "#2563eb")}
          {/* {renderStatCard("Total likes", stats.totalLikes, "heart", "#b91c1c")} */}

          {/* Published / Total posts */}
          {renderStatCard(
            "Published",
            `${stats.publishedPosts}/${stats.totalPosts}`,
            "document-text",
            "#16a34a"
          )}
        </View>

        {/* Chart Placeholder */}
        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Growth analytics
          </Text>
          <View
            style={[
              styles.placeholderChart,
              { backgroundColor: theme.background },
            ]}
          >
            <Text style={{ color: theme.textSecondary }}>
              Stats chart will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useTheme } from "../../src/hooks/theme.hook";

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },

  welcomeSection: { marginBottom: 24 },
  welcomeText: { fontSize: 24, fontWeight: "bold" },
  subText: { marginTop: 4 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13 },

  chartContainer: { padding: 20, borderRadius: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  placeholderChart: {
    height: 150,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
