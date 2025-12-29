import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../../src/stores/auth.store";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/(tabs)");
    }
  }, [user, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
