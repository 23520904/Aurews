import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Import GestureHandler
import { AudioProvider } from '../src/contexts/AudioContext';
import { DraggablePlayer } from '../src/components/DraggablePlayer';
import AuthRequestModal from "../src/components/AuthRequestModal";
import { useCheckAuth } from "../src/hooks/auth.hook";
import { useBookmarks } from "../src/hooks/user.hook";
import { useAuthStore } from "../src/stores/auth.store";
import { useUserActivityStore } from "../src/stores/userActivity.store";
import { useTheme } from "../src/hooks/theme.hook";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AuthInitializer() {
  const { isChecking } = useCheckAuth();
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

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

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
    // [FIX 1] Đưa GestureHandlerRootView lên bao bọc ngoài cùng (hoặc bên trong AudioProvider đều được)
    // Miễn là nó bao bọc DraggablePlayer
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
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

              {/* [FIX 2] Đặt DraggablePlayer ở đây (Bên trong GestureHandlerRootView) */}
              <DraggablePlayer />

              <Toast />
              <AuthRequestModal />
            </ThemeProviderWrapper>
          </QueryClientProvider>
        </SafeAreaProvider>
      </AudioProvider>
    </GestureHandlerRootView>
  );
}