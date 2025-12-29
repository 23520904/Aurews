import { create } from "zustand";

export type AuthModalState = {
  isOpen: boolean;
  message: string;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  message: "You must be signed in to perform this action.",
  openAuthModal: (message?: string) =>
    set({
      isOpen: true,
      message: message ?? "You must be signed in to perform this action.",
    }),
  closeAuthModal: () =>
    set({
      isOpen: false,
      message: "You must be signed in to perform this action.",
    }),
}));
