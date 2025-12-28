import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { KeyboardAware } from "../../src/components/KeyboardAware";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { SocialButton } from "../../src/components/SocialButton";
import { Link, router } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const { register, isLoading } = useAuthStore();

  // Native date-picker state
  const defaultDOB = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  };
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(defaultDOB());

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const openPicker = () => {
    if (dateOfBirth) {
      const [y, mm, dd] = dateOfBirth.split("-").map((s) => parseInt(s, 10));
      setPickerDate(new Date(y, mm - 1, dd));
    } else {
      setPickerDate(defaultDOB());
    }
    setShowPicker(true);
  };

  // Shared handler (Android returns via onChange and closes automatically)
  const onChange = (_event: any, selected?: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (selected) setDateOfBirth(formatDate(selected));
    } else {
      // iOS updates temp date; confirm via UI button below
      if (selected) setPickerDate(selected);
    }
  };

  const confirmIOS = () => {
    setDateOfBirth(formatDate(pickerDate));
    setShowPicker(false);
  };

  const handleRegister = async () => {
    // Validate cơ bản
    if (!fullName || !username || !email || !password || !dateOfBirth) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      // Gọi hàm register từ store
      await register({
        fullName,
        username,
        email,
        password,
        dateOfBirth,
      });

      // Đăng ký thành công -> Chuyển về trang Login hoặc trang chủ
      Alert.alert("Thành công", "Tạo tài khoản thành công!", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") }
      ]);
    } catch (error: any) {
      // Lỗi sẽ được store ném ra (throw)
      Alert.alert("Đăng ký thất bại", error.message || "Có lỗi xảy ra");
    }
  };

  return (
    <KeyboardAware style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.svg")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Aurews logo"
        />

        <Text style={styles.title}>Create your Aurews account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.form}>
          <TextField
            label="Full name"
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
            icon="person"
          />

          <TextField
            label="Username"
            placeholder="username"
            value={username}
            onChangeText={setUsername}
            icon="person-outline"
          />

          <TextField
            label="Email"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
          />

          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock"
          />

          {/* Date of birth: native picker */}
          <TouchableOpacity activeOpacity={0.8} onPress={openPicker}>
            <TextField
              label="Date of birth"
              placeholder="Select date"
              value={dateOfBirth}
              onChangeText={() => {}}
              icon="calendar-today"
              editable={false}
            />
          </TouchableOpacity>

          <Button
            title={isLoading ? "Creating account..." : "Create account"}
            onPress={handleRegister}
            style={styles.signUp}
            disabled={isLoading}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <Link href="/(auth)/login" style={styles.link}>
              <Text style={[styles.linkText, styles.login]}>Sign in</Text>
            </Link>
          </View>

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton
              type="google"
              onPress={() => {}}
              style={{ marginRight: 12 }}
            />
            <SocialButton type="facebook" onPress={() => {}} />
          </View>
        </View>

        {/* Platform-specific picker rendering */}
        {showPicker && Platform.OS === "android" && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="calendar"
            onChange={onChange}
            maximumDate={new Date()}
          />
        )}

        {/* iOS: modal with spinner + confirm */}
        <Modal visible={showPicker && Platform.OS === "ios"} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select date of birth</Text>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={onChange}
                maximumDate={new Date()}
                style={{ backgroundColor: "white" }}
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="ghost" onPress={() => setShowPicker(false)} style={{ marginRight: 12, flex: 1 }} />
                <Button title="Confirm" onPress={confirmIOS} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  form: {
    width: "100%",
    marginTop: 8,
  },
  signUp: {
    marginTop: 8,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 12,
  },
  linkText: {
    color: "#64748b",
    fontWeight: "600",
    marginRight: 8,
  },
  login: {
    color: "#7E000B",
    textDecorationLine: "underline",
  },
  orRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
    borderRadius: 1,
  },
  orText: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  socialRow: {
    marginTop: 16,
    flexDirection: "row",
  },

  /* iOS modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
    textAlign: "center",
  },
  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});