import { create } from "zustand";

type Report = any;

type ReportsState = {
  reports: Report[] | null;
  setReports: (r: Report[] | null) => void;
  clear: () => void;
};

export const useReportsStore = create<ReportsState>((set) => ({
  reports: null,
  setReports: (r) => set({ reports: r }),
  clear: () => set({ reports: null }),
}));