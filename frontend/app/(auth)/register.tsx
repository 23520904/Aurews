import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { KeyboardAware } from "../../src/components/KeyboardAware";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { Link, router } from "expo-router";

import { COLORS, FONTS } from "../../src/constants/theme";
import { useAuthMutations } from "../../src/hooks/auth.hook";
import { BackArrow } from "../../src/components/BackArrow";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const { register } = useAuthMutations();

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password || !dateOfBirth) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ các trường bắt buộc."
      );
      return;
    }
    try {
      await register.mutateAsync({
        fullName,
        username,
        email,
        password,
        dateOfBirth,
      });
      Alert.alert("Thành công", "Tạo tài khoản thành công!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message || "Vui lòng thử lại sau.");
    }
  };

  return (
    <KeyboardAware style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- [SỬA LẠI] ĐƯA NAV HEADER RA NGOÀI --- */}
        <View style={styles.navHeader}>
          <BackArrow />
        </View>
        {/* --------------------------------------- */}

        <View style={styles.header}>
          {/* LOGO TEXT */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              Aurews<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>

          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Tham gia Aurews ngay hôm nay</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextField
            label="Tên đăng nhập"
            placeholder="ten_dang_nhap"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon="account-circle"
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
            label="Ngày sinh"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
          <TextField
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock"
          />

          <Button
            title={register.isPending ? "Đang xử lý..." : "Đăng Ký"}
            onPress={handleRegister}
            style={styles.button}
            disabled={register.isPending}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Đăng nhập</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#ffffff", flex: 1 },

  // Style cho thanh điều hướng chứa nút Back
  navHeader: {
    width: "100%",
    alignItems: "flex-start", // Căn trái
    marginBottom: 10,
    marginLeft: -4, // Căn chỉnh nhẹ để icon thẳng hàng với lề
  },

  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },

  header: { alignItems: "center", marginBottom: 24 },

  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  logoText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1.5,
  },
  logoDot: {
    color: COLORS.primary,
  },

  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#64748b" },
  form: { width: "100%" },
  button: { marginTop: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: { color: "#64748b", fontSize: 14 },
  link: { padding: 4 },
  linkText: { color: COLORS.primary, fontWeight: "700" },
});
