import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/stores/auth.store";

export default function AuthLayout() {
  // 1. Lấy thông tin user từ authStore (thay vì Clerk)
  const { user } = useAuthStore();

  // 2. Nếu đã đăng nhập rồi mà cố vào lại trang Login -> Đá về trang chủ
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // 3. Nếu chưa đăng nhập -> Cho hiện các màn hình Login/Register
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
