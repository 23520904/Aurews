// src/components/CommentItem.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Comment } from "../types/type"; // Import đúng Type
import { getRelativeTime } from "../utils/dateHelpers"; // Import hàm xử lý ngày

interface CommentItemProps {
  comment: Comment; // KHÔNG DÙNG ANY NỮA
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />

      {/* Nội dung */}
      <View style={styles.content}>
        <Text style={styles.name}>{comment.user.fullName}</Text>

        {/* Sửa comment.content -> comment.text */}
        <Text style={styles.text}>{comment.text}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Xử lý hiển thị thời gian từ ISO string */}
          <Text style={styles.metaText}>
            {getRelativeTime(comment.createdAt)}
          </Text>

          <View style={styles.likeContainer}>
            {/* Nếu likes > 0 thì mới hiện chữ likes */}
            {comment.likes > 0 && (
              <Text style={styles.metaText}>{comment.likes} thích</Text>
            )}
          </View>

          <TouchableOpacity>
            <Text style={styles.replyText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Icon tim bên phải (Optional) */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", marginBottom: 20 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  content: { flex: 1 },
  name: { fontWeight: "700", fontSize: 14, color: "#000", marginBottom: 4 },
  text: { fontSize: 14, color: "#333", lineHeight: 20, marginBottom: 6 },
  footer: { flexDirection: "row", alignItems: "center", gap: 16 },
  metaText: { fontSize: 12, color: "#888" },
  likeContainer: { flexDirection: "row", alignItems: "center" },
  replyText: { fontSize: 12, fontWeight: "600", color: "#666" },
});

export default CommentItem;
