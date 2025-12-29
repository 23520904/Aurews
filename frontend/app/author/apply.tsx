import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

export default function ApplyAuthorScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Become an Author</Text>
                <Text style={styles.desc}>Join our community of writers and share your voice with the world.</Text>

                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/author/manage')}>
                    <Text style={styles.btnText}>Apply Now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
    content: { padding: 30, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    desc: { textAlign: 'center', color: '#666', marginBottom: 30, fontSize: 16 },
    btn: { backgroundColor: '#000', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
    btnText: { color: '#fff', fontWeight: 'bold' }
});