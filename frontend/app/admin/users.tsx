// app/admin/users.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import {
  useTheme,
  useAnimatedTheme,
  useThemeMode,
} from "../../src/hooks/theme.hook";
import { FONTS, SHADOWS } from "../../src/constants/theme";
import type { User } from "../../src/types/type";

const API = process.env.EXPO_PUBLIC_BASE_API_URL + "/users";

// --- COMPONENT AVATAR THÔNG MINH (XỬ LÝ MẶC ĐỊNH) ---
const UserAvatar = ({
  uri,
  name,
  size = 56,
}: {
  uri?: string;
  name: string;
  size?: number;
}) => {
  const [hasError, setHasError] = useState(false);
  const theme = useTheme();

  // Lấy chữ cái đầu, ví dụ: "Duy Nguyen" -> "D"
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  // Nếu không có URI hoặc đã load lỗi -> Hiển thị chữ cái đầu
  if (!uri || hasError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary + "20", // Màu nền nhạt theo theme chính
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text
          style={{
            fontSize: size * 0.45,
            fontWeight: "700",
            color: theme.primary,
          }}
        >
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
      }}
      contentFit="cover"
      transition={200}
      onError={() => setHasError(true)} // Nếu ảnh lỗi -> chuyển sang hiển thị chữ cái
    />
  );
};

export default function AdminUsers() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();
  const { backgroundStyle, cardStyle } = useAnimatedTheme();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- QUERY ---
  const usersQuery = useQuery({
    queryKey: ["adminUsers", searchTerm],
    queryFn: async () => {
      const qs = searchTerm
        ? `?searchTerm=${encodeURIComponent(searchTerm)}`
        : "";
      const res = await fetch(`${API}${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const users: User[] = useMemo(
    () => usersQuery.data?.users ?? [],
    [usersQuery.data]
  );

  // --- MUTATION ---
  const banMutation = useMutation({
    mutationFn: async ({
      userId,
      isBanned,
    }: {
      userId: string;
      isBanned: boolean;
    }) => {
      const res = await fetch(`${API}/${userId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isBanned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ban toggle failed");
      return data;
    },
    onSuccess: (data) => {
      // Alert.alert("Thành công", data.message); // Có thể bỏ alert nếu muốn trải nghiệm mượt hơn
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err) => {
      Alert.alert("Lỗi", err.message);
    },
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await usersQuery.refetch();
    setIsRefreshing(false);
  }, [usersQuery]);

  // --- HELPER COMPONENT: ROLE BADGE ---
  const RoleBadge = ({ role }: { role: string }) => {
    let bg = theme.border;
    let color = theme.textSecondary;

    if (role === "admin") {
      bg = "#fee2e2"; // Red light
      color = "#b91c1c"; // Red dark
    } else if (role === "author") {
      bg = "#dbeafe"; // Blue light
      color = "#1d4ed8"; // Blue dark
    }

    if (mode === "dark") {
      if (role === "admin") bg = "#7f1d1d";
      if (role === "author") bg = "#1e3a8a";
      if (role === "reader") bg = "#374151";
      color = "#fff";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{role.toUpperCase()}</Text>
      </View>
    );
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item, index }: { item: User; index: number }) => {
    const isMutating =
      banMutation.isPending && banMutation.variables?.userId === item._id;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(400)}
        style={[styles.card, cardStyle, SHADOWS.small]}
      >
        <View style={styles.cardHeader}>
          {/* Avatar + Info */}
          <View style={styles.userInfoContainer}>
            {/* Sử dụng component UserAvatar mới */}
            <UserAvatar uri={item.avatar} name={item.fullName} size={56} />

            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.fullName}
                </Text>
                {item.isBanned && (
                  <View style={styles.bannedTag}>
                    <Text style={styles.bannedText}>BANNED</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.email, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
              <Text style={[styles.username, { color: theme.textSecondary }]}>
                @{item.username}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Footer */}
        <View style={styles.cardFooter}>
          <RoleBadge role={item.role} />

          {item.role !== "admin" && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: item.isBanned ? theme.success : theme.error,
                  opacity: isMutating ? 0.7 : 1,
                },
              ]}
              disabled={isMutating}
              onPress={() =>
                banMutation.mutate({
                  userId: item._id,
                  isBanned: !item.isBanned,
                })
              }
            >
              {isMutating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Ionicons
                    name={item.isBanned ? "lock-open" : "ban"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.actionText}>
                    {item.isBanned ? "Mở khóa" : "Khóa"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[{ flex: 1 }, backgroundStyle]}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Quản lý người dùng
          </Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Tìm theo tên, email..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LIST */}
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            !usersQuery.isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={theme.border}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  Không tìm thấy user nào
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 22, ...FONTS.bold },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, height: "100%" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { marginBottom: 12 },
  userInfoContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 10,
  },
  name: { fontSize: 16, fontWeight: "700", flex: 1 },
  email: { fontSize: 13 },
  username: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  bannedTag: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fca5a5",
    marginLeft: 8,
  },
  bannedText: { color: "#b91c1c", fontSize: 10, fontWeight: "800" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, width: "100%", opacity: 0.5, marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    opacity: 0.7,
  },
  emptyText: { marginTop: 12, fontSize: 16 },
});
