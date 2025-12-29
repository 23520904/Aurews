import { create } from "zustand";

type Application = any;

type ApplicationsState = {
  myApplication: Application | null;
  adminApplications: Application[] | null;
  setMyApplication: (a: Application | null) => void;
  setAdminApplications: (list: Application[]) => void;
  clear: () => void;
};

export const useApplicationsStore = create<ApplicationsState>((set) => ({
  myApplication: null,
  adminApplications: null,
  setMyApplication: (a) => set({ myApplication: a }),
  setAdminApplications: (list) => set({ adminApplications: list }),
  clear: () => set({ myApplication: null, adminApplications: null }),
}));