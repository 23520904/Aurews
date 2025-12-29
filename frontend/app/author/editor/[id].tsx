import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

// Editor (Yêu cầu đã cài: npx expo install react-native-webview)
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

// Hooks & Types
import {
  useCreatePost,
  useUpdatePostGeneric,
  usePost,
  useDeletePost, // Import thêm hook xóa
} from "../../../src/hooks/post.hook";
import { useTheme } from "../../../src/hooks/theme.hook";
import { PostCategory, PostStatus } from "../../../src/types/type";

// Helper format text
const formatCategoryLabel = (cat?: string | PostCategory) => {
  if (!cat) return "Chọn danh mục";
  const s = String(cat);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function EditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  // Xác định mode: Tạo mới (id="new") hay Sửa
  const isEditing = id && id !== "new";

  // Refs
  const richText = useRef<RichEditor>(null);

  // --- DATA HOOKS ---
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePostGeneric();
  const deleteMutation = useDeletePost();

  // Chỉ fetch data nếu đang ở chế độ Edit
  const { data: postResponse, isLoading: isLoadingPost } = usePost(
    isEditing ? (id as string) : undefined
  );

  // --- LOCAL STATE ---
  const [title, setTitle] = useState("");
  const [contentHTML, setContentHTML] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<PostCategory>(
    PostCategory.Technology
  );
  const [status, setStatus] = useState<PostStatus>(PostStatus.Draft);

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Date Picker State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 1. LOAD DATA KHI SỬA
  useEffect(() => {
    if (isEditing && postResponse?.data) {
      const post = postResponse.data;
      setTitle(post.title);
      setContentHTML(post.text || "");
      // Hack nhỏ: Đợi Editor mount xong mới set Content để tránh lỗi
      setTimeout(() => {
        if (richText.current) {
          richText.current.setContentHTML(post.text || "");
        }
      }, 500);
      setCoverImage(post.thumbnail);
      setCategory(post.category);
      setStatus(post.status);
      if (post.publishTime) setDate(new Date(post.publishTime));
    }
  }, [postResponse, isEditing]);

  // 2. XỬ LÝ ẢNH BÌA
  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [16, 9],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) setCoverImage(result.assets[0].uri);
  };

  // 3. XỬ LÝ ẢNH TRONG EDITOR
  const handleInsertImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      // Lưu ý: Tốt nhất nên upload ảnh lên server lấy URL rồi mới insert.
      // Ở đây tạm thời insert local URI để hiển thị.
      richText.current?.insertImage(result.assets[0].uri);
    }
  };

  // 4. LƯU BÀI VIẾT (TẠO MỚI / CẬP NHẬT)
  const handleSubmit = async (targetStatus: PostStatus) => {
    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    const html = await richText.current?.getContentHtml();
    const finalContent = html || contentHTML || "";

    const formData = new FormData();
    formData.append("title", title);

    // --- QUAN TRỌNG: Gửi cả 2 trường để khớp validation backend ---
    formData.append("text", finalContent);
    formData.append("content", finalContent);

    formData.append("category", category);
    formData.append("status", targetStatus);

    // Xử lý ngày đăng
    let publishTime = new Date().toISOString();
    if (targetStatus === PostStatus.Scheduled) {
      publishTime = date.toISOString();
    }
    formData.append("publishTime", publishTime);

    // Xử lý Thumbnail (Phân biệt file mới và link cũ)
    if (coverImage) {
      if (coverImage.startsWith("file://")) {
        const filename = coverImage.split("/").pop() || "cover.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        // @ts-ignore
        formData.append("thumbnail", { uri: coverImage, name: filename, type });
      } else {
        formData.append("thumbnailUrl", coverImage);
      }
    }

    try {
      if (isEditing) {
        await updatePostMutation.mutateAsync({
          postId: id as string,
          formData,
        });
        Alert.alert("Thành công", "Bài viết đã được cập nhật.");
      } else {
        await createPostMutation.mutateAsync(formData);
        Alert.alert("Thành công", "Bài viết mới đã được tạo.");
        router.replace("/author/manage"); // Quay về danh sách
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể lưu bài viết.");
    }
  };

  // 5. XÓA BÀI VIẾT
  const handleDelete = () => {
    if (!id || id === "new") return;

    Alert.alert("Xóa bài viết?", "Bài viết sẽ được chuyển vào thùng rác.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(id as string, {
            onSuccess: () => {
              router.replace("/author/manage");
            },
            onError: (err: any) => {
              Alert.alert("Lỗi", err.message);
            },
          });
        },
      },
    ]);
  };

  const isSaving = createPostMutation.isPending || updatePostMutation.isPending;

  // Handler Date Picker
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
    if (event.type === "set" && Platform.OS !== "ios") {
      handleSubmit(PostStatus.Scheduled);
    }
  };

  if (isLoadingPost) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* --- HEADER --- */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* NÚT LƯU NHÁP */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => handleSubmit(PostStatus.Draft)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Text style={[styles.btnText, { color: theme.textSecondary }]}>
                Lưu nháp
              </Text>
            )}
          </TouchableOpacity>

          {/* NÚT ĐĂNG */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.primary, paddingHorizontal: 16 },
            ]}
            onPress={() => handleSubmit(PostStatus.Published)}
            disabled={isSaving}
          >
            <Text
              style={[styles.btnText, { color: "#fff", fontWeight: "700" }]}
            >
              Đăng
            </Text>
          </TouchableOpacity>

          {/* MENU BUTTON */}
          <TouchableOpacity
            style={[styles.menuBtn]}
            onPress={() => setShowMenuModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- EDITOR AREA --- */}
      <ScrollView
        style={styles.scrollContainer}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <TouchableOpacity
          onPress={pickCoverImage}
          style={[
            styles.coverContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {coverImage ? (
            <Image
              source={{ uri: coverImage }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="image-outline"
                size={32}
                color={theme.textSecondary}
              />
              <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
                Thêm ảnh bìa
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title Input */}
        <TextInput
          style={[styles.titleInput, { color: theme.text }]}
          placeholder="Tiêu đề bài viết..."
          placeholderTextColor={theme.textSecondary}
          multiline
          value={title}
          onChangeText={setTitle}
        />

        {/* Category Selector */}
        <TouchableOpacity
          style={[styles.catBadge, { backgroundColor: theme.primary + "15" }]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={{ color: theme.primary, fontWeight: "600" }}>
            {formatCategoryLabel(category)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.primary} />
        </TouchableOpacity>

        {/* Rich Text Editor */}
        <View style={[styles.editorWrapper, { borderColor: theme.border }]}>
          <RichEditor
            ref={richText}
            placeholder="Nội dung bài viết..."
            initialContentHTML={contentHTML}
            onChange={setContentHTML}
            editorInitializedCallback={() => setEditorLoaded(true)}
            editorStyle={{
              backgroundColor: theme.background,
              color: theme.text,
              placeholderColor: theme.textSecondary,
              contentCSSText: "font-size: 16px; line-height: 24px;",
            }}
            style={styles.richEditor}
            useContainer={false}
            disabled={false}
          />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- TOOLBAR --- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 30 : 0}
      >
        <RichToolbar
          editor={richText}
          selectedIconTint={theme.primary}
          iconTint={theme.textSecondary}
          style={[
            styles.toolbar,
            { backgroundColor: theme.card, borderTopColor: theme.border },
          ]}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.insertLink,
            actions.heading1,
            actions.insertImage,
            actions.insertBulletsList,
            actions.undo,
            actions.redo,
          ]}
          onPressAddImage={handleInsertImage}
        />
      </KeyboardAvoidingView>

      {/* --- MODAL CATEGORY --- */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Chọn danh mục
              </Text>
              <FlatList
                data={Object.values(PostCategory).filter((c) => c !== "all")}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setCategory(item as PostCategory);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 16 }}>
                      {formatCategoryLabel(item)}
                    </Text>
                    {category === item && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL MENU (DELETE, SCHEDULE) --- */}
      <Modal visible={showMenuModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMenuModal(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.menuSheet,
                {
                  backgroundColor: theme.card,
                  top: 60,
                  right: 20,
                  position: "absolute",
                },
              ]}
            >
              {/* Lên lịch */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setShowMenuModal(false);
                  setShowDatePicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={{ color: theme.text, fontSize: 16 }}>
                  Lên lịch đăng
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.border,
                  marginVertical: 8,
                }}
              />

              {/* Xóa bài viết */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  setShowMenuModal(false);
                  handleDelete();
                }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={{ color: theme.error, fontSize: 16 }}>
                  Xóa bài viết
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- DATE PICKER --- */}
      {showDatePicker &&
        (Platform.OS === "ios" ? (
          <Modal transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View
                style={[styles.modalContent, { backgroundColor: theme.card }]}
              >
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display="spinner"
                  onChange={onDateChange}
                  textColor={theme.text}
                />
                <TouchableOpacity
                  style={{ padding: 16, alignItems: "center" }}
                  onPress={() => {
                    setShowDatePicker(false);
                    handleSubmit(PostStatus.Scheduled);
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: "bold" }}>
                    Xác nhận lịch đăng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker value={date} mode="date" onChange={onDateChange} />
        ))}

      {/* --- LOADING OVERLAY --- */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text
              style={{ marginTop: 12, color: theme.text, fontWeight: "600" }}
            >
              Đang xử lý...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  btnText: { fontSize: 13, fontWeight: "600" },
  iconBtn: { padding: 4 },
  menuBtn: { padding: 4, marginLeft: 4 },

  scrollContainer: { flex: 1, paddingHorizontal: 20 },

  coverContainer: {
    height: 200,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },

  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlignVertical: "top",
  },

  catBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },

  editorWrapper: { minHeight: 300, flex: 1 },
  richEditor: { minHeight: 300, flex: 1 },
  toolbar: { borderTopWidth: 1, height: 50 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  menuSheet: {
    borderRadius: 12,
    padding: 8,
    width: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    width: 160,
  },
});
