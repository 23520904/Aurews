import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePosts } from "../hooks/post.hook"; // Hook lấy danh sách bài viết
import { useTheme } from "../hooks/theme.hook";
import { getTimeAgo } from "../utils/dateHelpers";

interface RelatedPostsProps {
    currentPostId: string;
    category: string;
}

export const RelatedPosts = ({ currentPostId, category }: RelatedPostsProps) => {
    const router = useRouter();
    const theme = useTheme();

    // Gọi API lấy 6 bài cùng danh mục (Lấy 6 để trừ bài hiện tại là còn 5)
    const { data, isLoading } = usePosts({
        category: category,
        limit: 6
    });

    // Lọc bỏ bài viết hiện tại khỏi danh sách
    const relatedPosts = useMemo(() => {
        if (!data?.posts) return [];
        return data.posts.filter((post: any) => post._id !== currentPostId);
    }, [data, currentPostId]);

    if (isLoading) {
        return <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />;
    }

    if (relatedPosts.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.bar, { backgroundColor: theme.primary }]} />
                <Text style={[styles.heading, { color: theme.text }]}>Bài viết liên quan</Text>
            </View>

            <View style={styles.list}>
                {relatedPosts.map((post: any) => (
                    <TouchableOpacity
                        key={post._id}
                        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => router.push(`/post/${post.slug}`)} // Chuyển sang bài khác
                    >
                        <Image source={{ uri: post.thumbnail }} style={styles.thumb} contentFit="cover" />

                        <View style={styles.info}>
                            <Text style={[styles.cat, { color: theme.primary }]}>{post.category}</Text>
                            <Text
                                style={[styles.title, { color: theme.text }]}
                                numberOfLines={2}
                            >
                                {post.title}
                            </Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                                    {getTimeAgo(post.publishTime)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    bar: {
        width: 4,
        height: 24,
        borderRadius: 2,
        marginRight: 10,
    },
    heading: {
        fontSize: 20,
        fontWeight: '800',
    },
    list: {
        gap: 15,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        // Shadow nhẹ
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    thumb: {
        width: 100,
        height: 100,
    },
    info: {
        flex: 1,
        padding: 10,
        justifyContent: 'center',
    },
    cat: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    meta: {
        fontSize: 11,
    }
});