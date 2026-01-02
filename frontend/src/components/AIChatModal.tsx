import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image'; // Dùng expo-image cho đẹp
import { useRouter } from "expo-router"; // Để navigate khi bấm vào bài liên quan
import { useTheme } from '../hooks/theme.hook';
import { client } from '../api/client';

interface AIChatModalProps {
    visible: boolean;
    onClose: () => void;
    articleContent: string;
    currentPostId: string; // Cần ID để backend lọc trùng
}
interface AIChatResponse {
    answer: string;
    relatedPosts?: any[]; // Danh sách bài liên quan
    suggestions?: string[]; // Danh sách gợi ý câu hỏi
}

interface Message {
    role: 'user' | 'ai';
    text: string;
    relatedPosts?: any[]; // Bài viết liên quan kèm theo tin nhắn AI
}

export const AIChatModal = ({ visible, onClose, articleContent, currentPostId }: AIChatModalProps) => {
    const theme = useTheme();
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);

    // 1. Tự động lấy gợi ý câu hỏi khi mở Modal
    useEffect(() => {
        if (visible && suggestions.length === 0) {
            fetchSuggestions();
        }
    }, [visible]);

    const fetchSuggestions = async () => {
        setLoadingSuggest(true);
        try {
            const res = await client.post<AIChatResponse>('/posts/chat-article', { content: articleContent });
            // Gọi API không kèm question -> Backend hiểu là xin gợi ý
            if (res.suggestions) setSuggestions(res.suggestions);
        } catch (e) {
            console.log("Lỗi lấy gợi ý");
        } finally {
            setLoadingSuggest(false);
        }
    };

    const handleSend = async (customQuestion?: string) => {
        const qToSend = customQuestion || question;
        if (!qToSend.trim()) return;

        // UI Update
        setMessages(prev => [...prev, { role: 'user', text: qToSend }]);
        setQuestion("");
        setLoading(true);

        try {
            const res = await client.post<AIChatResponse>('/posts/chat-article', {
                content: articleContent,
                currentPostId,
                question: qToSend,
                history: messages.map(m => ({ role: m.role, content: m.text })) // Gửi lịch sử để AI nhớ
            });

            setMessages(prev => [...prev, {
                role: 'ai',
                text: res.answer,
                relatedPosts: res.relatedPosts // Nhận bài liên quan từ backend
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Lỗi kết nối AI." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.background }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Trợ lý AI 🤖</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>Hỏi đáp & Mở rộng kiến thức</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                        <Ionicons name="close" size={26} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1, padding: 15 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 && (
                        <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.7 }}>
                            <Ionicons name="sparkles" size={40} color={theme.primary} />
                            <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 10 }}>
                                AI đã sẵn sàng!{"\n"}Chọn gợi ý bên dưới hoặc nhập câu hỏi.
                            </Text>
                        </View>
                    )}

                    {messages.map((msg, index) => (
                        <View key={index} style={{ marginBottom: 15 }}>
                            {/* Bong bóng Chat */}
                            <View style={[
                                styles.msgBubble,
                                msg.role === 'user'
                                    ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                                    : { alignSelf: 'flex-start', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }
                            ]}>
                                <Text style={{ color: msg.role === 'user' ? '#fff' : theme.text, lineHeight: 20 }}>{msg.text}</Text>
                            </View>

                            {/* [NEW] Recommend Card nếu có */}
                            {msg.role === 'ai' && msg.relatedPosts && msg.relatedPosts.length > 0 && (
                                <View style={{ marginTop: 8, marginLeft: 5 }}>
                                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 5 }}>
                                        💡 Có thể bạn quan tâm:
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {msg.relatedPosts.map((post) => (
                                            <TouchableOpacity
                                                key={post._id}
                                                style={[styles.recCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                                onPress={() => {
                                                    onClose(); // Đóng modal
                                                    router.push(`/post/${post.slug}`); // Chuyển trang
                                                }}
                                            >
                                                <Image source={{ uri: post.thumbnail }} style={styles.recThumb} />
                                                <View style={{ flex: 1, padding: 8, justifyContent: 'center' }}>
                                                    <Text style={[styles.recTitle, { color: theme.text }]} numberOfLines={2}>{post.title}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    ))}

                    {loading && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 8 }}>AI đang suy nghĩ...</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Suggestion Chips (Gợi ý câu hỏi) */}
                {!loading && (
                    <View style={{ paddingHorizontal: 10, marginBottom: 5 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {loadingSuggest ? (
                                <Text style={{ fontSize: 12, color: theme.textSecondary, padding: 10 }}>Đang tạo gợi ý...</Text>
                            ) : (
                                suggestions.map((sug, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.primary }]}
                                        onPress={() => handleSend(sug)}
                                    >
                                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '500' }}>{sug}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* Input Area */}
                <View style={[styles.inputArea, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                        placeholder="Hỏi gì đó..."
                        placeholderTextColor={theme.textSecondary}
                        value={question}
                        onChangeText={setQuestion}
                    />
                    <TouchableOpacity
                        onPress={() => handleSend()}
                        style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: question ? 1 : 0.5 }]}
                        disabled={!question}
                    >
                        <Ionicons name="arrow-up" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 18, fontWeight: 'bold' },
    msgBubble: { padding: 12, borderRadius: 16, maxWidth: '85%' },
    inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
    input: { flex: 1, padding: 12, borderRadius: 24, marginRight: 10, maxHeight: 100 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

    // Styles mới
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 5 },
    recCard: { flexDirection: 'row', width: 220, height: 60, borderRadius: 8, borderWidth: 1, marginRight: 10, overflow: 'hidden' },
    recThumb: { width: 60, height: 60 },
    recTitle: { fontSize: 11, fontWeight: '600' }
});