import { useEffect, useState } from "react";
import { useAuthStore, useSystemStore } from "../src/stores";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../src/constants/theme";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { hasSeenOnboarding, isGuest } = useSystemStore();
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady || isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isAuthenticated || isGuest) {
    return <Redirect href="/(tabs)" />;
  }
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/onboarding/welcome" />;
}
