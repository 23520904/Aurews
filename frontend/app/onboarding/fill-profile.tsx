// app/onboarding/fill-profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useAuthStore } from "../../src/stores/auth.store";
import { useUpdateProfile } from "../../src/hooks/user.hook";

export default function FillProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setAvatarUri(user.avatar || "");
      setFullName(user.fullName || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const pickImage = async () => {
    setIsLoadingImage(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần quyền truy cập thư viện để chọn ảnh."
      );
      setIsLoadingImage(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
    setIsLoadingImage(false);
  };

  const handleNext = async () => {
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("bio", bio);

      if (avatarUri && avatarUri !== user?.avatar) {
        const uri = avatarUri;
        const filename = uri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        if (type === "image/jpg") type = "image/jpeg";

        // @ts-ignore
        formData.append("avatar", { uri, name: filename, type });
      }

      await updateProfile(formData);
      router.push("./topics");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Cập nhật hồ sơ thất bại");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Điền thông tin hồ sơ</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Avatar Picker */}
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
            {isLoadingImage && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Forms */}
          <View style={styles.form}>
            <Text style={styles.label}>Tên đăng nhập (Không thể thay đổi)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={username}
              editable={false}
            />

            <Text style={styles.label}>Email (Không thể thay đổi)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />

            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>Giới thiệu (Bio)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Mô tả ngắn về bản thân..."
            />
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, isPending && styles.disabledBtn]}
            onPress={handleNext}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextText}>Tiếp tục</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: { fontSize: 18, fontWeight: "bold" },

  avatarContainer: { alignSelf: "center", marginBottom: 30 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f3f4f6",
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#b91c1c",
    padding: 6,
    borderRadius: 15,
  },

  form: { gap: 16 },
  label: { color: "#666", marginBottom: 8, fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#999",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  nextBtn: {
    backgroundColor: "#b91c1c",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 40,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});