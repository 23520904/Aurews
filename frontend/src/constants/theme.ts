// Central theme constants and helpers (typed)

export const PALETTE = {
  primary: "#b91c1c",
  primaryLight: "#fef2f2",
  secondary: "#1f2937",
  textGray: "#6b7280",
  textLight: "#9ca3af",
  white: "#ffffff",
  black: "#000000",
  darkBg: "#121212",
  darkCard: "#1e1e1e",
  darkBorder: "#333333",
  backgroundOff: "#f9fafb",
  border: "#e5e7eb",
  success: "#10b981",
  error: "#ef4444",
};

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export type ThemeColors = typeof PALETTE & {
  background: string;
  backgroundOff: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  icon: string;
  tabBar: string;
  mode: ThemeMode;
};

// Keep backwards-compatible simple COLORS export defaulting to light mode
export const COLORS: ThemeColors = {
  ...PALETTE,
  background: PALETTE.white,
  backgroundOff: PALETTE.backgroundOff,
  text: PALETTE.secondary,
  textSecondary: PALETTE.textGray,
  card: PALETTE.white,
  border: PALETTE.border,
  icon: PALETTE.black,
  tabBar: PALETTE.white,
  mode: "light",
};

// Two supported theme variants with minimal overrides
export const VARIANTS: Record<ThemeMode, Partial<ThemeColors>> = {
  light: {
    background: PALETTE.white,
    backgroundOff: PALETTE.backgroundOff,
    text: PALETTE.secondary,
    textSecondary: PALETTE.textGray,
    card: PALETTE.white,
    border: PALETTE.border,
    icon: PALETTE.black,
    tabBar: PALETTE.white,
  },
  dark: {
    background: PALETTE.darkBg,
    backgroundOff: PALETTE.darkCard,
    text: "#e5e7eb",
    textSecondary: "#9ca3af",
    card: PALETTE.darkCard,
    border: PALETTE.darkBorder,
    icon: PALETTE.white,
    tabBar: PALETTE.darkCard,
  },
};

export function getTheme(mode: ThemeMode): ThemeColors {
  return {
    ...PALETTE,
    ...VARIANTS[mode],
    mode,
  } as ThemeColors;
}

export const DEFAULT_THEME = getTheme("light");

export const FONTS = {
  regular: { fontWeight: "400" as const },
  medium: { fontWeight: "500" as const },
  bold: { fontWeight: "700" as const },
  heavy: { fontWeight: "800" as const },
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#b91c1c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
