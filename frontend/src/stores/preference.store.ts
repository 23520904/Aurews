import { create } from 'zustand';

type PreferenceState = {
  selectedTopics: string[];
  selectedSources: string[];
  toggleTopic: (topic: string) => void;
  toggleSource: (id: string) => void;
  setTopics: (topics: string[]) => void;
  setSources: (sources: string[]) => void;
  hydrateFromUser: (prefs: any | null) => void;
  clear: () => void;
};

export const usePreferenceStore = create<PreferenceState>((set) => ({
  selectedTopics: [],
  selectedSources: [],
  toggleTopic: (topic: string) =>
    set((state) => ({
      selectedTopics: state.selectedTopics.includes(topic)
        ? state.selectedTopics.filter((t) => t !== topic)
        : [...state.selectedTopics, topic],
    })),
  toggleSource: (id: string) =>
    set((state) => ({
      selectedSources: state.selectedSources.includes(id)
        ? state.selectedSources.filter((s) => s !== id)
        : [...state.selectedSources, id],
    })),
  setTopics: (topics: string[]) => set({ selectedTopics: topics }),
  setSources: (sources: string[]) => set({ selectedSources: sources }),
  hydrateFromUser: (prefs) => {
    if (!prefs) return;
    set({ selectedTopics: prefs.topics || [], selectedSources: prefs.sources || [] });
  },
  clear: () => set({ selectedTopics: [], selectedSources: [] }),
}));
