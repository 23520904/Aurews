// app/author/_layout.tsx
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../../src/stores/auth.store";
import { useTheme } from "../../src/hooks/theme.hook";

export default function AuthorLayout() {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    // Nếu đã load xong user mà không hợp lệ -> Redirect ngay
    if (!isAuthLoading) {
      if (!user) {
        // Chưa đăng nhập
        router.replace("/(auth)/login");
      } else if (user.role !== "author" && user.role !== "admin") {
        // Đăng nhập rồi nhưng không phải Author/Admin
        router.replace("/(tabs)");
      }
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="editor/[id]" />
      <Stack.Screen name="status" />
      <Stack.Screen name="register" />
      <Stack.Screen name="apply" />
    </Stack>
  );
}
