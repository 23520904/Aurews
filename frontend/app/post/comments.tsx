import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useAuthStore } from "../../src/stores/auth.store";
import {
  useComments,
  useCreateComment,
  useToggleLikeComment,
  useDeleteComment,
} from "../../src/hooks/comment.hook";
import { useMyProfile } from "../../src/hooks/user.hook";
import { Comment } from "../../src/types/type";
import { useTheme } from "../../src/hooks/theme.hook";
import { getTimeAgo } from "../../src/utils/dateHelpers";

// Component con để hiển thị Replies (Lazy Load)
const ReplyList = ({
  postId,
  parentId,
  onReplyPress,
  currentUser,
}: {
  postId: string;
  parentId: string;
  onReplyPress: (comment: Comment) => void;
  currentUser: any;
}) => {
  const theme = useTheme();
  const { data: replies, isLoading } = useComments(postId, parentId);

  if (isLoading) {
    return (
      <View style={{ paddingLeft: 50, paddingVertical: 10 }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (!replies || replies.length === 0) return null;

  return (
    <View style={{ paddingLeft: 16 }}>
      {replies.map((reply: Comment) => (
        <CommentItem
          key={reply._id}
          item={reply}
          postId={postId}
          onReplyPress={onReplyPress}
          currentUser={currentUser}
          isReply
        />
      ))}
    </View>
  );
};

// Component hiển thị 1 Comment (hoặc Reply)
const CommentItem = ({
  item,
  postId,
  onReplyPress,
  currentUser,
  isReply = false,
}: {
  item: Comment;
  postId: string;
  onReplyPress: (comment: Comment) => void;
  currentUser: any;
  isReply?: boolean;
}) => {
  const theme = useTheme();
  const router = useRouter();
  // Remove local useAuthStore, use prop instead
  const user = currentUser;
  const toggleLike = useToggleLikeComment(postId);
  const deleteComment = useDeleteComment(postId);

  const [showReplies, setShowReplies] = useState(false);

  // Direct derived state from props - No local state for optimistic UI
  const isLiked =
    item.likesBy?.some((id) => id.toString() === user?._id?.toString()) ||
    false;
  // Use likesBy.length as the source of truth if available, falling back to item.likes
  const likesCount = item.likesBy ? item.likesBy.length : item.likes || 0;

  const isOwner = user?._id === item.user._id;
  const isAdmin = item.user.role === "admin";
  const isAuthor = item.user.role === "author";

  const handleLike = () => {
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để thích bình luận");
      return;
    }
    // Directly call mutation, UI updates when query invalidates and refetches
    toggleLike.mutate(item._id);
  };

  const handleDelete = () => {
    Alert.alert("Xóa bình luận", "Bạn có chắc muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => deleteComment.mutate(item._id),
      },
    ]);
  };

  const getAvatarSource = (avatarUrl?: string) => {
    if (avatarUrl && avatarUrl.startsWith("http")) {
      return { uri: avatarUrl };
    }
    return { uri: "https://avatar.iran.liara.run/public" };
  };

  return (
    <View style={[styles.commentItem, isReply && styles.replyItem]}>
      <TouchableOpacity
        onPress={() => router.push(`/user/${item.user._id}` as any)}
      >
        <Image
          source={getAvatarSource(item.user.avatar)}
          style={styles.avatar}
          contentFit="cover"
          transition={500}
        />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.content, { color: theme.text }]}>
              <Text
                style={[styles.username, { color: theme.text }]}
                onPress={() => router.push(`/user/${item.user._id}` as any)}
              >
                {item.user.fullName}
              </Text>
              {isAdmin && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#00BFFF"
                  style={{ marginLeft: 2, top: 2 }}
                />
              )}
              {isAuthor && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#7E000B"
                  style={{ marginLeft: 2, top: 2 }}
                />
              )}{" "}
              {item.text}
            </Text>

            <View style={styles.actionRow}>
              <Text
                style={[
                  styles.time,
                  { color: theme.textSecondary, marginRight: 12 },
                ]}
              >
                {getTimeAgo(item.createdAt)}
              </Text>
              {/* Reply Button */}
              <TouchableOpacity onPress={() => onReplyPress(item)}>
                <Text
                  style={[styles.actionText, { color: theme.textSecondary }]}
                >
                  Trả lời
                </Text>
              </TouchableOpacity>

              {/* Delete Button */}
              {isOwner && (
                <TouchableOpacity
                  style={{ marginLeft: 12 }}
                  onPress={handleDelete}
                >
                  <Text
                    style={[styles.actionText, { color: theme.textSecondary }]}
                  >
                    Xóa
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Like Icon */}
          <TouchableOpacity
            onPress={handleLike}
            style={{
              alignItems: "center",
              paddingTop: 4,
              minWidth: 40,
              paddingHorizontal: 4,
            }}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? theme.error : theme.textSecondary}
            />
            {likesCount > 0 && (
              <Text
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  marginTop: 2,
                }}
              >
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* View Replies Button */}
        {item.replyCount > 0 && !isReply && (
          <View
            style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
          >
            <View
              style={{
                width: 30,
                height: 1,
                backgroundColor: theme.border,
                marginRight: 8,
              }}
            />
            <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
              <Text
                style={[styles.viewReplyText, { color: theme.textSecondary }]}
              >
                {showReplies
                  ? "Ẩn câu trả lời"
                  : `Xem ${item.replyCount} câu trả lời`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showReplies && (
          <ReplyList
            postId={postId}
            parentId={item._id}
            onReplyPress={onReplyPress}
            currentUser={currentUser}
          />
        )}
      </View>
    </View>
  );
};

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { user: authUser } = useAuthStore();
  const { data: profileResponse } = useMyProfile();

  // Use profile data if available, fallback to auth store
  const user = useMemo(() => {
    return (profileResponse as any)?.data || authUser;
  }, [profileResponse, authUser]);

  const targetId = Array.isArray(postId) ? postId[0] : postId;

  const commentsQuery = useComments(targetId as string);
  const createComment = useCreateComment(targetId as string);

  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const postComments = commentsQuery.data ?? [];

  const handleSend = () => {
    if (!text.trim()) return;

    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để bình luận.", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    createComment.mutate(
      { content: text, parentCommentId: replyingTo?.id },
      {
        onSuccess: () => {
          setText("");
          setReplyingTo(null);
          setShowEmojiPicker(false); // Close emoji picker after send
        },
      }
    );
  };

  const handleReplyPress = (comment: Comment) => {
    // Nếu comment hiện tại là reply, thì parentId vẫn là parentComment của nó
    // Nếu comment hiện tại là root, thì parentId là _id của nó
    const targetParentId = comment.parentComment || comment._id;

    setReplyingTo({
      id: targetParentId,
      username: comment.user.fullName,
    });
    // Set text to @username
    setText(`@${comment.user.username} `);
  };

  const handleEmojiPress = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const EMOJIS = [
    "❤️",
    "🙌",
    "🔥",
    "👏",
    "😢",
    "😍",
    "😮",
    "😂",
    "👍",
    "👎",
    "👊",
    "✊",
    "✌️",
    "👌",
    "✋",
    "💪",
    "🙏",
    "☝️",
    "👆",
    "👇",
    "👈",
    "👉",
    "🖕",
    "🖐",
    "🤘",
    "🖖",
    "✍️",
    "💅",
    "👄",
    "👅",
    "👂",
    "👃",
    "👁",
    "👀",
    "👤",
    "👥",
    "🗣",
    "👶",
    "👦",
    "👧",
    "👨",
    "👩",
    "👱",
    "👴",
    "👵",
    "👲",
    "👳",
    "👮",
    "👷",
    "💂",
    "🕵",
    "🎅",
    "👼",
    "👸",
    "👰",
    "🚶",
    "🏃",
    "💃",
    "👯",
    "👫",
    "👬",
    "👭",
    "🙇",
    "💁",
    "🙅",
    "🙆",
    "🙋",
    "🙎",
    "🙍",
    "💇",
    "💆",
    "💑",
    "👩‍❤️‍👩",
    "👨‍❤️‍👨",
    "💏",
    "👩‍❤️‍💋‍👩",
    "👨‍❤️‍💋‍👨",
    "👪",
    "👨‍👩‍👧",
    "👨‍👩‍👧‍👦",
    "👨‍👩‍👦‍👦",
    "👨‍👩‍👧‍👧",
    "👩‍👩‍👦",
    "👩‍👩‍👧",
    "👩‍👩‍👧‍👦",
    "👩‍👩‍👦‍👦",
    "👩‍👩‍👧‍👧",
    "👨‍👨‍👦",
    "👨‍👨‍👧",
    "👨‍👨‍👧‍👦",
    "👨‍👨‍👦‍👦",
    "👨‍👨‍👧‍👧",
    "👚",
    "👕",
    "👖",
    "👔",
    "👗",
    "👙",
    "👘",
    "💄",
    "💋",
    "👣",
    "👠",
    "👡",
    "👢",
    "👞",
    "👟",
    "👒",
    "🎩",
    "🎓",
    "👑",
    "🎒",
    "👝",
    "👛",
    "👜",
    "💼",
    "👓",
    "🕶",
    "💍",
    "🌂",
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]} // Only apply safe area to top/sides, let KeyboardAvoidingView handle bottom
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Bình luận
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={postComments}
        renderItem={({ item }) => (
          <CommentItem
            item={item}
            postId={targetId}
            onReplyPress={handleReplyPress}
            currentUser={user}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !commentsQuery.isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={48}
                color={theme.border}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Chưa có bình luận nào.
              </Text>
              <Text
                style={[styles.emptySubText, { color: theme.textSecondary }]}
              >
                Hãy là người đầu tiên bình luận!
              </Text>
            </View>
          ) : (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              color={theme.primary}
            />
          )
        }
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ width: "100%" }}
      >
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.background,
              paddingBottom: Platform.OS === "ios" ? 20 : 0, // Extra padding for iOS home indicator
            },
          ]}
        >
          {/* Quick Emoji Bar (Horizontal) - Only show first 8 */}
          {!showEmojiPicker && (
            <View style={{ height: 40, justifyContent: "center" }}>
              <FlatList
                horizontal
                data={EMOJIS.slice(0, 8)}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 4,
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleEmojiPress(item)}
                    style={{ marginRight: 20 }}
                  >
                    <Text style={{ fontSize: 24 }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {replyingTo && (
            <View
              style={[
                styles.replyBar,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.replyText, { color: theme.textSecondary }]}>
                Đang trả lời{" "}
                <Text style={{ fontWeight: "bold", color: theme.text }}>
                  {replyingTo.username}
                </Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              paddingVertical: 8,
            }}
          >
            {user ? (
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                <Image
                  source={{
                    uri:
                      user.avatar && user.avatar.startsWith("http")
                        ? user.avatar
                        : "https://avatar.iran.liara.run/public",
                  }}
                  style={[styles.myAvatar, { marginBottom: 4 }]}
                  contentFit="cover"
                  transition={500}
                />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.myAvatar,
                  {
                    marginBottom: 4,
                    backgroundColor: theme.border,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Ionicons name="person" size={16} color={theme.textSecondary} />
              </View>
            )}

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  minHeight: 44,
                  paddingVertical: 4,
                  flexDirection: "row", // Ensure items are in row
                  alignItems: "center", // Center vertically
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    height: "100%", // Fill wrapper height
                    textAlignVertical: "center",
                    flex: 1, // Take up remaining space
                  },
                ]}
                placeholder={
                  user
                    ? replyingTo
                      ? `Trả lời ${replyingTo.username}...`
                      : "Thêm bình luận..."
                    : "Đăng nhập để bình luận"
                }
                placeholderTextColor={theme.textSecondary}
                value={text}
                onChangeText={setText}
                editable={!!user}
                multiline
                numberOfLines={4} // Allow up to 4 lines
                scrollEnabled // Enable scrolling if text exceeds
              />

              {/* Emoji Icon Button inside Input */}
              <TouchableOpacity
                style={{ padding: 4, marginRight: 4 }}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Ionicons
                  name={showEmojiPicker ? "keypad" : "happy-outline"}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              style={{
                marginLeft: 12,
                marginBottom: 8,
                opacity: text.trim() ? 1 : 0.5,
              }}
              disabled={!text.trim()}
            >
              <Ionicons name="paper-plane" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Full Emoji Picker (Grid) */}
          {showEmojiPicker && (
            <View
              style={{
                height: 250,
                borderTopWidth: 1,
                borderTopColor: theme.border,
              }}
            >
              <FlatList
                data={EMOJIS}
                numColumns={8}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ padding: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleEmojiPress(item)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      height: 40,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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

  list: { padding: 16 },
  commentItem: { flexDirection: "row", marginBottom: 20 },
  replyItem: { marginTop: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  bubble: {
    borderRadius: 12,
    padding: 12,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  username: { fontWeight: "bold", fontSize: 13, marginRight: 4 },
  time: { fontSize: 12 },
  content: { fontSize: 14, lineHeight: 20 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 0,
    marginTop: 4,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#666" },
  actionBtn: { marginRight: 12, paddingVertical: 2 },
  likeCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: 8,
  },
  likeCountText: { fontSize: 12, marginLeft: 2, fontWeight: "400" },
  viewReplyText: { fontSize: 12, fontWeight: "600", color: "#666" },

  likeBtn: {
    display: "none", // Hide old like button
  },
  likeCount: { fontSize: 10, marginTop: 2 },

  emptyContainer: { alignItems: "center", marginTop: 50, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "500" },
  emptySubText: { fontSize: 14 },

  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  replyText: { fontSize: 12 },
  myAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: "#ccc", // Fallback color to make it visible
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 8,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
