// app/(tabs)/notifications.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";

// Hooks & Stores của bạn
import {
  useNotifications,
  useMarkNotificationsRead,
  useToggleFollow,
} from "../../src/hooks/user.hook";
import { useUserActivityStore } from "../../src/stores/userActivity.store";
import { useAuthStore } from "../../src/stores/auth.store";
import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";

import GuestView from "../../src/components/GuestView";
import { Notification } from "../../src/types/type";
import { PageContainer } from "../../src/components/PageContainer";

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export default function NotificationScreen() {
  const { user } = useAuthStore();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle } = useAnimatedTheme();
  const [showMenu, setShowMenu] = useState(false);

  // Animation Header đồng bộ với HomeScreen/Explore
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const { data: notificationData, isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationsRead();
  const toggleFollowMutation = useToggleFollow();
  const isFollowing = useUserActivityStore((state) => state.isFollowing);

  // FIX: Khởi tạo Animated Component
  const AnimatedSectionList = useMemo(
    () => Animated.createAnimatedComponent(SectionList),
    []
  );

  const notifications = useMemo(
    () => notificationData?.data || [],
    [notificationData]
  );

  // Style cho hiệu ứng Logo thu nhỏ và tiêu đề hiện ra khi cuộn
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

  const groupedData = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];
    const now = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);

    notifications.forEach((n: Notification) => {
      const date = new Date(n.createdAt);
      if (isSameDay(date, now)) today.push(n);
      else if (isSameDay(date, yesterdayDate)) yesterday.push(n);
      else older.push(n);
    });

    const sections = [];
    if (today.length > 0) sections.push({ title: "Hôm nay", data: today });
    if (yesterday.length > 0)
      sections.push({ title: "Hôm qua", data: yesterday });
    if (older.length > 0) sections.push({ title: "Cũ hơn", data: older });
    return sections;
  }, [notifications]);

  // FIX: Đổi kiểu item thành 'any' để tránh xung đột với AnimatedSectionList
  const renderItem = ({
    item,
    index,
  }: {
    item: any; // Thay vì Notification, để là any để bypass lỗi Typescript với Reanimated
    index: number;
  }) => {
    // Cast lại kiểu để dùng suggestions code nếu cần
    const notifItem = item as Notification;

    const isFollowType = notifItem.type === "follow";
    const following = isFollowing(notifItem.sender._id);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !notifItem.isRead && { backgroundColor: theme.primary + "15" },
          ]}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: notifItem.sender.avatar }}
            style={styles.avatar}
          />
          <View style={styles.contentContainer}>
            <Text
              style={[styles.messageText, { color: theme.text }]}
              numberOfLines={3}
            >
              <Text style={{ fontWeight: "bold" }}>
                {notifItem.sender.fullName}{" "}
              </Text>
              <Text style={{ color: theme.textSecondary }}>
                {notifItem.customMessage ||
                  (notifItem.type === "follow"
                    ? "đã bắt đầu theo dõi bạn"
                    : notifItem.type === "like_post"
                      ? "đã thích bài viết của bạn"
                      : notifItem.type === "comment_post"
                        ? "đã bình luận bài viết của bạn"
                        : notifItem.type === "reply_comment"
                          ? "đã trả lời bình luận của bạn"
                          : "đã gửi thông báo")}
              </Text>
            </Text>
            <Text style={[styles.timeText, { color: theme.textLight }]}>
              {getTimeAgo(notifItem.createdAt)}
            </Text>
          </View>

          {isFollowType && (
            <TouchableOpacity
              style={[
                styles.followButton,
                { borderColor: theme.primary },
                following && { backgroundColor: theme.primary },
              ]}
              onPress={() => toggleFollowMutation.mutate(notifItem.sender._id)}
            >
              <Text
                style={[
                  styles.followButtonText,
                  { color: following ? "#fff" : theme.primary },
                ]}
              >
                {following ? "Đã theo dõi" : "Theo dõi"}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!user) {
    return (
      <GuestView
        title="Thông báo"
        description="Đăng nhập để xem các tương tác mới nhất."
      />
    );
  }

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
              Thông báo
            </Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <AnimatedSectionList
          sections={groupedData}
          keyExtractor={(item: any) => item._id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          renderItem={renderItem}
          // FIX: Ép kiểu section về any để tránh lỗi "Property title does not exist on type unknown"
          renderSectionHeader={({ section }: { section: any }) => (
            <View
              style={[
                styles.sectionHeaderContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: theme.text }]}>
                {section.title}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={60}
                  color={theme.border}
                />
                <Text style={{ color: theme.textSecondary }}>
                  Bạn chưa có thông báo nào.
                </Text>
              </View>
            ) : (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={{ marginTop: 20 }}
              />
            )
          }
        />

        <Modal visible={showMenu} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.menuSheet, { backgroundColor: theme.card }]}>
                <View
                  style={[styles.dragHandle, { backgroundColor: theme.border }]}
                />
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => {
                    markReadMutation.mutate();
                    setShowMenu(false);
                  }}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={24}
                    color={theme.primary}
                  />
                  <Text style={[styles.menuOptionText, { color: theme.text }]}>
                    Đánh dấu tất cả là đã đọc
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  headerRight: { marginLeft: "auto", padding: 4 },
  sectionHeaderContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  sectionHeader: { fontSize: 16, fontWeight: "800" },
  listContent: { paddingBottom: 100 },
  notificationItem: { flexDirection: "row", padding: 16, alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  contentContainer: { flex: 1 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 12, marginTop: 4 },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: { fontSize: 12, fontWeight: "bold" },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 100, gap: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 16,
  },
  menuOptionText: { fontSize: 16, fontWeight: "600" },
});
