import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SystemState = {
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void; // dev helper
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,

      completeOnboarding: () => set({ hasSeenOnboarding: true }),

      resetOnboarding: () => set({ hasSeenOnboarding: false }),
    }),
    {
      name: "system",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
    }
  )
);
