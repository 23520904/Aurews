import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import React, { memo } from "react";
import { Post, User } from "../types/type";
import { formatDate } from "../utils/dateHelpers";
import { Skeleton } from "./Skeleton";

interface ArticleCardProps {
  post: Post;
  onPress: (slug: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post, onPress }) => {
  const formattedDate = formatDate(post.publishTime);

  const authorName =
    typeof post.authorUser === "object" && post.authorUser
      ? (post.authorUser as User).fullName
      : post.author.name;

  const authorAvatar =
    typeof post.authorUser === "object" && post.authorUser
      ? (post.authorUser as User).avatar
      : post.author.avatar;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(post.slug)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Read article: ${post.title}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: post.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        <View style={styles.metaContainer}>
          <View style={styles.authorInfo}>
            {authorAvatar ? (
              <Image
                source={{ uri: authorAvatar }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
          </View>
          <Text style={styles.date}>• {formattedDate}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.views}>{post.views} views</Text>
          {/* Add more stats icons here if needed */}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(185, 28, 28, 0.9)", // Brand red
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 17, // Slightly larger
    fontWeight: "700",
    color: "#0f172a", // Darker slate
    marginBottom: 12,
    lineHeight: 24,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
  },
  avatarPlaceholder: {
    backgroundColor: "#cbd5e1",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    flexShrink: 1,
  },
  date: {
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    paddingTop: 12,
  },
  views: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
});

export default memo(ArticleCard);
