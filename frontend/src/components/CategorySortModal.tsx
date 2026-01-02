import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from "react-native-draggable-flatlist";
import { useTheme } from "../hooks/theme.hook";
import { DEFAULT_CATEGORIES } from "../stores/preference.store";

interface Props {
    visible: boolean;
    onClose: () => void;
    currentOrderIds: string[]; // Danh sách ID hiện tại
    onSave: (newOrderIds: string[]) => void;
}

const { height } = Dimensions.get("window");

export const CategorySortModal = ({ visible, onClose, currentOrderIds, onSave }: Props) => {
    const theme = useTheme();

    // State cục bộ để lưu thứ tự khi đang kéo (chưa bấm Save)
    const [data, setData] = useState<any[]>([]);

    // Mỗi khi mở modal, load lại dữ liệu theo thứ tự ID hiện tại
    useEffect(() => {
        if (visible) {
            const orderedData = currentOrderIds
                .map((id) => DEFAULT_CATEGORIES.find((c) => c.id === id))
                .filter(Boolean); // Lọc bỏ undefined

            // Nếu có category mới trong code mà chưa có trong store, thêm vào cuối
            const missing = DEFAULT_CATEGORIES.filter(c => !currentOrderIds.includes(c.id));

            setData([...orderedData, ...missing]);
        }
    }, [visible, currentOrderIds]);

    const handleSave = () => {
        const newIds = data.map((item) => item.id);
        onSave(newIds);
        onClose();
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag} // [UX] Nhấn giữ để kéo
                    disabled={isActive}
                    style={[
                        styles.rowItem,
                        {
                            backgroundColor: isActive ? theme.card : theme.background,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Icon tay cầm (Handle) */}
                        <Ionicons name="reorder-three" size={24} color={theme.textSecondary} style={{ marginRight: 10 }} />
                        <Text style={[styles.text, { color: theme.text }]}>{item.label}</Text>
                    </View>

                    {/* Nút giả lập trạng thái active */}
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    {/* Header Modal */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.text }]}>Sắp xếp danh mục</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>Lưu</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.hint, { color: theme.textSecondary }]}>
                        Nhấn giữ biểu tượng <Ionicons name="reorder-three" size={14} /> để di chuyển
                    </Text>

                    {/* List Kéo Thả */}
                    <DraggableFlatList
                        data={data}
                        onDragEnd={({ data }) => setData(data)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        containerStyle={{ flex: 1 }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    container: {
        height: height * 0.85, // Chiếm 85% màn hình
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: "bold" },
    hint: { textAlign: 'center', fontSize: 13, marginTop: 10, marginBottom: 5 },
    rowItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    text: { fontSize: 16, fontWeight: "500" },
});