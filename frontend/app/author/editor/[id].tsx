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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from 'expo-av';

// Editor
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
  useDeletePost,
} from "../../../src/hooks/post.hook";
import { useTheme } from "../../../src/hooks/theme.hook";
import { PostCategory, PostStatus } from "../../../src/types/type";

import { client } from "../../../src/api/client";

// Interfaces
interface TranscribeResponse { text: string; }
interface ImageUploadResponse { url: string; }
interface RefineResponse { refinedText: string; }

// Helper
const formatCategoryLabel = (cat?: string | PostCategory) => {
  if (!cat) return "Chọn danh mục";
  const s = String(cat);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function EditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  // --- REFS QUAN TRỌNG CHO AUTO-SAVE ---
  const currentPostIdRef = useRef(id === "new" ? null : (id as string));
  const hasLoadedData = useRef(false);

  // --- STATE ---
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Smart Features State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const [showRefineModal, setShowRefineModal] = useState(false);
  const [originalTextForRefine, setOriginalTextForRefine] = useState("");
  const [refinedTextResult, setRefinedTextResult] = useState("");
  const [isRefiningSelection, setIsRefiningSelection] = useState(false);

  const richText = useRef<RichEditor>(null);

  // Data Hooks
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePostGeneric();
  const deleteMutation = useDeletePost();

  const isEditingInitial = id && id !== "new";
  const { data: postResponse, isLoading: isLoadingPost } = usePost(
    isEditingInitial ? (id as string) : undefined
  );

  // Form State
  const [title, setTitle] = useState("");
  const [contentHTML, setContentHTML] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<PostCategory>(PostCategory.Technology);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset cờ khi ID đổi
  useEffect(() => {
    if (id === "new") {
      hasLoadedData.current = true;
    } else {
      hasLoadedData.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (isEditingInitial && postResponse?.data && !hasLoadedData.current) {
      const post = postResponse.data;

      setTitle(post.title);
      setContentHTML(post.text || "");
      setCoverImage(post.thumbnail);
      setCategory(post.category);
      if (post.publishTime) setDate(new Date(post.publishTime));

      setTimeout(() => {
        richText.current?.setContentHTML(post.text || "");
      }, 500);

      currentPostIdRef.current = post._id;
      hasLoadedData.current = true;
    }
  }, [postResponse, isEditingInitial]);


  // =====================================================================
  //  2. SERVER-SIDE AUTO-SAVE LOGIC
  // =====================================================================
  useEffect(() => {
    if (!hasLoadedData.current || isLoadingPost || !title.trim()) return;

    setSaveStatus('saving');

    const timer = setTimeout(async () => {
      try {
        const html = await richText.current?.getContentHtml();
        const finalContent = html || contentHTML || "";

        const formData = new FormData();
        formData.append("title", title);
        formData.append("text", finalContent);
        formData.append("content", finalContent);
        formData.append("category", category);
        formData.append("status", PostStatus.Draft);

        if (coverImage) {
          if (coverImage.startsWith("file://")) {
            const filename = coverImage.split("/").pop() || "cover.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            // @ts-ignore
            formData.append("thumbnail", { uri: coverImage, name: filename, type });
          }
        }

        const activeId = currentPostIdRef.current;

        if (activeId) {
          // UPDATE
          await updatePostMutation.mutateAsync({
            postId: activeId,
            formData,
          });
        } else {
          // CREATE NEW
          // [FIX] Ép kiểu 'as any' để tránh lỗi TypeScript 'does not exist on type {}'
          const res = (await createPostMutation.mutateAsync(formData)) as any;

          // Lấy ID từ response (cấu trúc controller trả về: { success: true, data: { ... } })
          const newId = res?.data?._id || res?._id || res?.data?.data?._id;

          if (newId) {
            console.log("Auto-created draft with ID:", newId);
            currentPostIdRef.current = newId;
            router.setParams({ id: newId });
          }
        }

        setSaveStatus('saved');
      } catch (e) {
        console.error("Server Auto-save failed:", e);
        setSaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, contentHTML, coverImage, category]);


  // =====================================================================
  //  ACTIONS
  // =====================================================================

  const handleSubmit = async (targetStatus: PostStatus) => {
    if (!title.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    const html = await richText.current?.getContentHtml();
    const finalContent = html || contentHTML || "";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("text", finalContent);
    formData.append("content", finalContent);
    formData.append("category", category);
    formData.append("status", targetStatus);

    let publishTime = new Date().toISOString();
    if (targetStatus === PostStatus.Scheduled) {
      publishTime = date.toISOString();
    }
    formData.append("publishTime", publishTime);

    if (coverImage && coverImage.startsWith("file://")) {
      const filename = coverImage.split("/").pop() || "cover.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      // @ts-ignore
      formData.append("thumbnail", { uri: coverImage, name: filename, type });
    } else if (coverImage) {
      formData.append("thumbnailUrl", coverImage);
    }

    try {
      const activeId = currentPostIdRef.current;

      if (activeId) {
        await updatePostMutation.mutateAsync({ postId: activeId, formData });
      } else {
        await createPostMutation.mutateAsync(formData);
      }

      Alert.alert("Thành công", targetStatus === PostStatus.Published ? "Đã đăng bài viết." : "Đã lưu vào máy chủ.");
      router.replace("/author/manage");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể lưu bài viết.");
    }
  };

  // --- Helper Functions ---
  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, aspect: [16, 9], quality: 0.8, allowsEditing: true,
    });
    if (!result.canceled) setCoverImage(result.assets[0].uri);
  };

  const handleInsertImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0].uri) {
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        const formData = new FormData();
        // @ts-ignore
        formData.append('image', { uri: localUri, name: filename, type });
        // [FIX] Thêm Generic type <ImageUploadResponse>
        const res = await client.post<ImageUploadResponse>('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        // Client có thể trả về res hoặc res.data tùy config, kiểm tra cả 2
        const url = res?.url || (res as any)?.data?.url;
        if (url) richText.current?.insertImage(url);
      } catch (error) { Alert.alert("Lỗi", "Không thể upload ảnh."); }
    }
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') await requestPermission();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) { Alert.alert("Lỗi Micro", "Không thể ghi âm."); }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recording) return;
    setIsProcessingAI(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const formData = new FormData();
        // @ts-ignore
        formData.append('audio', { uri, name: 'voice.m4a', type: 'audio/m4a' });
        const res = await client.post<TranscribeResponse>('/posts/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.text) richText.current?.insertHTML(` ${res.text} `);
      }
    } catch (error) { Alert.alert("Lỗi", "Lỗi xử lý giọng nói."); } finally { setIsProcessingAI(false); }
  };

  const handleRefineAI = async () => {
    const html = await richText.current?.getContentHtml();
    const plainText = html?.replace(/<[^>]+>/g, '') || "";
    if (!plainText || plainText.length < 10) { Alert.alert("AI", "Nội dung quá ngắn."); return; }
    setIsProcessingAI(true); setIsRefiningSelection(false); setOriginalTextForRefine(html || "");
    try {
      const res = await client.post<RefineResponse>('/posts/refine', { text: html });
      setRefinedTextResult(res.refinedText); setShowRefineModal(true);
    } catch (e) { Alert.alert("Lỗi", "Lỗi AI."); } finally { setIsProcessingAI(false); }
  };

  const applyRefinedText = () => {
    richText.current?.setContentHTML(refinedTextResult); setShowRefineModal(false);
  };

  const handleDelete = () => {
    if (!currentPostIdRef.current) return;
    Alert.alert("Xóa bài?", "Hành động này không thể hoàn tác.", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => deleteMutation.mutate(currentPostIdRef.current as string, { onSuccess: () => router.replace("/author/manage") }) }
    ]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios"); setDate(currentDate);
    if (event.type === "set" && Platform.OS !== "ios") handleSubmit(PostStatus.Scheduled);
  };

  const isSaving = createPostMutation.isPending || updatePostMutation.isPending;

  const renderSaveButton = () => {
    if (isSaving) return <ActivityIndicator size="small" color={theme.textSecondary} />;

    switch (saveStatus) {
      case 'saving':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.btnText, { color: theme.primary }]}>Đang lưu...</Text>
          </View>
        );
      case 'saved':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="cloud-done" size={16} color={theme.success} />
            <Text style={[styles.btnText, { color: theme.success }]}>Đã đồng bộ</Text>
          </View>
        );
      case 'error':
        return <Text style={[styles.btnText, { color: theme.error }]}>Lỗi mạng!</Text>;
      case 'idle':
      default:
        return <Text style={[styles.btnText, { color: theme.textSecondary }]}>Nháp</Text>;
    }
  };

  if (isLoadingPost) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
            onPress={() => handleSubmit(PostStatus.Draft)}
            disabled={isSaving || saveStatus === 'saving'}
          >
            {renderSaveButton()}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary, paddingHorizontal: 16 }]}
            onPress={() => handleSubmit(PostStatus.Published)}
            disabled={isSaving}
          >
            <Text style={[styles.btnText, { color: "#fff", fontWeight: "700" }]}>Đăng</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuBtn]} onPress={() => setShowMenuModal(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* EDITOR */}
      <ScrollView style={styles.scrollContainer} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={pickCoverImage} style={[styles.coverContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Thêm ảnh bìa</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.titleInput, { color: theme.text }]}
          placeholder="Tiêu đề bài viết..."
          placeholderTextColor={theme.textSecondary}
          multiline
          value={title}
          onChangeText={setTitle}
        />

        <TouchableOpacity style={[styles.catBadge, { backgroundColor: theme.primary + "15" }]} onPress={() => setShowCategoryModal(true)}>
          <Text style={{ color: theme.primary, fontWeight: "600" }}>{formatCategoryLabel(category)}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.primary} />
        </TouchableOpacity>

        <View style={[styles.editorWrapper, { borderColor: theme.border }]}>
          <RichEditor
            ref={richText}
            placeholder="Nội dung bài viết..."
            initialContentHTML={contentHTML}
            onChange={setContentHTML}
            editorStyle={{
              backgroundColor: theme.background, color: theme.text, placeholderColor: theme.textSecondary,
              contentCSSText: "font-size: 16px; line-height: 24px;",
            }}
            style={styles.richEditor}
            useContainer={false}
          />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* SMART TOOLBAR */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "android" ? 30 : 0}>
        <View style={[styles.smartToolbar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <Text style={[styles.smartLabel, { color: theme.textSecondary }]}>AI Tools:</Text>
          <TouchableOpacity style={[styles.smartBtn, recording ? { backgroundColor: theme.error } : { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]} onPress={recording ? stopRecordingAndTranscribe : startRecording} disabled={isProcessingAI}>
            {isProcessingAI && recording ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={recording ? "stop" : "mic"} size={20} color={recording ? "#fff" : theme.text} />}
            {recording && <Text style={{ color: '#fff', fontSize: 12, marginLeft: 4 }}>Đang nghe...</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smartBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]} onPress={handleRefineAI} disabled={isProcessingAI || recording !== null}>
            {isProcessingAI && !recording ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="sparkles" size={20} color="#8A2BE2" />}
            <Text style={{ color: theme.text, fontSize: 12, marginLeft: 6 }}>Refine</Text>
          </TouchableOpacity>
        </View>
        <RichToolbar
          editor={richText} selectedIconTint={theme.primary} iconTint={theme.textSecondary}
          style={[styles.toolbar, { backgroundColor: theme.card }]}
          actions={[actions.setBold, actions.setItalic, actions.heading1, actions.insertLink, actions.insertImage, actions.insertBulletsList, actions.undo, actions.redo]}
          onPressAddImage={handleInsertImage}
        />
      </KeyboardAvoidingView>

      {/* MODALS */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn danh mục</Text>
              <FlatList
                data={Object.values(PostCategory).filter((c) => c !== "all")}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.modalItem, { borderBottomColor: theme.border }]} onPress={() => { setCategory(item as PostCategory); setShowCategoryModal(false); }}>
                    <Text style={{ color: theme.text, fontSize: 16 }}>{formatCategoryLabel(item)}</Text>
                    {category === item && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showMenuModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMenuModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuSheet, { backgroundColor: theme.card, top: 60, right: 20, position: "absolute" }]}>
              <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenuModal(false); setShowDatePicker(true); }}>
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 16 }}>Lên lịch đăng</Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8 }} />
              <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenuModal(false); handleDelete(); }}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={{ color: theme.error, fontSize: 16 }}>Xóa bài viết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {showDatePicker && (Platform.OS === "ios" ? (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <DateTimePicker value={date} mode="datetime" display="spinner" onChange={onDateChange} textColor={theme.text} />
              <TouchableOpacity style={{ padding: 16, alignItems: "center" }} onPress={() => { setShowDatePicker(false); handleSubmit(PostStatus.Scheduled); }}>
                <Text style={{ color: theme.primary, fontWeight: "bold" }}>Xác nhận lịch đăng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : (<DateTimePicker value={date} mode="date" onChange={onDateChange} />))}

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 12, color: theme.text, fontWeight: "600" }}>Đang xử lý...</Text>
          </View>
        </View>
      )}

      <Modal visible={showRefineModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalOverlay, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>AI Đề xuất chỉnh sửa</Text>
            <TouchableOpacity onPress={() => setShowRefineModal(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={{ flex: 1, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Gốc:</Text>
              <ScrollView nestedScrollEnabled><Text style={{ color: theme.text, fontSize: 16, opacity: 0.6 }}>{originalTextForRefine.replace(/<[^>]+>/g, '')}</Text></ScrollView>
            </View>
            <View style={{ flex: 1, padding: 16, backgroundColor: theme.primary + '10' }}>
              <Text style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>AI Viết lại:</Text>
              <ScrollView nestedScrollEnabled><Text style={{ color: theme.text, fontSize: 16, lineHeight: 24 }}>{refinedTextResult.replace(/<[^>]+>/g, '')}</Text></ScrollView>
            </View>
          </View>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.border }} onPress={() => setShowRefineModal(false)}><Text style={{ color: theme.text, fontWeight: '600' }}>Hủy</Text></TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', backgroundColor: theme.primary }} onPress={applyRefinedText}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Áp dụng</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, minWidth: 80, alignItems: "center", justifyContent: "center", height: 36 },
  btnText: { fontSize: 13, fontWeight: "600" },
  iconBtn: { padding: 4 },
  menuBtn: { padding: 4, marginLeft: 4 },
  scrollContainer: { flex: 1, paddingHorizontal: 20 },
  coverContainer: {
    height: 200, borderRadius: 12, marginTop: 20, marginBottom: 20,
    borderWidth: 1, borderStyle: "dashed", justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },
  titleInput: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlignVertical: "top" },
  catBadge: {
    flexDirection: "row", alignSelf: "flex-start", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 20,
  },
  editorWrapper: { minHeight: 300, flex: 1 },
  richEditor: { minHeight: 300, flex: 1 },
  toolbar: { borderTopWidth: 0, height: 50 },
  smartToolbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, gap: 12
  },
  smartLabel: { fontSize: 12, fontWeight: '600' },
  smartBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, justifyContent: 'center'
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "60%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1 },
  menuSheet: { borderRadius: 12, padding: 8, width: 200, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  menuOption: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", zIndex: 99 },
  loadingBox: { padding: 24, borderRadius: 16, alignItems: "center", width: 160 },
});