import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native"; // Thêm ActivityIndicator
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
  // Lấy thêm isChecking từ hook
  const { isChecking } = useCheckAuth();
  const { isAuthenticated } = useAuthStore();
  const bookmarksQuery = useBookmarks();
  const setBookmarkedPostIds = useUserActivityStore(
    (s) => s.setBookmarkedPostIds
  );

  // Đồng bộ Bookmark khi đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const responseData = bookmarksQuery.data as any;
    if (responseData?.success && responseData?.data) {
      try {
        const serverItems = responseData.data;
        const ids = Array.isArray(serverItems)
          ? serverItems
              .map((p: any) => {
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

  // Nếu đang kiểm tra Storage -> Trả về null hoặc Loading Spinner
  // Để tránh App render màn hình chính khi chưa biết là Guest hay User
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="post/[slug]" />
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

          <Toast />
          <AuthRequestModal />
        </ThemeProviderWrapper>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
