import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import Toast from "react-native-toast-message";

/** Clerk publishable key from .env (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) */
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  return (
    <>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <Slot />
      </ClerkProvider>

      {/* Toast root (global) */}
      <Toast />
    </>
  );
}