import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../src/stores/auth.store";
import { useTheme, useThemeMode } from "../src/hooks/theme.hook";
import { useMyProfile } from "../src/hooks/user.hook";

export default function SettingsScreen() {
  const router = useRouter();
  const { user: authUser, logout } = useAuthStore();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();

  // Fetch latest profile data to ensure role is up-to-date
  const { data: profileResponse } = useMyProfile();

  const currentUser = useMemo(() => {
    return (profileResponse as any)?.data || authUser;
  }, [profileResponse, authUser]);

  const isAuthor =
    currentUser?.role === "author" || currentUser?.role === "admin";
  const isAdmin = currentUser?.role === "admin";

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/welcome" as any);
        },
      },
    ]);
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
      {title}
    </Text>
  );

  const renderMenuItem = (
    icon: any,
    label: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    danger = false
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.card }]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? theme.error : theme.text}
        />
        <Text
          style={[
            styles.menuLabel,
            { color: danger ? theme.error : theme.text },
          ]}
        >
          {label}
        </Text>
      </View>
      {rightElement || (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        {renderSectionHeader("TÀI KHOẢN")}
        <View style={styles.menuGroup}>
          {renderMenuItem("person-outline", "Chỉnh sửa hồ sơ", () =>
            router.push("/user/edit")
          )}
          {renderMenuItem("lock-closed-outline", "Đổi mật khẩu", () => {
            Alert.alert("Thông báo", "Tính năng đang phát triển");
          })}
          {renderMenuItem("notifications-outline", "Thông báo", () => {
            Alert.alert("Thông báo", "Tính năng đang phát triển");
          })}
        </View>

        {/* Application Section */}
        {renderSectionHeader("ỨNG DỤNG")}
        <View style={styles.menuGroup}>
          {renderMenuItem(
            mode === "dark" ? "moon" : "sunny-outline",
            "Chế độ tối",
            toggleMode,
            <Switch
              value={mode === "dark"}
              onValueChange={toggleMode}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={"#f4f3f4"}
            />
          )}

          {!isAuthor &&
            renderMenuItem("briefcase-outline", "Đăng ký làm Tác giả", () =>
              router.push("/author/status")
            )}

          {renderMenuItem("help-circle-outline", "Trợ giúp", () => {
            Alert.alert("Thông báo", "Tính năng đang phát triển");
          })}
        </View>

        {/* Author Tools (Only for Authors & Admins) */}
        {isAuthor && (
          <>
            {renderSectionHeader("TÁC GIẢ")}
            <View style={styles.menuGroup}>
              {renderMenuItem("stats-chart-outline", "Bảng điều khiển", () =>
                router.push("/author/dashboard")
              )}
              {renderMenuItem("document-text-outline", "Quản lý bài viết", () =>
                router.push("/author/manage")
              )}
            </View>
          </>
        )}

        {/* Admin Tools (Only for Admins) */}
        {isAdmin && (
          <>
            {renderSectionHeader("QUẢN TRỊ")}
            <View style={styles.menuGroup}>
              {renderMenuItem("grid-outline", "Dashboard Admin", () =>
                router.push("/admin/dashboard")
              )}
              {renderMenuItem("people-outline", "Quản lý Người dùng", () =>
                router.push("/admin/users")
              )}
            </View>
          </>
        )}

        {/* Logout Section */}
        <View style={[styles.menuGroup, { marginTop: 24 }]}>
          {renderMenuItem(
            "log-out-outline",
            "Đăng xuất",
            handleLogout,
            undefined,
            true
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  menuGroup: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
