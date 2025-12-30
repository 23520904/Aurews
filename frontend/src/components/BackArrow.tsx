// src/components/BackArrow.tsx
import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../hooks/theme.hook";

interface BackArrowProps {
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export const BackArrow = ({
  onPress,
  color,
  style,
  size = 28, // Tăng size lên một chút cho giống icon Chevron
}: BackArrowProps) => {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = onPress || (() => router.back());
  const iconColor = color || theme.text;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {/* ĐỔI TỪ 'arrow-back' SANG 'chevron-back' */}
      <Ionicons name="chevron-back" size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Thiết lập kích thước cố định để căn lề chuẩn hơn
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center", // Căn giữa icon trong vùng bấm
    marginLeft: -10, // Kéo lùi lại một chút để icon Chevron nằm sát lề màn hình hơn
    zIndex: 10,
  },
});
