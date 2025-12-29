import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, StyleSheet, Text, View, Pressable } from "react-native";
import RNModal from "react-native-modal";
import { useAuthModalStore } from "../stores/authModal.store";
const { width } = Dimensions.get("window");

export default function AuthRequestModal() {
  const router = useRouter();
  const { isOpen, message, closeAuthModal } = useAuthModalStore();

  const handleLoginNavigation = () => {
    closeAuthModal(); // close modal first
    router.push("/(auth)/login"); // navigate to Login
  };

  // Minor optimization: if the modal isn't open, render null for perf
  if (!isOpen) return null;

  return (
    <RNModal
      isVisible={isOpen}
      onBackdropPress={closeAuthModal}
      onBackButtonPress={closeAuthModal}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
      hideModalContentWhileAnimating
      accessibilityViewIsModal
      accessibilityLabel="Login required modal"
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={32} color="#b91c1c" />
        </View>

        <Text style={styles.title}>Yêu cầu đăng nhập</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            android_ripple={{ color: "#efefef" }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss login request"
            style={styles.cancelBtn}
            onPress={closeAuthModal}
          >
            <Text style={styles.cancelText}>Để sau</Text>
          </Pressable>

          <Pressable
            android_ripple={{ color: "#7f1d1d" }}
            accessibilityRole="button"
            accessibilityLabel="Open login screen"
            style={styles.loginBtn}
            onPress={handleLoginNavigation}
          >
            <Text style={styles.loginText}>Đăng nhập ngay</Text>
          </Pressable>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  loginBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#b91c1c",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
