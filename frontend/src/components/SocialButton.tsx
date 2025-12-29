import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

interface SocialButtonProps extends TouchableOpacityProps {
  type: "google" | "facebook";
}

export const SocialButton = ({
  type,
  disabled,
  style,
  ...props
}: SocialButtonProps) => {
  const { signIn, isLoaded, setActive } = useSignIn();

  const config = {
    google: {
      backgroundColor: "#ffffff",
      borderColor: "#7E000B",
      icon: "google",
      label: "Google",
      color: "#7E000B",
      shadowColor: "#000000",
      shadowOpacity: 0.08,
    },
    facebook: {
      backgroundColor: "#1877F2",
      borderColor: "#1877F2",
      icon: "facebook" as keyof typeof MaterialIcons.glyphMap,
      label: "Facebook",
      color: "#ffffff",
      shadowColor: "#1877F2",
      shadowOpacity: 0.25,
    },
  };

  const current = config[type];

  const shadowStyle =
    Platform.OS === "ios"
      ? {
          shadowColor: current.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: current.shadowOpacity,
          shadowRadius: 4,
          elevation: 3,
        }
      : {};

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: current.backgroundColor,
      borderColor: current.borderColor,
    },
    disabled && styles.buttonDisabled,
    shadowStyle,
    style,
  ];
  const handlePress = async () => {
    if (!isLoaded) return;

    if (type === "google") {
      try {
        const { createdSessionId } = await signIn.create({
          strategy: "oauth_google",
          redirectUrl: "aurews://oauth-callback",
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        console.error("OAuth error", err);
      }
    }
  };
  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      disabled={disabled}
      {...props}
    >
      {type === "google" ? (
        <FontAwesome
          name={"google" as any}
          size={20}
          color={current.color}
          style={styles.icon}
        />
      ) : (
        <MaterialIcons
          name={current.icon as any}
          size={20}
          color={current.color}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: current.color }]}>
        {current.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
  },
});
