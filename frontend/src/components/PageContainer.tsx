import React from "react";
import { View, ViewStyle, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/theme.hook";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const PageContainer = ({ children, style, backgroundColor }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        // Ưu tiên backgroundColor truyền vào, nếu không dùng màu nền từ theme
        backgroundColor: backgroundColor || theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        ...style,
      }}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />
      {children}
    </View>
  );
};
