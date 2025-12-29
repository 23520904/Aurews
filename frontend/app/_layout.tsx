import { Stack } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthRequestModal from "../src/components/AuthRequestModal";
import { useCheckAuth } from "../src/hooks/auth.hook";
import { useBookmarks } from "../src/hooks/user.hook";
import { useAuthStore } from "../src/stores/auth.store";
import { useUserActivityStore } from "../src/stores/userActivity.store";
import { useTheme } from "../src/hooks/theme.hook";
import { useEffect } from "react";

const queryClient = new QueryClient();

// 1. Component khởi tạo Auth và đồng bộ dữ liệu người dùng
function AuthInitializer() {
  useCheckAuth();
  const { isAuthenticated } = useAuthStore();
  const bookmarksQuery = useBookmarks();
  const setBookmarkedPostIds = useUserActivityStore(
    (s) => s.setBookmarkedPostIds
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const responseData = bookmarksQuery.data as any;

    if (responseData?.success && responseData?.data) {
      try {
        const serverItems = responseData.data;
        const ids = Array.isArray(serverItems)
          ? serverItems
              .map((p: any) => {
                // Hỗ trợ cả dữ liệu đã populate hoặc chỉ chứa ID chuỗi
                const target = p.post || p;
                return typeof target === "string" ? target : target?._id;
              })
              .filter(Boolean)
          : [];

        setBookmarkedPostIds(ids);
      } catch (error) {
        console.error("Lỗi đồng bộ bookmark:", error);
      }
    }
  }, [isAuthenticated, bookmarksQuery.data, setBookmarkedPostIds]);

  return null;
}

// 2. Component bọc để ép giao diện luôn đúng màu theo Theme Store
function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProviderWrapper>
          <AuthInitializer />

          <Stack screenOptions={{ headerShown: false }}>
            {/* Cấu hình các nhóm màn hình chính */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />

            {/* Chi tiết bài viết */}
            <Stack.Screen name="post/[slug]" />

            {/* Màn hình bình luận dạng Modal */}
            <Stack.Screen
              name="post/comments"
              options={{
                presentation: "modal",
                headerShown: false,
                gestureEnabled: true,
              }}
            />

            <Stack.Screen name="index" />
          </Stack>

          {/* Thành phần hiển thị toàn cục */}
          <Toast />
          <AuthRequestModal />
        </ThemeProviderWrapper>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
