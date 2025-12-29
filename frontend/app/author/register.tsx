import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { useTheme } from "../../src/hooks/theme.hook";
import { useSubmitApplication } from "../../src/hooks/application.hook";

export default function AuthorRegistrationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const submitApplication = useSubmitApplication();

  const [formData, setFormData] = useState({
    motivation: "",
    experience: "",
    phoneNumber: "",
    portfolioUrl: "", // Optional external link
  });

  const [images, setImages] = useState<{
    front: ImagePicker.ImagePickerAsset | null;
    back: ImagePicker.ImagePickerAsset | null;
  }>({
    front: null,
    back: null,
  });

  const pickImage = async (type: "front" | "back") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages((prev) => ({ ...prev, [type]: result.assets[0] }));
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.motivation ||
      !formData.experience ||
      !formData.phoneNumber ||
      !images.front ||
      !images.back
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ thông tin và tải lên đủ ảnh CCCD."
      );
      return;
    }

    const data = new FormData();
    data.append("motivation", formData.motivation);
    data.append("experience", formData.experience);
    data.append("phoneNumber", formData.phoneNumber);
    if (formData.portfolioUrl) {
      data.append(
        "externalLinks",
        JSON.stringify({ portfolio: formData.portfolioUrl })
      );
    }

    // Append images (Multer expects specific field names)
    // identityCard field expects an array of 2 files
    if (images.front.uri) {
      // @ts-ignore
      data.append("identityCard", {
        uri: images.front.uri,
        name: "front_id.jpg",
        type: "image/jpeg",
      });
    }
    if (images.back.uri) {
      // @ts-ignore
      data.append("identityCard", {
        uri: images.back.uri,
        name: "back_id.jpg",
        type: "image/jpeg",
      });
    }

    submitApplication.mutate(data, {
      onSuccess: () => {
        Alert.alert(
          "Thành công",
          "Đơn đăng ký của bạn đã được gửi! Vui lòng chờ Admin xét duyệt.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      },
      onError: (err: any) => {
        Alert.alert("Lỗi", err.message || "Không thể gửi đơn đăng ký.");
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Đăng ký Tác giả
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Thông tin cá nhân
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Số điện thoại (*)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
            placeholder="Nhập số điện thoại liên hệ"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(t) => setFormData({ ...formData, phoneNumber: t })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Kinh nghiệm viết lách (*)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
            placeholder="Mô tả kinh nghiệm của bạn..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            value={formData.experience}
            onChangeText={(t) => setFormData({ ...formData, experience: t })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Lý do muốn trở thành tác giả (*)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
            placeholder="Tại sao bạn muốn đóng góp cho cộng đồng?..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            value={formData.motivation}
            onChangeText={(t) => setFormData({ ...formData, motivation: t })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Link Portfolio / Blog (Tùy chọn)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
            placeholder="https://myblog.com"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            value={formData.portfolioUrl}
            onChangeText={(t) => setFormData({ ...formData, portfolioUrl: t })}
          />
        </View>

        <Text
          style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}
        >
          Xác minh danh tính (CCCD/CMND)
        </Text>
        <Text style={[styles.helperText, { color: theme.textSecondary }]}>
          Vui lòng tải lên ảnh chụp rõ nét 2 mặt của giấy tờ tùy thân.
        </Text>

        <View style={styles.idCardContainer}>
          <TouchableOpacity
            style={[
              styles.imageUpload,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={() => pickImage("front")}
          >
            {images.front ? (
              <Image
                source={{ uri: images.front.uri }}
                style={styles.uploadedImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.uploadText, { color: theme.textSecondary }]}
                >
                  Mặt trước
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.imageUpload,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            onPress={() => pickImage("back")}
          >
            {images.back ? (
              <Image
                source={{ uri: images.back.uri }}
                style={styles.uploadedImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.uploadText, { color: theme.textSecondary }]}
                >
                  Mặt sau
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.primary,
              opacity: submitApplication.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitApplication.isPending}
        >
          {submitApplication.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi Đơn Đăng Ký</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  helperText: { fontSize: 12, marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  idCardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  imageUpload: {
    width: "48%",
    height: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: { marginTop: 4, fontSize: 12 },
  uploadedImage: { width: "100%", height: "100%" },
  submitButton: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
