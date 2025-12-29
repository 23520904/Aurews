import { StyleSheet, Animated, ViewStyle } from "react-native";
import React, { useEffect, useRef } from "react";
import { useTheme } from "../hooks/theme.hook";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  borderRadius?: number;
}

export const Skeleton = ({
  width = "100%",
  height = 20,
  style,
  borderRadius = 4,
}: SkeletonProps) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          // Màu nền động theo theme
          backgroundColor: theme.mode === "dark" ? "#2d2d2d" : "#e1e4e8",
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};
