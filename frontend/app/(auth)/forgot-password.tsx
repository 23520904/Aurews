import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAware } from "../../src/components/KeyboardAware";
import { Image } from "expo-image";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập Email");
      return;
    }

    setIsLoading(true);

    // --- BẮT ĐẦU MOCK ---
    try {
      // Giả vờ đợi 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Luôn báo thành công
      Alert.alert(
        "Đã gửi Email (Giả lập)",
        `Một email khôi phục mật khẩu giả đã được gửi tới ${email}`,
        [{ text: "Quay lại Login", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Thất bại", "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
    // --- KẾT THÚC MOCK ---
  };

  return (
    <KeyboardAware style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.subtitle}>
          Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật
          khẩu.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Địa chỉ Email"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="email"
          />

          <Button
            title={isLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            onPress={handleResetPassword}
            style={styles.button}
            disabled={isLoading}
          />

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backLink}>
              <Text style={styles.backLinkText}>← Quay lại Đăng nhập</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
    paddingTop: 40,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  button: {
    marginTop: 8,
  },
  backLink: {
    marginTop: 24,
    alignSelf: "center",
    padding: 8,
  },
  backLinkText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
