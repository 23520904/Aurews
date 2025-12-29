import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Link, router } from "expo-router";
import { TextField } from "../../src/components/TextField";
import { KeyboardAware } from "../../src/components/KeyboardAware";
import { useAuthMutations } from "../../src/hooks/auth.hook";
import { useState } from "react";
import { Image } from "expo-image";
import { COLORS, FONTS } from "../../src/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthMutations();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập email và mật khẩu");
      return;
    }
    try {
      await login.mutateAsync({ email, password });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Đăng nhập thất bại", error.message || "Vui lòng thử lại");
    }
  };

  return (
    <KeyboardAware style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="ví dụ: admin@test.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
          />

          <TextField
            label="Mật khẩu"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock"
          />

          <View style={styles.forgotPasswordContainer}>
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Button
            title={login.isPending ? "Processing..." : "Sign In"}
            onPress={handleLogin}
            style={styles.button}
            disabled={login.isPending}
            variant="primary"
          />

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{ alignSelf: "center", marginBottom: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Tiếp tục duyệt ẩn danh"
          >
            <Text style={{ color: COLORS.primary, ...FONTS.medium }}>
              Continue as guest
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account yet? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  logo: { width: 100, height: 100, marginBottom: 24 },
  title: {
    fontSize: 28,
    color: COLORS.secondary,
    marginBottom: 8,
    ...FONTS.heavy,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 32,
    ...FONTS.regular,
  },
  form: { width: "100%" },
  forgotPasswordContainer: { alignItems: "flex-end", marginBottom: 24 },
  forgotPasswordText: { color: COLORS.primary, fontSize: 14, ...FONTS.medium },
  button: { marginBottom: 24 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { color: COLORS.textGray, fontSize: 14 },
  link: { padding: 4 },
  linkText: { color: COLORS.primary, ...FONTS.bold },
});
