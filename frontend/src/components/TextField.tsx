// src/components/ui/TextField.tsx
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue 
} from "react-native-reanimated";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export const TextField = React.forwardRef<TextInput, TextFieldProps>(
  ({ label, error, style, isPassword = false, icon, ...props }, ref) => {
    const [isSecure, setIsSecure] = useState(isPassword);
    const [isFocused, setIsFocused] = useState(false);
    const scale = useSharedValue(1);

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handleFocus = () => {
      setIsFocused(true);
      scale.value = withSpring(1.1);
    };

    const handleBlur = () => {
      setIsFocused(false);
      scale.value = withSpring(1);
    };

    const inputStyle = [
      styles.input,
      icon && styles.inputWithLeftIcon,
      isPassword && styles.inputWithRightIcon,
      error && styles.inputError,
      isFocused && styles.inputFocused,
      !error && !isFocused && styles.inputDefault,
      style,
    ];

    const shadowStyle = isFocused && Platform.OS === "ios"
      ? {
          shadowColor: "#7E000B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
      : {};

    return (
      <View style={styles.container}>
        {/* Label */}
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={styles.inputContainer}>
          {/* Left Icon */}
          {icon && (
            <Animated.View style={[styles.leftIconContainer, iconAnimatedStyle]}>
              <MaterialIcons 
                name={icon} 
                size={22} 
                color={
                  error ? "#dc2626" : 
                  isFocused ? "#7E000B" : 
                  "#94a3b8"
                } 
              />
            </Animated.View>
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            style={[inputStyle, shadowStyle]}
            placeholderTextColor="#94a3b8"
            secureTextEntry={isSecure}
            autoCapitalize="none"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Password Toggle */}
          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              style={styles.rightIconButton}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleIconContainer,
                isFocused && styles.toggleIconContainerFocused
              ]}>
                <MaterialIcons
                  name={isSecure ? "visibility-off" : "visibility"}
                  size={22}
                  color={isFocused ? "#7E000B" : "#94a3b8"}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={14} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    marginBottom: 10,
    fontWeight: "600",
    color: "#334155",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  leftIconContainer: {
    position: "absolute",
    left: 16,
    top: 0,
    height: 56,
    justifyContent: "center",
    zIndex: 10,
  },
  input: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 16,
    height: 56,
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 56,
  },
  inputDefault: {
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  inputFocused: {
    borderColor: "#7E000B",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#fca5a5",
    backgroundColor: "rgba(254, 242, 242, 0.3)",
  },
  rightIconButton: {
    position: "absolute",
    right: 0,
    top: 0,
    height: 56,
    width: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  toggleIconContainerFocused: {
    backgroundColor: "rgba(126, 0, 11, 0.1)",
    borderRadius: 50,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
    backgroundColor: "rgba(254, 242, 242, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
});