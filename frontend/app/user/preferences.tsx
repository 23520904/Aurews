// app/user/preferences.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';

const CATEGORIES = ["Công nghệ", "Thể thao", "Chính trị", "Sức khỏe", "Kinh doanh", "Nghệ thuật"];

export default function PreferencesScreen() {
    const [selected, setSelected] = useState<string[]>(["Công nghệ", "Sức khỏe"]); // Mock data cũ

    const toggleCategory = (cat: string) => {
        if (selected.includes(cat)) {
            setSelected(selected.filter(c => c !== cat));
        } else {
            setSelected([...selected, cat]);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Sở thích của tôi' }} />
            <Text style={styles.title}>Tùy chỉnh bảng tin</Text>
            <Text style={styles.subtitle}>Chọn chủ đề bạn quan tâm.</Text>

            <View style={styles.list}>
                {CATEGORIES.map(cat => (
                    <View key={cat} style={styles.row}>
                        <Text style={styles.label}>{cat}</Text>
                        <Switch
                            value={selected.includes(cat)}
                            onValueChange={() => toggleCategory(cat)}
                            trackColor={{ false: "#767577", true: "#b91c1c" }}
                        />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { color: '#666', marginBottom: 24 },
    list: { gap: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 16 }
});