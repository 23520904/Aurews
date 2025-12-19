// src/components/ui/Button.tsx
import { 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  TouchableOpacityProps,
  Platform,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: "primary" | "outline" | "ghost";
  useGradient?: boolean;
}

export const Button = ({
  title,
  isLoading = false,
  variant = "primary",
  useGradient = false,
  style,
  disabled,
  onPress,
  ...props
}: ButtonProps) => {
  const handlePress = (e: any) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.(e);
  };

  const getButtonStyle = (): (ViewStyle | {opacity: number})[] => {
    const baseStyle: (ViewStyle | {opacity: number})[] = [styles.button];
    
    if (variant === "primary") {
      baseStyle.push(styles.buttonPrimary);
    } else if (variant === "outline") {
      baseStyle.push(styles.buttonOutline);
    } else {
      baseStyle.push(styles.buttonGhost);
    }

    if (isLoading || disabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    return baseStyle;
  };

  const shadowStyle = variant === "primary" && Platform.OS === "ios" 
    ? {
        shadowColor: "#7E000B",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
      }
    : {};

  const ButtonContent = () => (
    <>
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : "#7E000B"}
          size="small"
        />
      ) : (
        <Text style={
          variant === "primary" 
            ? styles.textPrimary 
            : variant === "outline"
            ? styles.textOutline
            : styles.textGhost
        }>
          {title}
        </Text>
      )}
    </>
  );

  // Gradient button for primary variant
  if (variant === "primary" && useGradient && !disabled && !isLoading) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isLoading || disabled}
        onPress={handlePress}
        style={[...getButtonStyle(), shadowStyle, style]}
        {...props}
      >
        <LinearGradient
          colors={["#7E000B", "#A00010", "#7E000B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isLoading || disabled}
      onPress={handlePress}
      style={[...getButtonStyle(), shadowStyle, style]}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  buttonPrimary: {
    backgroundColor: "#7E000B",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7E000B",
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  textPrimary: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  textOutline: {
    color: "#7E000B",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  textGhost: {
    color: "#7E000B",
    fontWeight: "600",
    fontSize: 16,
  },
  gradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});