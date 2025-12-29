// app/user/edit.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";

// Import Data & Types
import { useAuthStore } from "../../src/stores/auth.store";
import { useUpdateProfile } from "../../src/hooks/user.hook";
import { useTheme, useThemeMode } from "../../src/hooks/theme.hook"; // <--- Import Theme

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme(); // <--- Lấy màu từ theme
  const { mode } = useThemeMode(); // <--- Lấy mode để chỉnh StatusBar

  const { user } = useAuthStore();
  const { mutateAsync: updateProfile, isPending: isLoading } =
    useUpdateProfile();

  // --- LOCAL STATE ---
  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setAvatarUri(user.avatar || "");
      setFullName(user.fullName || "");
      setBio(user.bio || "");
    }
  }, [user]);

  // --- IMAGE PICKER LOGIC ---
  const handleImageSelection = async (
    result: ImagePicker.ImagePickerResult
  ) => {
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
    setIsLoadingImage(false);
  };

  const pickImageFromLibrary = async () => {
    setIsLoadingImage(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cấp quyền truy cập thư viện ảnh để đổi avatar."
      );
      setIsLoadingImage(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    handleImageSelection(result);
  };

  const takePhoto = async () => {
    setIsLoadingImage(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền camera",
        "Vui lòng cấp quyền camera để chụp ảnh mới."
      );
      setIsLoadingImage(false);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    handleImageSelection(result);
  };

  const handleAvatarPress = () => {
    Alert.alert("Đổi ảnh đại diện", "Chọn phương thức", [
      { text: "Chụp ảnh", onPress: takePhoto },
      { text: "Chọn từ thư viện", onPress: pickImageFromLibrary },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("bio", bio);

      if (avatarUri && user && avatarUri !== user.avatar) {
        const uri = avatarUri;
        const filename = uri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        if (type === "image/jpg") type = "image/jpeg";

        // @ts-ignore
        formData.append("avatar", { uri, name: filename, type });
      }

      await updateProfile(formData);
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công");
      router.back();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Cập nhật hồ sơ thất bại");
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
      />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: theme.text }]}>Hủy</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Chỉnh sửa hồ sơ
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.doneButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.doneText, { color: theme.primary }]}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* AVATAR SECTION */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatar, { backgroundColor: theme.border }]}
                onLoadStart={() => setIsLoadingImage(true)}
                onLoadEnd={() => setIsLoadingImage(false)}
              />
              {isLoadingImage && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View
                style={[
                  styles.cameraIconContainer,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.background,
                  },
                ]}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAvatarPress}>
              <Text style={[styles.changePhotoText, { color: theme.primary }]}>
                Đổi ảnh đại diện
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Họ và tên
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
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ tên đầy đủ"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Username (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Username
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.textSecondary, // Màu nhạt hơn để báo hiệu disabled
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundOff, // Nền tối hơn chút
                  },
                ]}
                value={user.username}
                editable={false}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Không thể thay đổi tên người dùng.
              </Text>
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Bio
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
                value={bio}
                onChangeText={setBio}
                placeholder="Viết giới thiệu ngắn..."
                placeholderTextColor={theme.textSecondary}
                multiline
                maxLength={150}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {bio.length}/150 ký tự
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  doneButton: {
    padding: 4,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
});
